/**
 * Splunk HEC SIEM Connector — Kaelus.Online
 *
 * Sends compliance events via the Splunk HTTP Event Collector (HEC).
 *
 * Required env vars:
 *   SPLUNK_URL          — e.g. https://splunk.company.com:8088
 *   SPLUNK_HEC_TOKEN    — HEC token (from Settings → Data Inputs → HTTP Event Collector)
 *
 * Optional env vars:
 *   SPLUNK_INDEX        — target index, defaults to "kaelus"
 *   SPLUNK_SOURCE       — source field, defaults to "kaelus:compliance"
 *   SPLUNK_SOURCETYPE   — "cef" for CEF format, defaults to "_json"
 *
 * Example SPL queries (Splunk Search):
 *   index=kaelus action=BLOCKED severity=CRITICAL
 *   index=kaelus | stats count by risk_level
 *   index=kaelus classifications="CUI" | timechart count
 */

import type { SiemConnector, SiemEvent, SiemConnectorConfig } from "./types";
import { toCef, withRetry } from "./types";

export interface SplunkConfig extends SiemConnectorConfig {
  url: string;
  hecToken: string;
  index?: string;
  source?: string;
  sourcetype?: string;
}

const NON_RETRYABLE = new Set([400, 401, 403]);
const DEFAULT_INDEX = "kaelus";

export class SplunkConnector implements SiemConnector {
  private readonly endpoint: string;
  private readonly authHeader: string;
  private readonly index: string;
  private readonly source: string;
  private readonly sourcetype: string;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;

  constructor(cfg: SplunkConfig) {
    this.endpoint = `${cfg.url.replace(/\/$/, "")}/services/collector/event`;
    this.authHeader = `Splunk ${cfg.hecToken}`;
    this.index = cfg.index ?? DEFAULT_INDEX;
    this.source = cfg.source ?? "kaelus:compliance";
    this.sourcetype = cfg.sourcetype ?? "_json";
    this.maxRetries = cfg.maxRetries ?? 3;
    this.retryDelayMs = cfg.retryDelayMs ?? 1000;
  }

  async send(event: SiemEvent): Promise<void> {
    await this.sendBatch([event]);
  }

  async sendBatch(events: SiemEvent[]): Promise<void> {
    if (events.length === 0) return;

    // Build NDJSON body: one JSON object per event (Splunk HEC batch format)
    const body = events
      .map((evt) =>
        JSON.stringify({
          time: Math.floor(new Date(evt.timestamp).getTime() / 1000),
          index: this.index,
          source: this.source,
          sourcetype: this.sourcetype,
          event:
            this.sourcetype === "cef"
              ? toCef(evt)
              : {
                  id: evt.id,
                  severity: evt.severity,
                  severity_score: evt.severity_score,
                  action: evt.action,
                  risk_level: evt.risk_level,
                  classifications: evt.classifications,
                  entities_found: evt.entities_found,
                  provider: evt.provider,
                  model: evt.model,
                  org_id: evt.org_id,
                  user_id_hash: evt.user_id_hash,
                  latency_ms: evt.latency_ms,
                  stream_truncated: evt.stream_truncated,
                  framework: evt.framework,
                },
        })
      )
      .join("\n");

    await withRetry(
      async () => {
        const res = await fetch(this.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: this.authHeader,
          },
          body,
        });

        if (NON_RETRYABLE.has(res.status)) {
          const text = await res.text().catch(() => "");
          throw Object.assign(
            new Error(`[splunk] Non-retryable ${res.status}: ${text.slice(0, 200)}`),
            { retryable: false }
          );
        }

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`[splunk] ${res.status}: ${text.slice(0, 200)}`);
        }
      },
      this.maxRetries,
      this.retryDelayMs,
      "splunk"
    );
  }
}

let _instance: SplunkConnector | null = null;

export function getSplunkConnector(): SplunkConnector | null {
  if (_instance) return _instance;
  const url = process.env.SPLUNK_URL;
  const token = process.env.SPLUNK_HEC_TOKEN;
  if (!url || !token) return null;

  _instance = new SplunkConnector({
    url,
    hecToken: token,
    index: process.env.SPLUNK_INDEX ?? DEFAULT_INDEX,
    source: process.env.SPLUNK_SOURCE,
    sourcetype: process.env.SPLUNK_SOURCETYPE,
  });
  return _instance;
}
