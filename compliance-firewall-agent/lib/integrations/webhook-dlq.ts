/**
 * Webhook Delivery Receipts + Dead-Letter Queue
 *
 * Problem: Slack/Teams/SIEM webhooks fail silently — no retry, no visibility.
 * Solution: Wrap every outbound webhook in this DLQ layer which:
 *   1. Attempts delivery with exponential backoff (3 retries)
 *   2. Records a delivery receipt (success or failure) in Supabase
 *   3. On permanent failure, stores the event in the dead-letter queue
 *   4. Exposes /api/v1/webhooks/dlq for ops teams to inspect + replay
 *
 * Supabase tables required (see migration 007_webhook_dlq.sql):
 *   webhook_deliveries — receipt log (success/fail/pending)
 *   webhook_dlq        — permanently failed events for manual replay
 */

import { createHash, randomUUID } from "crypto";

export type DeliveryStatus = "pending" | "delivered" | "failed" | "dead_letter";

export interface WebhookDeliveryPayload {
  /** Human-readable name of the destination (e.g. "slack-alerts", "splunk-hec") */
  destination: string;
  /** Target URL */
  url: string;
  /** HTTP headers to send */
  headers?: Record<string, string>;
  /** Request body */
  body: string;
  /** JSON metadata to attach to the receipt */
  metadata?: Record<string, unknown>;
}

export interface DeliveryReceipt {
  id: string;
  destination: string;
  url_hash: string;
  status: DeliveryStatus;
  attempts: number;
  last_status_code?: number;
  last_error?: string;
  delivered_at?: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// In-memory DLQ for environments without Supabase (fallback)
// ---------------------------------------------------------------------------

interface DlqEntry {
  id: string;
  payload: WebhookDeliveryPayload;
  attempts: number;
  last_error: string;
  created_at: string;
}

const IN_MEMORY_DLQ: DlqEntry[] = [];
const MAX_DLQ_ENTRIES = 1000;

function addToDlq(entry: DlqEntry): void {
  IN_MEMORY_DLQ.push(entry);
  // Trim oldest entries if over limit
  if (IN_MEMORY_DLQ.length > MAX_DLQ_ENTRIES) {
    IN_MEMORY_DLQ.splice(0, IN_MEMORY_DLQ.length - MAX_DLQ_ENTRIES);
  }
}

export function getDlqEntries(): DlqEntry[] {
  return [...IN_MEMORY_DLQ];
}

export function clearDlq(): void {
  IN_MEMORY_DLQ.length = 0;
}

// ---------------------------------------------------------------------------
// Core delivery function
// ---------------------------------------------------------------------------

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const NON_RETRYABLE_STATUS = new Set([400, 401, 403, 404, 422]);

/**
 * Deliver a webhook with retries, delivery receipt, and DLQ on permanent failure.
 * Never throws — all errors are handled internally.
 */
export async function deliverWebhook(
  payload: WebhookDeliveryPayload
): Promise<DeliveryReceipt> {
  const id = randomUUID();
  const urlHash = createHash("sha256").update(payload.url).digest("hex").slice(0, 16);
  const createdAt = new Date().toISOString();

  let attempts = 0;
  let lastStatusCode: number | undefined;
  let lastError: string | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    attempts = attempt + 1;
    try {
      const res = await fetch(payload.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...payload.headers,
        },
        body: payload.body,
        // 10s timeout per attempt
        signal: AbortSignal.timeout(10_000),
      });

      lastStatusCode = res.status;

      if (res.ok) {
        // Success — write receipt
        const receipt: DeliveryReceipt = {
          id,
          destination: payload.destination,
          url_hash: urlHash,
          status: "delivered",
          attempts,
          last_status_code: lastStatusCode,
          delivered_at: new Date().toISOString(),
          created_at: createdAt,
        };
        await persistReceipt(receipt, payload.metadata);
        return receipt;
      }

      // Non-retryable error
      if (NON_RETRYABLE_STATUS.has(res.status)) {
        lastError = `HTTP ${res.status} (non-retryable)`;
        break;
      }

      lastError = `HTTP ${res.status}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }

    // Wait before retry (exponential backoff)
    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, BASE_DELAY_MS * 2 ** attempt));
    }
  }

  // All retries exhausted — dead letter
  const receipt: DeliveryReceipt = {
    id,
    destination: payload.destination,
    url_hash: urlHash,
    status: "dead_letter",
    attempts,
    last_status_code: lastStatusCode,
    last_error: lastError,
    created_at: createdAt,
  };

  await persistReceipt(receipt, payload.metadata);
  addToDlq({
    id,
    payload,
    attempts,
    last_error: lastError ?? "unknown",
    created_at: createdAt,
  });

  console.error(
    `[webhook-dlq] Permanent failure for "${payload.destination}" after ${attempts} attempts: ${lastError}`
  );

  return receipt;
}

// ---------------------------------------------------------------------------
// Persistence (Supabase optional — graceful fallback to no-op)
// ---------------------------------------------------------------------------

async function persistReceipt(
  receipt: DeliveryReceipt,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    await supabase.from("webhook_deliveries").insert({
      ...receipt,
      metadata: metadata ?? null,
    });
  } catch {
    // Supabase not available — receipt lives only in memory DLQ
  }
}

// ---------------------------------------------------------------------------
// Replay — re-attempt a dead-letter entry
// ---------------------------------------------------------------------------

/**
 * Replay a dead-letter entry by its ID.
 * Removes from DLQ on success.
 */
export async function replayDlqEntry(id: string): Promise<DeliveryReceipt | null> {
  const idx = IN_MEMORY_DLQ.findIndex((e) => e.id === id);
  if (idx === -1) return null;

  const entry = IN_MEMORY_DLQ[idx];
  const receipt = await deliverWebhook(entry.payload);

  if (receipt.status === "delivered") {
    IN_MEMORY_DLQ.splice(idx, 1);
  }

  return receipt;
}
