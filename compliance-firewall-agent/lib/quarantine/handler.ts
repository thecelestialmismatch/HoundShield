import { createServiceClient } from "@/lib/supabase/client";
import { encrypt } from "./encryption";
import type {
  InterceptedRequest,
  ClassificationResult,
  RiskLevel,
} from "@/lib/supabase/types";

// Priority mapping — CRITICAL events surface first in the review queue
const PRIORITY_MAP: Record<RiskLevel, number> = {
  NONE: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

/**
 * Handles quarantining of a flagged LLM request.
 *
 * 1. Encrypts the prompt content (AES-256-CBC) so it's stored safely.
 * 2. Creates a compliance_event record.
 * 3. Inserts into the quarantine_queue for human review.
 *
 * The prompt is never stored in plaintext — even DB admins can't
 * read quarantined content without the ENCRYPTION_KEY.
 */
export async function handleQuarantine(
  request: InterceptedRequest,
  classification: ClassificationResult
): Promise<string> {
  const supabase = createServiceClient();

  // Encrypt the full prompt
  const encrypted = encrypt(request.prompt);

  // Create the compliance event first (quarantine references it)
  const { data: event, error: eventError } = await supabase
    .from("compliance_events")
    .insert({
      user_id: request.user_id,
      prompt_hash: hashString(request.prompt),
      destination_provider: request.destination,
      risk_level: classification.risk_level,
      classifications: classification.classifications,
      action_taken: "QUARANTINED",
      confidence_score: classification.confidence,
      detected_entities: classification.entities,
      processing_time_ms: 0, // will be updated by the caller
    })
    .select("id")
    .single();

  if (eventError) {
    console.error("Failed to create compliance event:", eventError);
    throw new Error(`Compliance event creation failed: ${eventError.message}`);
  }

  // Insert into quarantine queue
  const { data: quarantine, error: quarantineError } = await supabase
    .from("quarantine_queue")
    .insert({
      event_id: event.id,
      prompt_content_encrypted: encrypted.ciphertext,
      encryption_iv: encrypted.iv,
      detected_entities: classification.entities,
      review_status: "PENDING",
      priority: PRIORITY_MAP[classification.risk_level],
    })
    .select("id")
    .single();

  if (quarantineError) {
    console.error("Failed to create quarantine entry:", quarantineError);
    throw new Error(
      `Quarantine entry creation failed: ${quarantineError.message}`
    );
  }

  return quarantine.id;
}

/**
 * Reviews a quarantined item — either approves (releases) or rejects it.
 *
 * This is a HITL operation: only called after a compliance officer
 * makes a decision through the dashboard.
 */
export async function reviewQuarantineItem(
  quarantineId: string,
  decision: "APPROVED" | "REJECTED",
  reviewerId: string,
  notes?: string
): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("quarantine_queue")
    .update({
      review_status: decision,
      reviewer_id: reviewerId,
      reviewed_at: new Date().toISOString(),
      resolution_notes: notes ?? null,
    })
    .eq("id", quarantineId);

  if (error) {
    throw new Error(`Quarantine review failed: ${error.message}`);
  }
}

/**
 * Fetches pending quarantine items, ordered by priority (highest first).
 */
export async function getPendingQuarantineItems(limit = 50) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("quarantine_queue")
    .select("*, compliance_events(*)")
    .eq("review_status", "PENDING")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch quarantine items: ${error.message}`);
  }

  return data;
}

function hashString(input: string): string {
  const { createHash } = require("crypto");
  return createHash("sha256").update(input).digest("hex");
}
