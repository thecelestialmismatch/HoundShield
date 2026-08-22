import { createHash } from "crypto";
import { createServiceClient } from "@/lib/supabase/client";

/**
 * Cryptographic Seed Anchoring
 *
 * This module replaces "Vanar Neutron Seeds" with a standard,
 * free implementation that achieves the same goals:
 *
 * 1. Every critical event gets a SHA-256 hash of its content.
 * 2. Each hash chains to the previous one (linked list), creating
 *    an append-only integrity chain similar to a blockchain.
 * 3. Periodic merkle roots batch-verify large sets of events.
 * 4. Any tampering breaks the chain and is detectable.
 *
 * This is cryptographically equivalent to "seeds" but uses
 * Node.js built-in crypto (zero cost, no external dependencies).
 */

export interface SeedData {
  entity_type: string;
  entity_id: string;
  content: Record<string, unknown>;
}

/** Postgres unique_violation — another writer claimed this parent first. */
const UNIQUE_VIOLATION = "23505";

/** Postgres undefined_column — migration 038 is not applied on this database. */
const UNDEFINED_COLUMN = "42703";

/**
 * The column that gives the chain a total order.
 *
 * `seq` (migration 038) is monotonic and assigned by the database. `created_at`
 * is a TRANSACTION timestamp, so two anchors written concurrently can tie and
 * then sort against the true chain order — which `verifySeedChain` pass 1
 * reports as CHAIN_BROKEN on a chain that is perfectly intact. A false
 * tampering signal is the worst failure mode this product has.
 *
 * WHY THIS IS PROBED RATHER THAN ASSUMED. Migrations in this repo have
 * repeatedly sat unapplied in production (see `/api/health`, which reports
 * missing control stores for exactly this reason). Ordering by a column that
 * does not exist fails the query, and this read is on the audit WRITE path —
 * a hard dependency would stop compliance events being anchored at all. So the
 * first query optimistically uses `seq`, and a 42703 downgrades to `created_at`
 * with a loud warning rather than taking audit logging down.
 *
 * Cached per process. A deploy or cold start re-probes, so applying 038
 * upgrades every instance without a code change.
 */
let chainOrderColumn: "seq" | "created_at" = "seq";

function downgradeChainOrder(): void {
  if (chainOrderColumn === "created_at") return;
  chainOrderColumn = "created_at";
  console.warn(
    "[seed-anchor] seed_anchors.seq is missing — ordering the audit chain by " +
      "created_at instead. Apply migration 038. Until then, concurrent anchors " +
      "can tie on created_at and verifySeedChain can report CHAIN_BROKEN on an " +
      "intact chain."
  );
}

/**
 * Attempts before giving up rather than spinning on a contended chain.
 *
 * Only one writer can win each round, so N simultaneous writers need up to N
 * rounds to all land. This budget is therefore the supported burst width for
 * a single chain. Retries are paced by the database round-trip itself, so no
 * backoff is needed.
 *
 * ponytail: one chain per entity_type means every tenant contends on the same
 * tip. Per-tenant chains would divide contention by tenant count, but that
 * needs a user_id column and a re-link of every historical previous_hash.
 */
const MAX_CHAIN_ATTEMPTS = 10;

/**
 * Creates a cryptographic anchor (seed) for a compliance entity.
 *
 * The hash covers the entity content + the previous seed hash,
 * forming an integrity chain. If any record is modified after
 * the fact, the chain breaks and verification fails.
 *
 * Reading the chain tip and writing the next link are two statements, so two
 * concurrent callers can read the same tip. The unique indexes added in
 * migration 029 make that outcome unrepresentable: the losing writer gets a
 * 23505 instead of forking the chain, and re-links against the new tip here.
 * The constraint — not this loop — is what guarantees a single chain, so a
 * writer that bypasses this function still cannot fork it.
 */
