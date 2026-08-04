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
 * Attaches a human-review queue entry to an ALREADY-RECORDED compliance event.
 *
 * 1. Encrypts the prompt content (AES-256-CBC) so it's stored safely.
 * 2. Inserts into the quarantine_queue, referencing `eventId`.
 *
 * The prompt is never stored in plaintext — even DB admins can't
 * read quarantined content without the ENCRYPTION_KEY.
 *
 * `eventId` IS THE FIX for a double-count bug, and is why this function no
 * longer writes an event of its own. It used to insert a `compliance_events`
 * row, and its only caller (`interceptLLMRequest`) then called
 * `logComplianceEvent`, which inserted a second row for the same prompt. Every
 * quarantined request therefore counted twice in every dashboard total, chart,
 * and audit export — on a product whose deliverable is the audit log. The
 * caller now writes the single event and hands the id down.
 *
 * Callers should reach this through `recordGatewayDecision`
 * (lib/audit/record-decision.ts) rather than calling it directly, so that the
 * event-then-queue ordering stays in one place.
 */
export async function handleQuarantine(
  request: InterceptedRequest,
  classification: ClassificationResult,
  eventId: string
): Promise<string> {
  const supabase = createServiceClient();

  // Encrypt the full prompt
  const encrypted = encrypt(request.prompt);

  // Insert into quarantine queue
  const { data: quarantine, error: quarantineError } = await supabase
    .from("quarantine_queue")
    .insert({
      event_id: eventId,
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
