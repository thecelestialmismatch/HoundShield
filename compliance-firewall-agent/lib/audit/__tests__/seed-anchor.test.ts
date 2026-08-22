import { createHash } from "crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The audit hash chain is the product's tamper-evidence deliverable, so the
 * property under test is narrow and absolute: no two anchors of the same
 * entity_type may ever claim the same parent. A forked chain is what
 * verifySeedChain() reports as tampering.
 */

interface AnchorRow {
  id: string;
  created_at: string;
  /** Monotonic insert order (migration 038). */
  seq: number;
  entity_type: string;
  entity_id: string;
  content: Record<string, unknown> | null;
  content_hash: string;
  previous_hash: string | null;
  verification_status: string;
}

/** The `compliance_events` columns pass 3 re-reads. */
interface EventRow {
  id: string;
  prompt_hash: string;
  risk_level: string;
  action_taken: string;
  classifications: string[];
}

interface PostgrestErrorLike {
  code: string;
  message: string;
}

type OrderColumn = "seq" | "created_at";

/** What Postgres returns when migration 038 has not been applied. */
const UNDEFINED_COLUMN_ERROR: PostgrestErrorLike = {
  code: "42703",
  message: 'column seed_anchors.seq does not exist',
};

const BASE_TIME = Date.UTC(2026, 7, 4, 12, 0, 0);

/**
 * Stand-in for the `seed_anchors` table. It models only the two behaviours
 * this fix depends on:
 *
 *   1. Reads and writes interleave — concurrent callers can each read the tip
 *      before any of them has written, which is the race itself.
 *   2. The unique indexes from migration 029 reject the losing writer with
 *      Postgres error 23505, which is what makes the race recoverable.
 */
class FakeSeedAnchors {
  rows: AnchorRow[] = [];
  /** The `compliance_events` rows pass 3 cross-checks against. */
  events: EventRow[] = [];
  insertAttempts = 0;
  readError: PostgrestErrorLike | null = null;
  eventsReadError: PostgrestErrorLike | null = null;
  alwaysConflict = false;
  /** Simulates a database where migration 038 has not run. */
  missingSeqColumn = false;
  /** Every order() column the code under test asked for, in call order. */
  orderColumns: OrderColumn[] = [];

  private seq = 0;

  constructor(private readonly enforceChainIndexes = true) {}

  /** Appends a row directly, bypassing the writer under test. */
  seed(
    row: Omit<AnchorRow, "id" | "created_at" | "seq" | "verification_status" | "content"> &
      Partial<Pick<AnchorRow, "content" | "created_at">>
  ): AnchorRow {
    const stored: AnchorRow = {
      id: `anchor-${this.seq}`,
      created_at: new Date(BASE_TIME + this.seq).toISOString(),
      seq: this.seq,
      verification_status: "VALID",
      content: null,
      ...row,
    };
    this.seq += 1;
    this.rows.push(stored);
    return stored;
  }

  /** Adds a `compliance_events` row — the thing an attacker would edit. */
  seedEvent(row: Partial<EventRow> & Pick<EventRow, "id">): EventRow {
    const stored: EventRow = {
      prompt_hash: "unset",
      risk_level: "HIGH",
      action_taken: "BLOCKED",
      classifications: [],
      ...row,
    };
    this.events.push(stored);
    return stored;
  }

  /** Edits a live event row in place, exactly as post-hoc tampering would. */
  tamperEvent(id: string, patch: Partial<EventRow>): void {
    const index = this.events.findIndex((row) => row.id === id);
    if (index === -1) throw new Error(`no event ${id}`);
    this.events[index] = { ...this.events[index], ...patch };
  }