export async function createSeedAnchor(data: SeedData): Promise<string> {
  const supabase = createServiceClient();
  const contentString = JSON.stringify(data.content, Object.keys(data.content).sort());

  for (let attempt = 0; attempt < MAX_CHAIN_ATTEMPTS; attempt++) {
    // Get the most recent seed to chain from. A read failure must never be
    // read as "the chain is empty" — that would start a second genesis
    // mid-chain, which verification reports as tampering.
    const readTip = (column: "seq" | "created_at") =>
      supabase
        .from("seed_anchors")
        .select("content_hash")
        .eq("entity_type", data.entity_type)
        .order(column, { ascending: false })
        .limit(1)
        .maybeSingle();

    let { data: lastSeed, error: readError } = await readTip(chainOrderColumn);

    // Migration 038 not applied here — retry on the pre-038 ordering rather
    // than failing the write. See `chainOrderColumn`.
    if (readError?.code === UNDEFINED_COLUMN) {
      downgradeChainOrder();
      ({ data: lastSeed, error: readError } = await readTip(chainOrderColumn));
    }

    if (readError) {
      console.error("Failed to read seed chain tip:", readError);
      throw new Error(`Seed anchor read failed: ${readError.message}`);
    }

    const previousHash = lastSeed?.content_hash ?? "GENESIS";

    // Hash = SHA-256(entity_content + previous_hash)
    const hashInput = contentString + "|" + previousHash;
    const contentHash = createHash("sha256").update(hashInput).digest("hex");

    // Store the anchor. `content` records the exact object that was hashed —
    // written alongside the hash expression, never into it (migration 030), so
    // pre-030 anchors stay byte-identical and chains spanning the migration
    // still link. Without it there is nothing to re-derive the hash from and
    // nothing to compare the live source row against.
    const { error } = await supabase.from("seed_anchors").insert({
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      content: data.content,
      content_hash: contentHash,
      previous_hash: previousHash === "GENESIS" ? null : previousHash,
      verification_status: "VALID",
    });

    if (!error) {
      return contentHash;
    }

    if (error.code !== UNIQUE_VIOLATION) {
      console.error("Failed to create seed anchor:", error);
      throw new Error(`Seed anchor creation failed: ${error.message}`);
    }
  }

  throw new Error(
    `Seed anchor creation failed: chain for "${data.entity_type}" stayed contended after ${MAX_CHAIN_ATTEMPTS} attempts`
  );
}

/**
 * Fields of an EVENT anchor that mirror a `compliance_events` column, and are
 * therefore checkable against the live row.
 *
 * `timestamp` is deliberately absent. The anchored value is
 * `new Date().toISOString()` taken when the anchor was built; the row carries
 * `created_at`, a separate `now()` from the insert. They are different instants
 * by design, so comparing them would report tampering on every healthy row.
 */
const EVENT_SOURCE_FIELDS = [
  "prompt_hash",
  "risk_level",
  "action_taken",
  "classifications",
] as const;

/**
 * Compares one anchored field against its live column.
 *
 * Arrays (`classifications`) are compared as sorted multisets: an added,
 * removed or substituted classification fails, a pure reordering does not.
 * Order carries no compliance meaning and is not guaranteed stable across a
 * Postgres `text[]` round-trip, so treating it as tampering would cry wolf.
 */
function fieldMatches(anchored: unknown, live: unknown): boolean {
  if (Array.isArray(anchored) || Array.isArray(live)) {
    if (!Array.isArray(anchored) || !Array.isArray(live)) return false;
    if (anchored.length !== live.length) return false;
    const a = [...anchored].map(String).sort();
    const b = [...live].map(String).sort();
    return a.every((value, i) => value === b[i]);
  }
  return anchored === live;
}

export type SeedChainErrorType =
  | "FETCH_ERROR"
  | "CHAIN_BROKEN"
  | "CONTENT_TAMPERED"
  | "SOURCE_TAMPERED"
  | "SOURCE_MISSING";

