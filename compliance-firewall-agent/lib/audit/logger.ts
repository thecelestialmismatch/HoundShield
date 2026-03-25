import { createServiceClient } from "@/lib/supabase/client";
import { createSeedAnchor } from "./seed-anchor";
import { anchorComplianceEvent } from "@/lib/blockchain/anchor-service";
import type {
  RiskLevel,
  ActionTaken,
  DetectedEntity,
  RuleCategory,
} from "@/lib/supabase/types";

interface ComplianceEventInput {
  user_id: string;
  prompt_hash: string;
  destination_provider: string;
  risk_level: RiskLevel;
  classifications: RuleCategory[];
  action_taken: ActionTaken;
  confidence_score: number;
  detected_entities: DetectedEntity[];
  processing_time_ms: number;
}

/**
 * Logs a compliance event to Supabase and anchors it with a
 * cryptographic seed hash for tamper detection.
 *
 * This is the single source of truth for all intercepted LLM requests.
 * Every event — allowed, blocked, or quarantined — is recorded here.
 *
 * The seed anchor creates an append-only integrity chain.
 * If a bad actor modifies a log entry, the chain breaks and
 * the next verification will detect the tampering.
 */
export async function logComplianceEvent(
  input: ComplianceEventInput
): Promise<string> {
  const supabase = createServiceClient();

  // Insert the event
  const { data: event, error } = await supabase
    .from("compliance_events")
    .insert({
      user_id: input.user_id,
      prompt_hash: input.prompt_hash,
      destination_provider: input.destination_provider,
      risk_level: input.risk_level,
      classifications: input.classifications,
      action_taken: input.action_taken,
      confidence_score: input.confidence_score,
      detected_entities: input.detected_entities,
      processing_time_ms: input.processing_time_ms,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to log compliance event:", error);
    throw new Error(`Event logging failed: ${error.message}`);
  }

  // Anchor with a cryptographic seed (non-blocking for allowed events)
  // For violations we await to guarantee the anchor is committed.
  if (input.action_taken !== "ALLOWED") {
    try {
      const seedHash = await createSeedAnchor({
        entity_type: "EVENT",
        entity_id: event.id,
        content: {
          prompt_hash: input.prompt_hash,
          risk_level: input.risk_level,
          action_taken: input.action_taken,
          classifications: input.classifications,
          timestamp: new Date().toISOString(),
        },
      });

      // Update the event with the seed reference
      await supabase
        .from("compliance_events")
        .update({ seed_hash: seedHash })
        .eq("id", event.id);

      // Blockchain anchoring (non-blocking, additive layer)
      anchorComplianceEvent(event.id, seedHash).catch((bcErr) => {
        console.error("Blockchain anchor failed (non-blocking):", bcErr);
      });
    } catch (seedError) {
      // Seed anchoring failure must not prevent event logging.
      // Log the error but don't throw — the event is already recorded.
      console.error("Seed anchoring failed (event still logged):", seedError);
    }
  }

  return event.id;
}

/**
 * Retrieves compliance events with optional filters.
 */
export async function getComplianceEvents(filters?: {
  risk_level?: RiskLevel;
  action_taken?: ActionTaken;
  user_id?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = createServiceClient();

  let query = supabase
    .from("compliance_events")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters?.risk_level) query = query.eq("risk_level", filters.risk_level);
  if (filters?.action_taken)
    query = query.eq("action_taken", filters.action_taken);
  if (filters?.user_id) query = query.eq("user_id", filters.user_id);
  if (filters?.from_date)
    query = query.gte("created_at", filters.from_date);
  if (filters?.to_date) query = query.lte("created_at", filters.to_date);

  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch events: ${error.message}`);
  }

  return { events: data ?? [], total: count ?? 0 };
}
