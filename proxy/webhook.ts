/**
 * Hound Shield Proxy — metadata-only webhook to houndshield.com.
 *
 * Posts ONLY: { timestamp, action, pattern_name, risk_level, request_id, org_id, scan_ms }
 * NEVER transmits: prompt text, CUI content, user messages, response content.
 *
 * Fire-and-forget — never blocks the proxy response path.
 * Batches events (up to 50, max 5s delay) to reduce network calls.
 */

import fetch from "node-fetch";

export interface EventPayload {
  request_id: string;
  org_id: string;
  action: "ALLOWED" | "BLOCKED" | "QUARANTINED";
  risk_level: string;
  pattern_name?: string;
  nist_control?: string;
  scan_ms: number;
  source: "docker_proxy";
  timestamp: string;
}

// ── Config ─────────────────────────────────────────────────────────────────

const INGEST_URL =
  process.env.HOUNDSHIELD_API_URL
    ? `${process.env.HOUNDSHIELD_API_URL}/events/ingest`
    : "https://houndshield.com/api/events/ingest";

const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 5000;

// ── Batch queue ────────────────────────────────────────────────────────────

let _queue: EventPayload[] = [];
let _timer: ReturnType<typeof setTimeout> | null = null;
let _licenseKey = "";

export function setWebhookLicenseKey(key: string): void {
  _licenseKey = key;
}

async function flush(): Promise<void> {
  if (_queue.length === 0) return;
  const batch = _queue.splice(0, BATCH_SIZE);
  _timer = null;

  try {
    await fetch(INGEST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${_licenseKey}`,
        "X-HoundShield-Source": "docker-proxy",
      },
      body: JSON.stringify({ events: batch }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    // Non-blocking — webhook failure never impacts scan result
    // Remaining queue items are not re-queued (acceptable data loss vs reliability)
  }
}

function scheduleFlush(): void {
  if (_timer) return;
  _timer = setTimeout(flush, BATCH_DELAY_MS);
}

/**
 * Enqueues a metadata-only event for async delivery to houndshield.com.
 * Returns immediately — does not await network call.
 */
export function enqueueEvent(event: Omit<EventPayload, "timestamp" | "source">): void {
  _queue.push({
    ...event,
    source: "docker_proxy",
    timestamp: new Date().toISOString(),
  });

  if (_queue.length >= BATCH_SIZE) {
    // Flush immediately when batch is full
    void flush();
  } else {
    scheduleFlush();
  }
}

/** Force-flush remaining events (call on graceful shutdown). */
export async function flushWebhook(): Promise<void> {
  if (_timer) {
    clearTimeout(_timer);
    _timer = null;
  }
  await flush();
}
