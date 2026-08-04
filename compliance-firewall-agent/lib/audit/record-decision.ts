import { createHash } from "crypto";
import { logComplianceEvent } from "./logger";
import { handleQuarantine } from "@/lib/quarantine/handler";
import type {
  ActionTaken,
  ClassificationResult,
  InterceptedRequest,
} from "@/lib/supabase/types";

/**
 * The single write path for "the gateway made a decision about a prompt".
 *
 * WHY THIS EXISTS — the bug it closes:
 *
 * HoundShield had two gateway rails and neither produced a usable audit trail.
 *
 *   1. `POST /api/v1/chat/completions` — the OpenAI-compatible proxy that IS
 *      the product, the URL customers point their client at — scanned every
 *      prompt, decided ALLOWED/BLOCKED/QUARANTINED, returned an
 *      `X-HoundShield-Request-Id` documented as "opaque request identifier for
 *      audit lookup" … and wrote nothing. There was no row to look up. The
 *      `compliance_events` table stayed empty no matter how much a customer
 *      used the product, which is why the Command Center dashboard was empty:
 *      not "no traffic yet", but "traffic is never recorded".
 *
 *   2. `POST /api/gateway/intercept` did record — twice. `handleQuarantine`
 *      inserted its own `compliance_events` row and then `logComplianceEvent`
 *      inserted a second for the same prompt, so every quarantined request
 *      double-counted in every total, chart and export.
 *
 * On a product sold as CMMC/DFARS evidence — where the SHA-256 hash-chained
 * audit log IS the deliverable — an unwritten event is worse than a wrong
 * chart. Both rails now funnel through here, so there is exactly one row per
 * decision and exactly one place to change if that ever needs to be true
 * differently.
 *
 * FAILURE POLICY — deliberate, and the opposite of the rest of this codebase:
 *
 * This function never throws. A proxy that 500s its customer's production AI
 * traffic because the audit database blipped is a worse outage than a gap in
 * the log, and the safety decision has already been made and enforced by the
 * caller before we are called — a BLOCKED prompt is still blocked whether or
 * not this write lands. So we degrade instead: return the failure, and let the
 * caller disclose it (the gateway sets `X-HoundShield-Audit: degraded`) rather
 * than let anyone believe a request was recorded when it was not.
 */

/** Everything needed to record one interception decision. */
export interface GatewayDecision {
  /** Server-resolved user id. NEVER a client-supplied header — see api-key.ts. */
  userId: string;
  /** Raw prompt text. Hashed here; only the hash and the metadata are stored. */
  prompt: string;
  /** Destination LLM provider, e.g. "openai". */
  destination: string;
  classification: ClassificationResult;
  action: ActionTaken;
  processingTimeMs: number;
  /** The gateway's own request id, so a customer can tie a response header to
   *  a queue entry. Display/reference only. */
  requestId: string;
}

export interface RecordedDecision {
  /** The `compliance_events` row id, or null when the write failed. */
  eventId: string | null;
  /** The `quarantine_queue` row id, when this decision was quarantined. */
  quarantineId: string | null;
  /** Null on success. Set (and logged) when the audit write degraded. */
  error: string | null;
}

/** SHA-256 of the prompt. The prompt itself is never persisted by this path —
 *  only `handleQuarantine` stores content, and only encrypted, only when a
 *  human has to review it. */
function hashPrompt(prompt: string): string {
  return createHash("sha256").update(prompt).digest("hex");
}

export async function recordGatewayDecision(
  decision: GatewayDecision
): Promise<RecordedDecision> {
  const {
    userId,
    prompt,
    destination,
    classification,
    action,
    processingTimeMs,
    requestId,
  } = decision;

  try {
    // One event per decision, always — including ALLOWED. "Nothing was
    // detected" is itself the evidence an assessor asks for; a log that only
    // contains violations cannot show that the control was operating.
    const eventId = await logComplianceEvent({
      user_id: userId,
      prompt_hash: hashPrompt(prompt),
      destination_provider: destination,
      risk_level: classification.risk_level,
      classifications: classification.classifications,
      action_taken: action,
      confidence_score: classification.confidence,
      detected_entities: classification.entities,
      processing_time_ms: processingTimeMs,
    });

    if (action !== "QUARANTINED") {
      return { eventId, quarantineId: null, error: null };
    }

    // Quarantine attaches a review queue entry to the event we just wrote — it
    // no longer creates a rival event of its own.
    const request: InterceptedRequest = {
      prompt,
      user_id: userId,
      destination,
      timestamp: new Date().toISOString(),
      request_id: requestId,
    };
    const quarantineId = await handleQuarantine(request, classification, eventId);
    return { eventId, quarantineId, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "audit write failed";
    // Surfaced to Sentry via console.error, and to the caller via the return —
    // never swallowed silently, and never rethrown into the proxy path.
    console.error(
      `[audit/record-decision/${requestId}] audit write degraded:`,
      err
    );
    return { eventId: null, quarantineId: null, error: message };
  }
}
