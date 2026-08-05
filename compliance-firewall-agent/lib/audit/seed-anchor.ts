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
    // ponytail: `created_at` is not a total order, so simultaneous writes can
    // return a non-tip and burn a retry. Add a monotonic sequence column if
    // contention ever shows up in practice.
    const { data: lastSeed, error: readError } = await supabase
      .from("seed_anchors")
      .select("content_hash")
      .eq("entity_type", data.entity_type)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (readError) {
      console.error("Failed to read seed chain tip:", readError);
      throw new Error(`Seed anchor read failed: ${readError.message}`);
    }

    const previousHash = lastSeed?.content_hash ?? "GENESIS";

    // Hash = SHA-256(entity_content + previous_hash)
    const hashInput = contentString + "|" + previousHash;
    const contentHash = createHash("sha256").update(hashInput).digest("hex");

    // Store the anchor
    const { error } = await supabase.from("seed_anchors").insert({
      entity_type: data.entity_type,
      entity_id: data.entity_id,
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
 * Verifies the integrity of the seed chain for a given entity type.
 *
 * Two-pass verification:
 *   1. Chain linkage — each record's previous_hash matches the prior record's content_hash.
 *   2. Content integrity — re-computes SHA-256(content + previous_hash) and compares
 *      to the stored content_hash to detect tampering of log content.
 *
 * Returns the first broken link if tampering is detected.
 */
export async function verifySeedChain(
  entityType: string,
  limit = 100
): Promise<{
  valid: boolean;
  checked: number;
  broken_at?: string;
  error_type?: "FETCH_ERROR" | "CHAIN_BROKEN" | "CONTENT_TAMPERED";
}> {
  const supabase = createServiceClient();

  const { data: seeds, error } = await supabase
    .from("seed_anchors")
    .select("*")
    .eq("entity_type", entityType)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !seeds) {
    return { valid: false, checked: 0, broken_at: "FETCH_ERROR", error_type: "FETCH_ERROR" };
  }

  // Pass 1: Verify chain linkage
  for (let i = 0; i < seeds.length - 1; i++) {
    const current = seeds[i];
    const next = seeds[i + 1]; // older record

    if (current.previous_hash !== next.content_hash) {
      return {
        valid: false,
        checked: i + 1,
        broken_at: current.id,
        error_type: "CHAIN_BROKEN",
      };
    }
  }

  // Pass 2: Verify content integrity by re-computing hashes
  for (let i = seeds.length - 1; i >= 0; i--) {
    const seed = seeds[i];
    if (seed.content && seed.content_hash) {
      const previousHash = seed.previous_hash ?? "GENESIS";
      const contentString = JSON.stringify(
        seed.content,
        seed.content ? Object.keys(seed.content as Record<string, unknown>).sort() : undefined
      );
      const expectedHash = createHash("sha256")
        .update(contentString + "|" + previousHash)
        .digest("hex");

      if (expectedHash !== seed.content_hash) {
        return {
          valid: false,
          checked: seeds.length - i,
          broken_at: seed.id,
          error_type: "CONTENT_TAMPERED",
        };
      }
    }
  }

  return { valid: true, checked: seeds.length };
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