  /**
   * Rows newest-first under the requested ordering.
   *
   * `seq` is a total order. `created_at` is not: equal timestamps compare 0,
   * and Array#sort is stable, so tied rows keep insertion order — which is
   * OLDEST-first and therefore backwards for a newest-first read. That is
   * precisely the production hazard migration 038 removes, so the double
   * reproduces it rather than smoothing it over.
   */
  private read(entityType: string, limit: number, orderBy: OrderColumn): AnchorRow[] {
    const rows = this.rows.filter((row) => row.entity_type === entityType);
    const sorted =
      orderBy === "seq"
        ? [...rows].sort((a, b) => b.seq - a.seq)
        : [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));
    return sorted.slice(0, limit);
  }

  /**
   * The two partial unique indexes from migration 029, kept separate on
   * purpose. A single `previous_hash === previous_hash` rule would collapse
   * them via JS `null === null` and would then pass even against a schema
   * carrying only the plain unique index — under which real Postgres, treating
   * NULLs as distinct, would happily admit a second genesis row.
   */
  private violatedIndex(row: Pick<AnchorRow, "entity_type" | "previous_hash">): string | null {
    const sameChain = this.rows.filter((existing) => existing.entity_type === row.entity_type);

    if (row.previous_hash === null) {
      // idx_seed_anchors_genesis — on (entity_type) where previous_hash is null
      return sameChain.some((existing) => existing.previous_hash === null)
        ? "idx_seed_anchors_genesis"
        : null;
    }

    // idx_seed_anchors_chain_link — on (entity_type, previous_hash)
    //                               where previous_hash is not null
    return sameChain.some((existing) => existing.previous_hash === row.previous_hash)
      ? "idx_seed_anchors_chain_link"
      : null;
  }

  private write(row: Omit<AnchorRow, "id" | "created_at">): { error: PostgrestErrorLike | null } {
    this.insertAttempts += 1;

    const conflicts =
      this.alwaysConflict ||
      (this.enforceChainIndexes && this.violatedIndex(row) !== null);

    if (conflicts) {
      return {
        error: {
          code: "23505",
          message: `duplicate key value violates unique constraint "${
            this.violatedIndex(row) ?? "idx_seed_anchors_chain_link"
          }"`,
        },
      };
    }

    this.seed(row);
    return { error: null };
  }

  /** The slice of the supabase-js surface `seed-anchor.ts` actually uses. */
  client() {
    return {
      from: (table: string) => {
        // Pass 3 re-reads the source table, so the double has to serve it.
        if (table === "compliance_events") {
          return {
            select: () => ({
              in: (_column: string, ids: string[]) => ({
                then: (resolve: (value: unknown) => unknown) =>
                  Promise.resolve(
                    this.eventsReadError
                      ? { data: null, error: this.eventsReadError }
                      : {
                          data: this.events.filter((row) => ids.includes(row.id)),
                          error: null,
                        }
                  ).then(resolve),
              }),
            }),
          } as never;
        }
        if (table !== "seed_anchors") throw new Error(`unexpected table: ${table}`);
        return {
          select: () => {
            let entityType = "";
            let limit = Number.MAX_SAFE_INTEGER;
            let orderBy: OrderColumn = "created_at";
            const orderingError = (): PostgrestErrorLike | null =>
              orderBy === "seq" && this.missingSeqColumn ? UNDEFINED_COLUMN_ERROR : null;
            const builder = {
              eq: (_column: string, value: string) => {
                entityType = value;
                return builder;
              },
              order: (column: OrderColumn) => {
                orderBy = column;
                this.orderColumns.push(column);
                return builder;
              },
              limit: (n: number) => {
                limit = n;
                return builder;
              },
              maybeSingle: async () => {
                const missing = orderingError();
                if (missing) return { data: null, error: missing };
                return this.readError
                  ? { data: null, error: this.readError }
                  : { data: this.read(entityType, limit, orderBy)[0] ?? null, error: null };
              },
              single: async () => {
                const missing = orderingError();
                if (missing) return { data: null, error: missing };
                const rows = this.read(entityType, limit, orderBy);
                if (this.readError) return { data: null, error: this.readError };
                return rows.length
                  ? { data: rows[0], error: null }
                  : { data: null, error: { code: "PGRST116", message: "no rows" } };
              },
              then: (resolve: (value: unknown) => unknown) =>
                Promise.resolve(
                  orderingError()
                    ? { data: null, error: orderingError() }
                    : this.readError
                      ? { data: null, error: this.readError }
                      : { data: this.read(entityType, limit, orderBy), error: null }
                ).then(resolve),
            };
            return builder;
          },
          insert: (row: Omit<AnchorRow, "id" | "created_at">) => ({
            then: (resolve: (value: unknown) => unknown) =>
              Promise.resolve(this.write(row)).then(resolve),
          }),
        };
      },
    };
  }
}

