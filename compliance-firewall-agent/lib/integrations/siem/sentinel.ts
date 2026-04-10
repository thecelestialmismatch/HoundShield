/**
 * Azure Sentinel SIEM Connector — Kaelus.Online
 *
 * Sends compliance events to Azure Sentinel via the Log Analytics Data Collector API.
 * Events appear in a custom table: KaelusCompliance_CL
 *
 * Required env vars:
 *   SENTINEL_WORKSPACE_ID   — Log Analytics workspace ID (GUID)
 *   SENTINEL_WORKSPACE_KEY  — Primary or secondary workspace key (base64)
 *
 * Optional env vars:
 *   SENTINEL_LOG_TYPE       — custom table name prefix (defaults to "KaelusCompliance")
 *
 * Example KQL queries (Azure Sentinel / Log Analytics):
 *   KaelusCompliance_CL | where action_s == "BLOCKED" and severity_score_d >= 7
 *   KaelusCompliance_CL | where classifications_s contains "CUI"
 *   KaelusCompliance_CL | summarize count() by risk_level_s
 *   KaelusCompliance_CL | where TimeGenerated > ago(24h) | project id_g, action_s, provider_s
 */

import { createHmac } from "crypto";
import type { SiemConnector, SiemEvent, SiemConnectorConfig } from "./types";
import { withRetry } from "./types";

export interface SentinelConfig extends SiemConnectorConfig {
  workspaceId: string;
  workspaceKey: string;
  logType?: string;
}

const LOG_ANALYTICS_URL =
  "https://{workspaceId}.ods.opinsights.azure.com/api/logs?api-version=2016-04-01";
const DEFAULT_LOG_TYPE = "KaelusCompliance";
const NON_RETRYABLE = new Set([400, 401, 403]);

/** Build HMAC-SHA256 authorization header for Log Analytics Data Collector API. */
function buildAuthHeader(
  workspaceId: string,
  workspaceKey: string,
  body: string,
  date: string
): string {
  const contentLength = Buffer.byteLength(body, "utf8");
  const stringToSign = `POST\n${contentLength}\napplication/json\nx-ms-date:${date}\n/api/logs`;
  const signature = createHmac("sha256", Buffer.from(workspaceKey, "base64"))
    .update(stringToSign, "utf8")
    .digest("base64");
  return `SharedKey ${workspaceId}:${signature}`;
}

/** Convert SiemEvent to a Sentinel-compatible record with _s/_d/_b suffix conventions. */
function toSentinelRecord(evt: SiemEvent): Record<string, unknown> {
  return {
    id_g: evt.id,
    timestamp_t: evt.timestamp,
    severity_s: evt.severity,
    severity_score_d: evt.severity_score,
    action_s: evt.action,
    risk_level_s: evt.risk_level,
    classifications_s: evt.classifications.join(","),
    entities_found_d: evt.entities_found,
    provider_s: evt.provider,
    model_s: evt.model,
    org_id_s: evt.org_id ?? "",
    user_id_hash_s: evt.user_id_hash ?? "",
    latency_ms_d: evt.latency_ms ?? 0,
    stream_truncated_b: evt.stream_truncated ?? false,
    framework_s: evt.framework ?? "",
  };
}

export class SentinelConnector implements SiemConnector {
  private readonly workspaceId: string;
  private readonly workspaceKey: string;
  private readonly logType: string;
  private readonly url: string;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;

  constructor(cfg: SentinelConfig) {
    this.workspaceId = cfg.workspaceId;
    this.workspaceKey = cfg.workspaceKey;
    this.logType = cfg.logType ?? DEFAULT_LOG_TYPE;
    this.url = LOG_ANALYTICS_URL.replace("{workspaceId}", cfg.workspaceId);
    this.maxRetries = cfg.maxRetries ?? 3;
    this.retryDelayMs = cfg.retryDelayMs ?? 1000;
  }

  async send(event: SiemEvent): Promise<void> {
    await this.sendBatch([event]);
  }

  async sendBatch(events: SiemEvent[]): Promise<void> {
    if (events.length === 0) return;

    const records = events.map(toSentinelRecord);
    const body = JSON.stringify(records);
    const date = new Date().toUTCString();
    const authHeader = buildAuthHeader(this.workspaceId, this.workspaceKey, body, date);

    await withRetry(
      async () => {
        const res = await fetch(this.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
            "Log-Type": this.logType,
            "x-ms-date": date,
            "time-generated-field": "timestamp_t",
          },
          body,
        });

        if (NON_RETRYABLE.has(res.status)) {
          const text = await res.text().catch(() => "");
          throw Object.assign(
            new Error(`[sentinel] Non-retryable ${res.status}: ${text.slice(0, 200)}`),
            { retryable: false }
          );
        }

        // 200 = accepted
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`[sentinel] ${res.status}: ${text.slice(0, 200)}`);
        }
      },
      this.maxRetries,
      this.retryDelayMs,
      "sentinel"
    );
  }
}

let _instance: SentinelConnector | null = null;

export function getSentinelConnector(): SentinelConnector | null {
  if (_instance) return _instance;
  const id = process.env.SENTINEL_WORKSPACE_ID;
  const key = process.env.SENTINEL_WORKSPACE_KEY;
  if (!id || !key) return null;

  _instance = new SentinelConnector({
    workspaceId: id,
    workspaceKey: key,
    logType: process.env.SENTINEL_LOG_TYPE ?? DEFAULT_LOG_TYPE,
  });
  return _instance;
}
