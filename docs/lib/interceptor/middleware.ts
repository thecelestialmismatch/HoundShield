import { createHash } from "crypto";
import { parseInterceptRequest } from "./request-parser";
import { classifyRisk } from "@/lib/classifier/risk-engine";
import { handleQuarantine } from "@/lib/quarantine/handler";
import { logComplianceEvent } from "@/lib/audit/logger";
import type {
  InterceptedRequest,
  ClassificationResult,
  ActionTaken,
} from "@/lib/supabase/types";

export interface InterceptResult {
  allowed: boolean;
  action: ActionTaken;
  request_id: string;
  risk_level: string;
  classifications: string[];
  message: string;
  processing_time_ms: number;
}

/**
 * Core interception pipeline.
 *
 * Flow:
 *   1. Parse the inbound request to extract the prompt and metadata.
 *   2. Run the risk classifier to detect sensitive data.
 *   3. Decide action (allow / block / quarantine).
 *   4. If quarantined, encrypt and store for review.
 *   5. Log the compliance event with a cryptographic anchor.
 *   6. Return the decision to the caller.
 *
 * Design tradeoff: We run classification synchronously so that no
 * sensitive prompt ever leaves the boundary before being inspected.
 * This adds latency (~50-150 ms) but guarantees real-time blocking.
 */
export async function interceptLLMRequest(
  body: Record<string, unknown>,
  headers: Record<string, string>,
  userId: string
): Promise<InterceptResult> {
  const startTime = performance.now();

  // Step 1 — Parse
  const request: InterceptedRequest = parseInterceptRequest(
    body,
    headers,
    userId
  );

  // Step 2 — Classify
  const classification: ClassificationResult = await classifyRisk(
    request.prompt
  );

  // Step 3 — Decide
  const action = decideAction(classification);

  // Step 4 — Quarantine if needed
  if (action === "QUARANTINED") {
    await handleQuarantine(request, classification);
  }

  const processingTime = Math.round(performance.now() - startTime);

  // Step 5 — Log
  const promptHash = createHash("sha256")
    .update(request.prompt)
    .digest("hex");

  await logComplianceEvent({
    user_id: request.user_id,
    prompt_hash: promptHash,
    destination_provider: request.destination,
    risk_level: classification.risk_level,
    classifications: classification.classifications,
    action_taken: action,
    confidence_score: classification.confidence,
    detected_entities: classification.entities,
    processing_time_ms: processingTime,
  });

  // Step 6 — Return
  return {
    allowed: action === "ALLOWED",
    action,
    request_id: request.request_id,
    risk_level: classification.risk_level,
    classifications: classification.classifications,
    message: buildUserMessage(action, classification),
    processing_time_ms: processingTime,
  };
}

/**
 * Maps a classification result to an action.
 *
 * Decision matrix:
 *   CRITICAL / should_block  -> BLOCKED
 *   HIGH     / should_quarantine -> QUARANTINED
 *   MEDIUM   / should_quarantine -> QUARANTINED
 *   LOW / NONE              -> ALLOWED
 */
function decideAction(classification: ClassificationResult): ActionTaken {
  if (classification.should_block) return "BLOCKED";
  if (classification.should_quarantine) return "QUARANTINED";
  return "ALLOWED";
}

function buildUserMessage(
  action: ActionTaken,
  classification: ClassificationResult
): string {
  switch (action) {
    case "BLOCKED":
      return `Request blocked: ${classification.classifications.join(", ")} data detected with ${Math.round(classification.confidence * 100)}% confidence. ${classification.entities.length} sensitive entities found.`;
    case "QUARANTINED":
      return `Request quarantined for review: ${classification.classifications.join(", ")} data detected. A compliance officer will review this request.`;
    case "ALLOWED":
      return "Request allowed.";
  }
}