export interface SeedChainVerification {
  valid: boolean;
  checked: number;
  /**
   * Anchors carrying no stored `content` — every anchor written before
   * migration 030. Their hash cannot be re-derived and their source row cannot
   * be cross-checked, so they are counted here and NEVER folded into a pass.
   * A skipped check that reads as a passed check is the defect this function
   * was fixed to close.
   */
  unverifiable: number;
  /** EVENT anchors whose live `compliance_events` row was re-read and compared. */
  source_checked: number;
  broken_at?: string;
  error_type?: SeedChainErrorType;
  /** Which field diverged, on SOURCE_TAMPERED. */
  detail?: string;
}

/**
 * Verifies the integrity of the seed chain for a given entity type.
 *
 * Three passes, and each proves something different. Stated precisely, because
 * the previous docstring claimed a detection the code did not perform:
 *
 *   1. Chain linkage — each record's previous_hash matches the prior record's
 *      content_hash. Detects a DELETED or REORDERED anchor. Proves nothing
 *      about the audit log's contents.
 *
 *   2. Content integrity — re-derives SHA-256(content + previous_hash) from the
 *      stored `content` and compares it to `content_hash`. Detects an edit to
 *      the anchor row itself. This pass had NEVER executed before migration
 *      030: it was guarded by `if (seed.content ...)` and no `content` column
 *      existed, so it silently skipped every row.
 *
 *      Its blind spot, named rather than hidden: the hash expression passes
 *      `Object.keys(content).sort()` as a JSON.stringify replacer ARRAY, which
 *      is a recursive key allowlist. Keys nested inside a child object are
 *      therefore absent from the hashed string, so editing e.g.
 *      POLICY `content.changes.severity` does not move `content_hash`. Fixing
 *      that means changing the hash input, which would orphan every existing
 *      anchor — see the "hash format compatibility" test. EVENT content has no
 *      nested objects (`classifications` is an array, and replacer arrays do
 *      not filter array elements), so EVENT anchors are unaffected.
 *
 *   3. Source integrity — for EVENT anchors, re-reads the live
 *      `compliance_events` row and compares it field-by-field to what was
 *      anchored. THIS is the pass that detects the attack the product is sold
 *      against: someone editing a logged violation after the fact, or deleting
 *      the row outright. Passes 1 and 2 are both blind to it, because neither
 *      ever looks outside `seed_anchors`.
 *
 *      EVENT only, by design. POLICY / REPORT / HITL anchors record an
 *      OPERATION (a diff, an approval, a period summary), not a snapshot of a
 *      row, so there is no row whose current state they should still equal.
 *      Those anchors get passes 1 and 2; `source_checked` reports how many
 *      anchors actually reached pass 3 so the difference is visible rather
 *      than assumed.
 *
 * Fails closed. Any read error is a verification failure, never a pass.
 * Returns the first broken link found.
 */