let table: FakeSeedAnchors;

vi.mock("@/lib/supabase/client", () => ({
  createServiceClient: () => table.client(),
}));

const { createSeedAnchor, verifySeedChain } = await import("../seed-anchor");

/** The hash expression exactly as it stood before this change. */
function legacyHash(content: Record<string, unknown>, previousHash: string): string {
  const contentString = JSON.stringify(content, Object.keys(content).sort());
  return createHash("sha256")
    .update(contentString + "|" + previousHash)
    .digest("hex");
}

beforeEach(() => {
  table = new FakeSeedAnchors();
});

describe("createSeedAnchor concurrency", () => {
  it("serialises concurrent writers into one linear chain", async () => {
    const writers = Array.from({ length: 8 }, (_, i) => {
      table.seedEvent({ id: `event-${i}`, prompt_hash: `hash-${i}`, action_taken: "BLOCKED" });
      return createSeedAnchor({
        entity_type: "EVENT",
        entity_id: `event-${i}`,
        content: { prompt_hash: `hash-${i}`, action_taken: "BLOCKED" },
      });
    });

    const hashes = await Promise.all(writers);
    expect(hashes).toHaveLength(8);
    expect(new Set(hashes).size).toBe(8);

    // Oldest-first, the order the chain was built in.
    const chain = [...table.rows].sort((a, b) => a.created_at.localeCompare(b.created_at));
    expect(chain).toHaveLength(8);

    // No two anchors may claim the same parent — this is the fork assertion.
    const parents = chain.map((row) => row.previous_hash);
    expect(new Set(parents).size).toBe(parents.length);

    // Exactly one genesis, and every later link resolves to the row before it.
    expect(chain[0].previous_hash).toBeNull();
    for (let i = 1; i < chain.length; i++) {
      expect(chain[i].previous_hash).toBe(chain[i - 1].content_hash);
    }

    // The writers really did collide: more inserts were attempted than rows
    // landed. Without that, the test would pass on serial execution alone.
    expect(table.insertAttempts).toBeGreaterThan(chain.length);

    await expect(verifySeedChain("EVENT")).resolves.toMatchObject({
      valid: true,
      checked: 8,
    });
  });

  it("keeps chains for different entity types independent", async () => {
    table.seedEvent({ id: "e1" });
    await Promise.all([
      createSeedAnchor({ entity_type: "EVENT", entity_id: "e1", content: { a: 1 } }),
      createSeedAnchor({ entity_type: "POLICY", entity_id: "p1", content: { b: 2 } }),
    ]);

    expect(table.rows.filter((r) => r.previous_hash === null)).toHaveLength(2);
    await expect(verifySeedChain("EVENT")).resolves.toMatchObject({ valid: true });
    await expect(verifySeedChain("POLICY")).resolves.toMatchObject({ valid: true });
  });
});

describe("createSeedAnchor failure handling", () => {
  it("does not mistake a failed read for an empty chain", async () => {
    table.seed({
      entity_type: "EVENT",
      entity_id: "existing",
      content_hash: "a".repeat(64),
      previous_hash: null,
    });
    table.readError = { code: "57014", message: "canceling statement due to statement timeout" };

    await expect(
      createSeedAnchor({ entity_type: "EVENT", entity_id: "e2", content: { a: 1 } })
    ).rejects.toThrow(/read failed/i);

    // A swallowed read error would have written a second genesis row.
    expect(table.rows).toHaveLength(1);
  });

  it("gives up instead of spinning when the chain stays contended", async () => {
    table.alwaysConflict = true;

    await expect(
      createSeedAnchor({ entity_type: "EVENT", entity_id: "e3", content: { a: 1 } })
    ).rejects.toThrow(/contend/i);

    // Bounded — it gives up rather than spinning against the constraint.
    expect(table.insertAttempts).toBe(10);
  });

  it("surfaces a non-conflict write error instead of retrying it", async () => {
    const conflictFree = new FakeSeedAnchors(false);
    conflictFree.client = () =>
      ({
        from: () => ({
          select: () => ({
            eq: function () {
              return this;
            },
            order: function () {
              return this;
            },
            limit: function () {
              return this;
            },
            maybeSingle: async () => ({ data: null, error: null }),
          }),
          insert: () => ({
            then: (resolve: (value: unknown) => unknown) => {
              conflictFree.insertAttempts += 1;
              return Promise.resolve({
                error: { code: "42501", message: "permission denied for table seed_anchors" },
              }).then(resolve);
            },
          }),
        }),
      }) as unknown as ReturnType<FakeSeedAnchors["client"]>;
    table = conflictFree;

    await expect(
      createSeedAnchor({ entity_type: "EVENT", entity_id: "e4", content: { a: 1 } })
    ).rejects.toThrow(/permission denied/);

    expect(conflictFree.insertAttempts).toBe(1);
  });
});

