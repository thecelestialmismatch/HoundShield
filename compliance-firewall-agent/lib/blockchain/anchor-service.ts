/**
 * Blockchain Anchor Integration Service — Kaelus.online
 *
 * Bridges the existing compliance audit trail (Supabase) with
 * Base L2 blockchain anchoring. This service:
 *
 *   1. Takes a compliance event ID + seed hash
 *   2. Anchors the hash to Base L2
 *   3. Stores the tx hash back in Supabase
 *   4. Provides verification for auditors
 *
 * Non-blocking by design — blockchain anchoring failure
 * never prevents event logging.
 */

import { createServiceClient } from "@/lib/supabase/client";
import {
  anchorToBlockchain,
  verifyOnChain,
  isBlockchainEnabled,
  type AnchorResult,
  type AnchorVerification,
} from "./anchor";

export interface BlockchainAnchorRecord {
  id: string;
  event_id: string;
  event_hash: string;
  tx_hash: string;
  chain: string;
  block_number: string | null;
  verified: boolean;
  created_at: string;
}

/**
 * Anchor a compliance event to the blockchain.
 *
 * Called after the event is logged and seed-anchored in Supabase.
 * Returns null if blockchain is not configured (graceful degradation).
 */
export async function anchorComplianceEvent(
  eventId: string,
  seedHash: string
): Promise<AnchorResult | null> {
  if (!isBlockchainEnabled()) {
    return null;
  }

  try {
    const result = await anchorToBlockchain(seedHash);

    // Store the anchor record in Supabase
    const supabase = createServiceClient();
    await supabase.from("blockchain_anchors").insert({
      event_id: eventId,
      event_hash: seedHash,
      tx_hash: result.txHash,
      chain: result.chain,
      block_number: result.blockNumber?.toString() ?? null,
      verified: true,
    });

    return result;
  } catch (error) {
    console.error("Blockchain anchoring failed (event still logged):", error);
    return null;
  }
}

/**
 * Verify a compliance event's blockchain anchor.
 *
 * Used by auditors to confirm that a compliance event
 * has not been tampered with since it was anchored.
 */
export async function verifyComplianceAnchor(
  eventId: string
): Promise<AnchorVerification | null> {
  const supabase = createServiceClient();

  const { data: anchor } = await supabase
    .from("blockchain_anchors")
    .select("*")
    .eq("event_id", eventId)
    .single();

  if (!anchor) {
    return null;
  }

  const verification = await verifyOnChain(anchor.tx_hash, anchor.event_hash);

  // Update verification status
  if (verification.verified !== anchor.verified) {
    await supabase
      .from("blockchain_anchors")
      .update({ verified: verification.verified })
      .eq("id", anchor.id);
  }

  return verification;
}

/**
 * Get all blockchain anchors for a user's events.
 */
export async function getAnchorsForUser(
  userId: string,
  limit = 50
): Promise<BlockchainAnchorRecord[]> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("blockchain_anchors")
    .select("*, compliance_events!inner(user_id)")
    .eq("compliance_events.user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as unknown as BlockchainAnchorRecord[];
}

/**
 * Get blockchain anchor stats for a user.
 */
export async function getAnchorStats(userId: string) {
  const supabase = createServiceClient();

  const { count: totalAnchored } = await supabase
    .from("blockchain_anchors")
    .select("*, compliance_events!inner(user_id)", { count: "exact", head: true })
    .eq("compliance_events.user_id", userId);

  const { count: totalVerified } = await supabase
    .from("blockchain_anchors")
    .select("*, compliance_events!inner(user_id)", { count: "exact", head: true })
    .eq("compliance_events.user_id", userId)
    .eq("verified", true);

  return {
    totalAnchored: totalAnchored ?? 0,
    totalVerified: totalVerified ?? 0,
    blockchainEnabled: isBlockchainEnabled(),
  };
}