export async function verifySeedChain(
  entityType: string,
  limit = 100
): Promise<SeedChainVerification> {
  const supabase = createServiceClient();

  // Pass 1 asserts row N's previous_hash equals row N+1's content_hash, so the
  // ORDER IS THE TEST. Ordering by anything that can tie turns ordinary
  // concurrency into a CHAIN_BROKEN verdict on an intact chain.
  const readChain = (column: "seq" | "created_at") =>
    supabase
      .from("seed_anchors")
      .select("*")
      .eq("entity_type", entityType)
      .order(column, { ascending: false })
      .limit(limit);

  let { data: seeds, error } = await readChain(chainOrderColumn);

  if (error?.code === UNDEFINED_COLUMN) {
    downgradeChainOrder();
    ({ data: seeds, error } = await readChain(chainOrderColumn));
  }

  if (error || !seeds) {
    return {
      valid: false,
      checked: 0,
      unverifiable: 0,
      source_checked: 0,
      broken_at: "FETCH_ERROR",
      error_type: "FETCH_ERROR",
    };
  }

  const unverifiable = seeds.filter((seed) => !seed.content).length;
  const base = { checked: seeds.length, unverifiable, source_checked: 0 };

  // Pass 1: chain linkage.
  for (let i = 0; i < seeds.length - 1; i++) {
    const current = seeds[i];
    const next = seeds[i + 1]; // older record

    if (current.previous_hash !== next.content_hash) {
      return {
        ...base,
        valid: false,
        checked: i + 1,
        broken_at: current.id,
        error_type: "CHAIN_BROKEN",
      };
    }
  }

  // Pass 2: re-derive each hash from the content that produced it.
  for (let i = seeds.length - 1; i >= 0; i--) {
    const seed = seeds[i];
    if (!seed.content || !seed.content_hash) continue; // counted in `unverifiable`

    const content = seed.content as Record<string, unknown>;
    const previousHash = seed.previous_hash ?? "GENESIS";
    const contentString = JSON.stringify(content, Object.keys(content).sort());
    const expectedHash = createHash("sha256")
      .update(contentString + "|" + previousHash)
      .digest("hex");

    if (expectedHash !== seed.content_hash) {
      return {
        ...base,
        valid: false,
        checked: seeds.length - i,
        broken_at: seed.id,
        error_type: "CONTENT_TAMPERED",
      };
    }
  }

  // Pass 3: compare EVENT anchors to the live compliance_events rows.
  if (entityType !== "EVENT") {
    return { ...base, valid: true };
  }

  const anchored = seeds.filter(
    (seed): seed is typeof seed & { content: Record<string, unknown> } =>
      Boolean(seed.content)
  );
  if (anchored.length === 0) {
    return { ...base, valid: true };
  }

  const { data: events, error: eventsError } = await supabase
    .from("compliance_events")
    .select("id, prompt_hash, risk_level, action_taken, classifications")
    .in(
      "id",
      anchored.map((seed) => seed.entity_id)
    );

  // Fail closed: an unreadable source table cannot prove anything, and reporting
  // "valid" here would be the same class of lie this function was fixed to stop.
  if (eventsError || !events) {
    return {
      ...base,
      valid: false,
      broken_at: "FETCH_ERROR",
      error_type: "FETCH_ERROR",
    };
  }

  const byId = new Map(
    (events as Array<Record<string, unknown>>).map((row) => [row.id as string, row])
  );

  for (const seed of anchored) {
    const live = byId.get(seed.entity_id);

    // A logged violation whose row is gone is the loudest tampering signal
    // there is — deleting the evidence. Pass 1 cannot see it: seed_anchors is
    // untouched and the chain still links.
    if (!live) {
      return {
        ...base,
        valid: false,
        source_checked: anchored.length,
        broken_at: seed.id,
        error_type: "SOURCE_MISSING",
        detail: `compliance_events row ${seed.entity_id} is missing`,
      };
    }

    for (const field of EVENT_SOURCE_FIELDS) {
      if (!(field in seed.content)) continue; // not anchored, so not checkable
      if (!fieldMatches(seed.content[field], live[field])) {
        return {
          ...base,
          valid: false,
          source_checked: anchored.length,
          broken_at: seed.id,
          error_type: "SOURCE_TAMPERED",
          detail: `${field} was "${String(seed.content[field])}" when anchored, is "${String(live[field])}" now`,
        };
      }
    }
  }

  return { ...base, valid: true, source_checked: anchored.length };
}

/**
 * Computes a merkle root for a batch of seed hashes.
 * Used for periodic batch verification in audit reports.
 */
export function computeMerkleRoot(hashes: string[]): string {
  if (hashes.length === 0) return createHash("sha256").update("EMPTY").digest("hex");
  if (hashes.length === 1) return hashes[0];

  const nextLevel: string[] = [];
  for (let i = 0; i < hashes.length; i += 2) {
    const left = hashes[i];
    const right = i + 1 < hashes.length ? hashes[i + 1] : left;
    const combined = createHash("sha256")
      .update(left + right)
      .digest("hex");
    nextLevel.push(combined);
  }

  return computeMerkleRoot(nextLevel);
}