describe("hash format compatibility", () => {
  it("appends to a chain written before this change without altering the hash input", async () => {
    // Two anchors laid down with the original expression.
    const first = { prompt_hash: "legacy-1", risk_level: "HIGH" };
    const firstHash = legacyHash(first, "GENESIS");
    table.seed({
      entity_type: "EVENT",
      entity_id: "legacy-1",
      content_hash: firstHash,
      previous_hash: null,
    });

    const second = { prompt_hash: "legacy-2", risk_level: "CRITICAL" };
    const secondHash = legacyHash(second, firstHash);
    table.seed({
      entity_type: "EVENT",
      entity_id: "legacy-2",
      content_hash: secondHash,
      previous_hash: firstHash,
    });

    const next = { prompt_hash: "new-1", risk_level: "HIGH" };
    table.seedEvent({ id: "new-1", prompt_hash: "new-1", risk_level: "HIGH" });
    const nextHash = await createSeedAnchor({
      entity_type: "EVENT",
      entity_id: "new-1",
      content: next,
    });

    // Byte-identical to what the pre-change code would have produced.
    expect(nextHash).toBe(legacyHash(next, secondHash));
    await expect(verifySeedChain("EVENT")).resolves.toMatchObject({
      valid: true,
      checked: 3,
      // The two pre-030 anchors are reported as uncheckable, not as passed.
      unverifiable: 2,
      source_checked: 1,
    });
  });
});

/**
 * Anchors one EVENT the way `logComplianceEvent` does — source row first, then
 * the anchor over it — and hands back the id so a test can tamper with it.
 */
async function anchorEvent(
  id: string,
  fields: Partial<EventRow> = {}
): Promise<string> {
  const event = table.seedEvent({ id, ...fields });
  await createSeedAnchor({
    entity_type: "EVENT",
    entity_id: id,
    content: {
      prompt_hash: event.prompt_hash,
      risk_level: event.risk_level,
      action_taken: event.action_taken,
      classifications: event.classifications,
      // Anchor-build time. Deliberately has no column to disagree with — see
      // EVENT_SOURCE_FIELDS.
      timestamp: new Date(BASE_TIME).toISOString(),
    },
  });
  return id;
}

describe("content integrity (pass 2)", () => {
  it("detects an edit to the anchor's own stored content", async () => {
    await anchorEvent("event-1", { prompt_hash: "abc", risk_level: "CRITICAL" });

    // Rewrite the anchored content without recomputing content_hash.
    table.rows[0].content = { ...table.rows[0].content, risk_level: "LOW" };

    await expect(verifySeedChain("EVENT")).resolves.toMatchObject({
      valid: false,
      error_type: "CONTENT_TAMPERED",
      broken_at: table.rows[0].id,
    });
  });

  it("reports pre-030 anchors as unverifiable rather than folding them into a pass", async () => {
    // Two anchors with no stored content — exactly what production holds today.
    const first = table.seed({
      entity_type: "EVENT",
      entity_id: "legacy-a",
      content_hash: "a".repeat(64),
      previous_hash: null,
    });
    table.seed({
      entity_type: "EVENT",
      entity_id: "legacy-b",
      content_hash: "b".repeat(64),
      previous_hash: first.content_hash,
    });

    const result = await verifySeedChain("EVENT");

    // Linkage holds, so this is not tampering — but nothing about their
    // contents was proven, and the count says so out loud. Before this fix the
    // same rows returned `{ valid: true, checked: 2 }` with no hint that the
    // content pass had skipped every one of them.
    expect(result.valid).toBe(true);
    expect(result.checked).toBe(2);
    expect(result.unverifiable).toBe(2);
    expect(result.source_checked).toBe(0);
  });
});

