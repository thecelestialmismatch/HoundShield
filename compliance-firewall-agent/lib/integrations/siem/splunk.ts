/**
 * Kaelus — Splunk HTTP Event Collector (HEC) Connector
 *
 * Forwards compliance events to Splunk Enterprise or Splunk Cloud via
 * the HTTP Event Collector endpoint.
 *
 * Features:
 *   - Single-event and batch delivery
 *   - Automatic index, sourcetype, and host configuration
 *   - Retry with exponential backoff (3 attempts: 1s → 2s → 4s)
 *   - CEF sourcetype option for Splunk CIM compatibility
 *
 * Environment variables:
 *   SPLUNK_HEC_URL        — e.g. https://splunk.company.com:8088/services/collector/event
 *   SPLUNK_HEC_TOKEN      — HEC token (required)
 *   SPLUNK_INDEX          — target Splunk index (default: "kaelus")
 *   SPLUNK_SOURCE         — source field value (default: "kaelus:compliance")
 *   SPLUNK_SOURCETYPE     — sourcetype (default: "_json", use "cef" for CEF)
 *   SPLUNK_HOST           — host field value (default: hostname or "kaelus-gateway")
 *
 * Splunk setup:
 *   1. In Splunk Web → Settings → Data Inputs → HTTP Event Collector
 *   2. Create a new token; enable the index you want
 *   3. Copy the token to SPLUNK_HEC_TOKEN
 *   4. Set SPLUNK_HEC_URL to your Splunk instance's HEC endpoint
 */

import type { SiemConnector, SiemEvent } from "./index";
import { toCEF } from "./index";

const RETRY_DELAYS = [1_000, 2_000, 4_000];
const BATCH_ENDPOINT_SUFFIX = "/services/collector/event";

export class SplunkConnector implements SiemConnector {
  readonly name = "splunk";

  private get hecUrl(): string {
    return process.env.SPLUNK_HEC_URL ?? "";
  }

  private get token(): string {
    return process.env.SPLUNK_HEC_TOKEN ?? "";
  }

  private get index(): string {
    return process.env.SPLUNK_INDEX ?? "kaelus";
  }

  private get source(): string {
    return process.env.SPLUNK_SOURCE ?? "kaelus:compliance";
  }

  private get sourcetype(): string {
    return process.env.SPLUNK_SOURCETYPE ?? "_json";
  }

  private get host(): string {
    return process.env.SPLUNK_HOST ?? "kaelus-gateway";
  }

  isEnabled(): boolean {
    return !!(this.hecUrl && this.token);
  }

  /**
   * Sends a single compliance event to Splunk HEC.
   *
   * Event format:
   *   { time, host, source, sourcetype, index, event: {...} }
   */
  async sendEvent(event: SiemEvent): Promise<void> {
    if (!this.isEnabled()) return;
    const payload = this.buildHecPayload(event);
    await this.postWithRetry(this.hecUrl, payload);
  }

  /**
   * Sends multiple events in a single HEC request.
   *
   * Splunk HEC accepts newline-delimited JSON objects in a single POST body,
   * which is significantly more efficient than one request per event.
   */
  async sendBatch(events: SiemEvent[]): Promise<void> {
    if (!this.isEnabled() || events.length === 0) return;

    // Build newline-delimited HEC payload (no surrounding array)
    const ndjson = events
      .map((e) => JSON.stringify(this.buildHecPayload(e)))
      .join("\n");

    await this.postWithRetry(this.hecUrl, ndjson, false);
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  private buildHecPayload(event: SiemEvent): Record<string, unknown> {
    const hecEvent: Record<string, unknown> =
      this.sourcetype === "cef"
        ? toCEF(event)
        : this.toSplunkEvent(event);

    return {
      time: Math.floor(new Date(event.timestamp).getTime() / 1_000),
      host: this.host,
      source: this.source,
      sourcetype: this.sourcetype,
      index: this.index,
      event: hecEvent,
    };
  }

  /** Converts a SiemEvent to a flat Splunk-friendly JSON object. */
  private toSplunkEvent(event: SiemEvent): Record<string, unknown> {
    return {
      kaelus_event_id: event.eventId,
      timestamp: event.timestamp,
      user_id: event.userId,
      provider: event.provider,
      model: event.model ?? "",
      action: event.action,
      risk_level: event.riskLevel,
      classifications: event.classifications.join(","),
      entity_types: event.entityTypes.join(","),
      confidence: event.confidence,
      latency_ms: event.latencyMs,
      prompt_hash: event.promptHash,
      seed_hash: event.seedHash ?? "",
      tx_hash: event.txHash ?? "",
      source_ip: event.sourceIp ?? "",
      tier: event.tier ?? "",
      // Derived fields for Splunk CIM compliance
      vendor: "Kaelus",
      product: "AI Compliance Firewall",
      severity:
        event.riskLevel === "CRITICAL"
          ? "critical"
          : event.riskLevel === "HIGH"
            ? "high"
            : event.riskLevel === "MEDIUM"
              ? "medium"
              : event.riskLevel === "LOW"
                ? "low"
                : "informational",
    };
  }

  private async postWithRetry(
    url: string,
    body: unknown,
    isJson = true
  ): Promise<void> {
    const bodyStr = isJson ? JSON.stringify(body) : (body as string);

    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Splunk ${this.token}`,
            "Content-Type": "application/json",
          },
          body: bodyStr,
        });

        if (res.ok) return;

        if (res.status === 400 || res.status === 401 || res.status === 403) {
          // Configuration error — don't retry
          const text = await res.text().catch(() => "");
          console.error(
            `[kaelus:siem:splunk] Non-retryable error ${res.status}: ${text}`
          );
          return;
        }

        if (attempt < RETRY_DELAYS.length) {
          await sleep(RETRY_DELAYS[attempt]);
          continue;
        }

        console.error(`[kaelus:siem:splunk] Delivery failed with status ${res.status}`);
      } catch (err) {
        if (attempt < RETRY_DELAYS.length) {
          await sleep(RETRY_DELAYS[attempt]);
          continue;
        }
        console.error("[kaelus:siem:splunk] Network error:", err);
      }
    }
  }
}

/** Singleton instance — import this directly. */
export const splunkConnector = new SplunkConnector();

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
