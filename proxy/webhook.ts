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
import { z } from "zod";

/**
 * The wire contract, enforced rather than promised.
 *
 * This module's header claims it NEVER transmits prompt text, CUI content, user
 * messages or response content. Until this schema existed that claim rested
 * entirely on the parameter type and on `ooda/loop.ts` being the only caller:
 * `flush` serialises `{ ...event }`, so any caller that got past TypeScript —
 * a cast, a spread of a wider object, a JS consumer of the built `dist/` —
 * silently POSTed customer content to houndshield.com.
 *
 * That is not a style point. In Mode B the proxy runs inside the customer's
 * network and this webhook is the ONLY channel that sends anything back out, so
 * whether it can carry content is what decides HIPAA Business Associate status
 * (45 CFR 160.103) for a healthcare deployment.
 *
 * Zod strip mode, matching `schema.ts`, which uses the same posture for the same
 * reason: unknown fields cannot smuggle content past the boundary. Every field
 * legitimately sent must be enumerated here.
 */
const EventSchema = z
  .object({
    request_id: z.string(),
    org_id: z.string(),
    action: z.enum(["ALLOWED", "BLOCKED", "QUARANTINED"]),
    risk_level: z.string(),
    pattern_name: z.string().optional(),
    nist_control: z.string().optional(),
    scan_ms: z.number(),
  })
  .strip();

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
  // Strip before queueing, not before sending: an un-stripped object must never
  // exist in memory long enough for a future flush path to serialise it.
  const parsed = EventSchema.safeParse(event);
  if (!parsed.success) {
    // Drop rather than send a partial. This is telemetry, and a malformed event
    // is worth less than the guarantee that only enumerated fields leave the
    // network. Never log `event` itself here — that is the content this
    // function exists to contain.
    console.error("[houndshield] webhook event rejected by schema, dropped");
    return;
  }

  _queue.push({
    ...parsed.data,
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