describe("source integrity (pass 3)", () => {
  it("FAILS when a compliance_events row is edited after anchoring", async () => {
    await anchorEvent("event-1", {
      prompt_hash: "abc",
      risk_level: "CRITICAL",
      action_taken: "BLOCKED",
      classifications: ["CUI"],
    });

    // Baseline: an untouched log verifies.
    await expect(verifySeedChain("EVENT")).resolves.toMatchObject({
      valid: true,
      source_checked: 1,
    });

    // The attack the $499 report is sold against: downgrade a logged violation
    // so it stops looking like one. `seed_anchors` is untouched, so passes 1
    // and 2 both still succeed — only the source cross-check sees this.
    table.tamperEvent("event-1", { risk_level: "LOW" });

    const result = await verifySeedChain("EVENT");
    expect(result.valid).toBe(false);
    expect(result.error_type).toBe("SOURCE_TAMPERED");
    expect(result.broken_at).toBe(table.rows[0].id);
    expect(result.detail).toMatch(/risk_level/);
    expect(result.detail).toMatch(/CRITICAL/);
    expect(result.detail).toMatch(/LOW/);
  });

  it("detects a removed classification", async () => {
    await anchorEvent("event-1", { classifications: ["CUI", "ITAR"] });
    table.tamperEvent("event-1", { classifications: ["CUI"] });

    await expect(verifySeedChain("EVENT")).resolves.toMatchObject({
      valid: false,
      error_type: "SOURCE_TAMPERED",
    });
  });

  it("detects a rewritten prompt_hash", async () => {
    await anchorEvent("event-1", { prompt_hash: "a".repeat(64) });
    table.tamperEvent("event-1", { prompt_hash: "b".repeat(64) });

    await expect(verifySeedChain("EVENT")).resolves.toMatchObject({
      valid: false,
      error_type: "SOURCE_TAMPERED",
    });
  });

  it("detects a deleted compliance_events row", async () => {
    await anchorEvent("event-1", { risk_level: "CRITICAL" });
    table.events = [];

    await expect(verifySeedChain("EVENT")).resolves.toMatchObject({
      valid: false,
      error_type: "SOURCE_MISSING",
      broken_at: table.rows[0].id,
    });
  });

  it("does not call a reordered classifications array tampering", async () => {
    await anchorEvent("event-1", { classifications: ["CUI", "ITAR"] });
    table.tamperEvent("event-1", { classifications: ["ITAR", "CUI"] });

    await expect(verifySeedChain("EVENT")).resolves.toMatchObject({ valid: true });
  });

  it("does not compare the anchor's timestamp against created_at", async () => {
    // The anchored `timestamp` is the anchor's own build time and no column
    // holds it. If it were treated as a source field, every healthy row would
    // report tampering — so this passing is the assertion.
    await anchorEvent("event-1", { risk_level: "HIGH" });

    await expect(verifySeedChain("EVENT")).resolves.toMatchObject({
      valid: true,
      source_checked: 1,
    });
  });

  it("fails closed when the source table cannot be read", async () => {
    await anchorEvent("event-1");
    table.eventsReadError = { code: "42501", message: "permission denied" };

    // An unreadable source table proves nothing. Reporting "valid" here would
    // be the same lie in a new costume.
    await expect(verifySeedChain("EVENT")).resolves.toMatchObject({
      valid: false,
      error_type: "FETCH_ERROR",
    });
  });

  it("leaves non-EVENT chains to passes 1 and 2, and says so via source_checked", async () => {
    await createSeedAnchor({
      entity_type: "POLICY",
      entity_id: "rule-1",
      content: { operation: "UPDATE", approved_by: "ops" },
    });

    // POLICY anchors record an operation, not a row snapshot — there is no row
    // whose current state they should still equal.
    await expect(verifySeedChain("POLICY")).resolves.toMatchObject({
      valid: true,
      checked: 1,
      unverifiable: 0,
      source_checked: 0,
    });
  });
});

