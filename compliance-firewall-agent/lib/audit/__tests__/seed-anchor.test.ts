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
  entity_type: string;
  entity_id: string;
  content_hash: string;
  previous_hash: string | null;
  verification_status: string;
}

interface PostgrestErrorLike {
  code: string;
  message: string;
}

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
  insertAttempts = 0;
  readError: PostgrestErrorLike | null = null;
  alwaysConflict = false;

  private seq = 0;

  constructor(private readonly enforceChainIndexes = true) {}

  /** Appends a row directly, bypassing the writer under test. */
  seed(row: Omit<AnchorRow, "id" | "created_at" | "verification_status">): AnchorRow {
    const stored: AnchorRow = {
      id: `anchor-${this.seq}`,
      created_at: new Date(BASE_TIME + this.seq).toISOString(),
      verification_status: "VALID",
      ...row,
    };
    this.seq += 1;
    this.rows.push(stored);
    return stored;
  }

  /** Rows newest-first, the order `order("created_at", { ascending: false })` gives. */
  private read(entityType: string, limit: number): AnchorRow[] {
    return this.rows
      .filter((row) => row.entity_type === entityType)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }

  private write(row: Omit<AnchorRow, "id" | "created_at">): { error: PostgrestErrorLike | null } {
    this.insertAttempts += 1;

    const conflicts =
      this.alwaysConflict ||
      (this.enforceChainIndexes &&
        this.rows.some(
          (existing) =>
            existing.entity_type === row.entity_type &&
            existing.previous_hash === row.previous_hash
        ));

    if (conflicts) {
      return {
        error: {
          code: "23505",
          message:
            'duplicate key value violates unique constraint "idx_seed_anchors_chain_link"',
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
        if (table !== "seed_anchors") throw new Error(`unexpected table: ${table}`);
        return {
          select: () => {
            let entityType = "";
            let limit = Number.MAX_SAFE_INTEGER;
            const builder = {
              eq: (_column: string, value: string) => {
                entityType = value;
                return builder;
              },
              order: () => builder,
              limit: (n: number) => {
                limit = n;
                return builder;
              },
              maybeSingle: async () =>
                this.readError
                  ? { data: null, error: this.readError }
                  : { data: this.read(entityType, limit)[0] ?? null, error: null },
              single: async () => {
                const rows = this.read(entityType, limit);
                if (this.readError) return { data: null, error: this.readError };
                return rows.length
                  ? { data: rows[0], error: null }
                  : { data: null, error: { code: "PGRST116", message: "no rows" } };
              },
              then: (resolve: (value: unknown) => unknown) =>
                Promise.resolve(
                  this.readError
                    ? { data: null, error: this.readError }
                    : { data: this.read(entityType, limit), error: null }
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
    const writers = Array.from({ length: 8 }, (_, i) =>
      createSeedAnchor({
        entity_type: "EVENT",
        entity_id: `event-${i}`,
        content: { prompt_hash: `hash-${i}`, action_taken: "BLOCKED" },
      })
    );

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
    });
  });
});
