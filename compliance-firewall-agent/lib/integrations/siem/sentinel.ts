/**
 * Kaelus — Azure Sentinel / Microsoft Sentinel Connector
 *
 * Forwards compliance events to Azure Sentinel via the Log Analytics
 * Data Collector API (HTTP Data Collector API).
 *
 * Features:
 *   - HMAC-SHA256 signed requests (required by Log Analytics API)
 *   - Custom log type: KaelusCompliance_CL (suffix added automatically)
 *   - Single-event and batch delivery
 *   - Retry with exponential backoff
 *
 * Environment variables:
 *   SENTINEL_WORKSPACE_ID     — Log Analytics Workspace ID (required)
 *   SENTINEL_SHARED_KEY       — Primary or secondary workspace key (required)
 *   SENTINEL_LOG_TYPE         — Custom log type name (default: "KaelusCompliance")
 *                               Azure appends "_CL" automatically
 *   SENTINEL_TIME_GENERATED_FIELD — Field name for timestamp (default: "timestamp")
 *
 * Azure setup:
 *   1. Create a Log Analytics Workspace in Azure Portal
 *   2. Go to Workspace → Agents → Log Analytics agent instructions
 *   3. Copy "Workspace ID" → SENTINEL_WORKSPACE_ID
 *   4. Copy "Primary Key" → SENTINEL_SHARED_KEY
 *   5. Connect the workspace to Microsoft Sentinel
 *
 * Query in Sentinel (KQL):
 *   KaelusCompliance_CL
 *   | where action_s == "BLOCKED"
 *   | project timestamp_t, user_id_s, risk_level_s, entity_types_s
 *   | order by timestamp_t desc
 */

import { createHmac } from "crypto";
import type { SiemConnector, SiemEvent } from "./index";

const RETRY_DELAYS = [1_000, 2_000, 4_000];
const API_VERSION = "2016-04-01";

export class SentinelConnector implements SiemConnector {
  readonly name = "sentinel";

  private get workspaceId(): string {
    return process.env.SENTINEL_WORKSPACE_ID ?? "";
  }

  private get sharedKey(): string {
    return process.env.SENTINEL_SHARED_KEY ?? "";
  }

  private get logType(): string {
    return process.env.SENTINEL_LOG_TYPE ?? "KaelusCompliance";
  }

  private get timeGeneratedField(): string {
    return process.env.SENTINEL_TIME_GENERATED_FIELD ?? "timestamp";
  }

  isEnabled(): boolean {
    return !!(this.workspaceId && this.sharedKey);
  }

  /**
   * Sends a single compliance event to Azure Sentinel.
   */
  async sendEvent(event: SiemEvent): Promise<void> {
    if (!this.isEnabled()) return;
    await this.sendBatch([event]);
  }

  /**
   * Sends multiple events in a single request to Azure Sentinel.
   *
   * The Log Analytics API accepts a JSON array, so batching is efficient.
   */
  async sendBatch(events: SiemEvent[]): Promise<void> {
    if (!this.isEnabled() || events.length === 0) return;

    const logEntries = events.map((e) => this.toSentinelEntry(e));
    const body = JSON.stringify(logEntries);

    await this.postWithRetry(body);
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /**
   * Converts a SiemEvent to the flat structure Log Analytics expects.
   *
   * Azure appends "_s" (string), "_d" (double), "_b" (bool), "_t" (datetime)
   * suffixes to custom fields. We supply already-named fields that match
   * the expected suffixes for a better Sentinel query experience.
   */
  private toSentinelEntry(event: SiemEvent): Record<string, unknown> {
    return {
      // Datetime fields (Azure will parse ISO-8601 as datetime)
      timestamp: event.timestamp,

      // String fields
      event_id: event.eventId,
      user_id: event.userId,
      provider: event.provider,
      model: event.model ?? "",
      action: event.action,
      risk_level: event.riskLevel,
      classifications: event.classifications.join(","),
      entity_types: event.entityTypes.join(","),
      prompt_hash: event.promptHash,
      seed_hash: event.seedHash ?? "",
      tx_hash: event.txHash ?? "",
      source_ip: event.sourceIp ?? "",
      tier: event.tier ?? "",
      product: "KaelusAIComplianceFirewall",

      // Numeric fields
      confidence: event.confidence,
      latency_ms: event.latencyMs,

      // Derived severity (0–10 scale matching Azure Sentinel alert severity)
      severity_score:
        event.riskLevel === "CRITICAL"
          ? 10
          : event.riskLevel === "HIGH"
            ? 7
            : event.riskLevel === "MEDIUM"
              ? 5
              : event.riskLevel === "LOW"
                ? 2
                : 0,
    };
  }

  /**
   * Builds the HMAC-SHA256 authorization signature required by the
   * Log Analytics HTTP Data Collector API.
   *
   * Signature = Base64(HMAC-SHA256(UTF8(stringToSign), Base64-decode(key)))
   * stringToSign = "POST\n{contentLength}\napplication/json\nx-ms-date:{rfcDate}\n/api/logs"
   */
  private buildSignature(dateString: string, contentLength: number): string {
    const stringToSign = [
      "POST",
      contentLength.toString(),
      "application/json",
      `x-ms-date:${dateString}`,
      "/api/logs",
    ].join("\n");

    const keyBytes = Buffer.from(this.sharedKey, "base64");
    const hmac = createHmac("sha256", keyBytes);
    hmac.update(stringToSign, "utf8");
    const signature = hmac.digest("base64");

    return `SharedKey ${this.workspaceId}:${signature}`;
  }

  private async postWithRetry(body: string): Promise<void> {
    const url = `https://${this.workspaceId}.ods.opinsights.azure.com/api/logs?api-version=${API_VERSION}`;
    const rfcDate = new Date().toUTCString();
    const contentLength = Buffer.byteLength(body, "utf8");
    const authorization = this.buildSignature(rfcDate, contentLength);

    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: authorization,
            "Content-Type": "application/json",
            "Log-Type": this.logType,
            "x-ms-date": rfcDate,
            "time-generated-field": this.timeGeneratedField,
          },
          body,
        });

        if (res.ok || res.status === 200) return;

        if (res.status === 400 || res.status === 403) {
          const text = await res.text().catch(() => "");
          console.error(
            `[kaelus:siem:sentinel] Non-retryable error ${res.status}: ${text}`
          );
          return;
        }

        if (attempt < RETRY_DELAYS.length) {
          await sleep(RETRY_DELAYS[attempt]);
          continue;
        }

        console.error(
          `[kaelus:siem:sentinel] Delivery failed with status ${res.status}`
        );
      } catch (err) {
        if (attempt < RETRY_DELAYS.length) {
          await sleep(RETRY_DELAYS[attempt]);
          continue;
        }
        console.error("[kaelus:siem:sentinel] Network error:", err);
      }
    }
  }
}

/** Singleton instance — import this directly. */
export const sentinelConnector = new SentinelConnector();

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