describe("regression: the anchor records what it hashed", () => {
  it("writes content, without which passes 2 and 3 are both dead code", async () => {
    const content = { prompt_hash: "abc", risk_level: "HIGH" };
    table.seedEvent({ id: "event-1", prompt_hash: "abc", risk_level: "HIGH" });

    await createSeedAnchor({ entity_type: "EVENT", entity_id: "event-1", content });

    // The precise defect: `content` was never persisted, so `seed.content` was
    // always undefined and the content pass skipped every row in silence.
    expect(table.rows[0].content).toEqual(content);
  });
});

describe("regression: chain order is a total order, not a timestamp", () => {
  /**
   * Builds a two-link chain whose anchors share one `created_at`.
   *
   * Concurrent inserts do this routinely: `now()` in Postgres is the
   * TRANSACTION timestamp, so two transactions that begin in the same tick
   * carry the same value. Seeded oldest-first, which is the order a stable
   * sort preserves when the keys tie — and therefore backwards for a
   * newest-first read.
   */
  function seedTiedChain(): { genesisHash: string; childHash: string } {
    const tied = new Date(BASE_TIME).toISOString();
    const genesisHash = legacyHash({ n: 1 }, "GENESIS");
    const childHash = legacyHash({ n: 2 }, genesisHash);

    table.seed({
      entity_type: "EVENT",
      entity_id: "event-1",
      content: { n: 1 },
      content_hash: genesisHash,
      previous_hash: null,
      created_at: tied,
    });
    table.seed({
      entity_type: "EVENT",
      entity_id: "event-2",
      content: { n: 2 },
      content_hash: childHash,
      previous_hash: genesisHash,
      created_at: tied,
    });

    table.seedEvent({ id: "event-1" });
    table.seedEvent({ id: "event-2" });
    return { genesisHash, childHash };
  }

  it("does NOT report tampering when two anchors tie on created_at", async () => {
    seedTiedChain();

    // Pass 1 asserts row N's previous_hash equals row N+1's content_hash, so
    // the ordering IS the test. Under `seq` the chain reads newest-first and
    // verifies; this is the false-positive that would otherwise put a
    // CHAIN_BROKEN verdict in front of an assessor on an intact chain.
    const result = await verifySeedChain("EVENT");

    expect(result.error_type).toBeUndefined();
    expect(result.valid).toBe(true);
    expect(table.orderColumns).toContain("seq");
  });

  it("proves the tie really is ambiguous under created_at", async () => {
    seedTiedChain();
    table.missingSeqColumn = true; // a database without migration 038

    // Same intact chain, ordered the pre-038 way: the tie resolves backwards
    // and verification calls it tampering. This asserts the bug exists, so the
    // test above is measuring a real fix rather than a tautology.
    const result = await verifySeedChain("EVENT");

    expect(result.valid).toBe(false);
    expect(result.error_type).toBe("CHAIN_BROKEN");
  });

  it("keeps anchoring when migration 038 is not applied", async () => {
    table.missingSeqColumn = true;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    // The downgrade is cached per process so the warning fires once rather
    // than on every anchor. That makes it order-dependent across tests, so
    // take a fresh copy of the module with the cache back at its default.
    vi.resetModules();
    const fresh = await import("../seed-anchor");

    try {
      // The tip read is on the audit WRITE path. A hard dependency on an
      // unapplied migration would stop compliance events being anchored at
      // all, which is a worse failure than the ordering it fixes.
      const hash = await fresh.createSeedAnchor({
        entity_type: "EVENT",
        entity_id: "event-1",
        content: { n: 1 },
      });

      expect(hash).toMatch(/^[0-9a-f]{64}$/);
      expect(table.rows).toHaveLength(1);
      // Downgrading silently would reintroduce the defect invisibly.
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("migration 038"));
    } finally {
      warn.mockRestore();
    }
  });
});
