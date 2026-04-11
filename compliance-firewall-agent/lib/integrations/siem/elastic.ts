/**
 * Elastic/ELK SIEM Connector — Kaelus.Online
 *
 * Sends compliance events to Elasticsearch via the REST Bulk API.
 * Compatible with self-hosted Elasticsearch 8.x and Elastic Cloud.
 *
 * Required env vars:
 *   ELASTIC_URL          — e.g. https://my-cluster.es.io:9243
 *   ELASTIC_API_KEY      — base64 "id:api_key" (preferred over username/password)
 *   ELASTIC_INDEX        — target index name, defaults to "kaelus-compliance"
 *
 * Optional env vars:
 *   ELASTIC_USERNAME     — fallback basic auth
 *   ELASTIC_PASSWORD     — fallback basic auth
 *   ELASTIC_PIPELINE     — ingest pipeline name (e.g. "kaelus-enrich")
 *   ELASTIC_SOURCETYPE   — "cef" to send raw CEF strings instead of JSON docs
 *
 * Index mapping tip — create this index template in Kibana or via API:
 * PUT _index_template/kaelus-compliance
 * {
 *   "index_patterns": ["kaelus-compliance*"],
 *   "template": {
 *     "mappings": {
 *       "properties": {
 *         "@timestamp":      { "type": "date" },
 *         "severity":        { "type": "keyword" },
 *         "severity_score":  { "type": "integer" },
 *         "action":          { "type": "keyword" },
 *         "risk_level":      { "type": "keyword" },
 *         "classifications": { "type": "keyword" },
 *         "provider":        { "type": "keyword" },
 *         "model":           { "type": "keyword" },
 *         "org_id":          { "type": "keyword" },
 *         "entities_found":  { "type": "integer" },
 *         "latency_ms":      { "type": "integer" },
 *         "framework":       { "type": "keyword" }
 *       }
 *     }
 *   }
 * }
 *
 * Example Kibana KQL queries:
 *   action: "BLOCKED" AND severity_score >= 7
 *   classifications: "CUI" AND framework: "CMMC"
 *   org_id: "acme-corp" | stats count by risk_level
 */

import type { SiemConnector, SiemEvent, SiemConnectorConfig } from "./types";
import { toCef, withRetry } from "./types";

export interface ElasticConfig extends SiemConnectorConfig {
  url: string;
  apiKey?: string;
  username?: string;
  password?: string;
  index?: string;
  pipeline?: string;
  /** Send raw CEF strings instead of JSON documents */
  useCef?: boolean;
}

const BULK_URL_SUFFIX = "/_bulk";
const DEFAULT_INDEX = "kaelus-compliance";
const NON_RETRYABLE = new Set([400, 401, 403]);

/** Build Authorization header from config. */
function buildAuthHeader(cfg: ElasticConfig): string {
  if (cfg.apiKey) {
    return `ApiKey ${cfg.apiKey}`;
  }
  if (cfg.username && cfg.password) {
    return `Basic ${Buffer.from(`${cfg.username}:${cfg.password}`).toString("base64")}`;
  }
  throw new Error("[elastic] No auth configured. Set ELASTIC_API_KEY or ELASTIC_USERNAME+PASSWORD.");
}

/** Convert a SiemEvent to an Elasticsearch document. */
function toElasticDoc(event: SiemEvent, useCef: boolean): Record<string, unknown> {
  if (useCef) {
    return {
      "@timestamp": event.timestamp,
      "message": toCef(event),
      "event.id": event.id,
      "event.severity": event.severity,
      "event.action": event.action,
      "log.level": event.severity.toLowerCase(),
      "labels.source": "kaelus",
    };
  }

  return {
    "@timestamp": event.timestamp,
    id: event.id,
    severity: event.severity,
    severity_score: event.severity_score,
    action: event.action,
    risk_level: event.risk_level,
    classifications: event.classifications,
    entities_found: event.entities_found,
    provider: event.provider,
    model: event.model,
    org_id: event.org_id,
    user_id_hash: event.user_id_hash,
    latency_ms: event.latency_ms,
    stream_truncated: event.stream_truncated,
    framework: event.framework,
    "labels.source": "kaelus",
    "ecs.version": "8.11.0",
  };
}

export class ElasticConnector implements SiemConnector {
  private readonly url: string;
  private readonly authHeader: string;
  private readonly index: string;
  private readonly pipeline?: string;
  private readonly useCef: boolean;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;

  constructor(cfg: ElasticConfig) {
    this.url = cfg.url.replace(/\/$/, "");
    this.authHeader = buildAuthHeader(cfg);
    this.index = cfg.index ?? DEFAULT_INDEX;
    this.pipeline = cfg.pipeline;
    this.useCef = cfg.useCef ?? false;
    this.maxRetries = cfg.maxRetries ?? 3;
    this.retryDelayMs = cfg.retryDelayMs ?? 1000;
  }

  async send(event: SiemEvent): Promise<void> {
    await this.sendBatch([event]);
  }

  async sendBatch(events: SiemEvent[]): Promise<void> {
    if (events.length === 0) return;

    // Build NDJSON bulk body: action line + source line per event
    const lines: string[] = [];
    for (const evt of events) {
      const action = JSON.stringify({
        index: {
          _index: this.index,
          _id: evt.id,
        },
      });
      const doc = JSON.stringify(toElasticDoc(evt, this.useCef));
      lines.push(action, doc);
    }
    const body = lines.join("\n") + "\n";

    let bulkUrl = `${this.url}${BULK_URL_SUFFIX}`;
    if (this.pipeline) {
      bulkUrl += `?pipeline=${encodeURIComponent(this.pipeline)}`;
    }

    await withRetry(
      async () => {
        const res = await fetch(bulkUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-ndjson",
            Authorization: this.authHeader,
          },
          body,
        });

        if (NON_RETRYABLE.has(res.status)) {
          const text = await res.text().catch(() => "");
          throw Object.assign(
            new Error(`[elastic] Non-retryable ${res.status}: ${text.slice(0, 200)}`),
            { retryable: false }
          );
        }

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`[elastic] ${res.status}: ${text.slice(0, 200)}`);
        }

        const result = (await res.json()) as { errors?: boolean; items?: unknown[] };
        if (result.errors) {
          // Log per-item errors but don't throw — partial success is acceptable
          console.warn(
            `[elastic] Bulk had errors for ${events.length} events — check index mappings`
          );
        }
      },
      this.maxRetries,
      this.retryDelayMs,
      "elastic"
    );
  }
}

// ---------------------------------------------------------------------------
// Singleton factory — reads from env vars
// ---------------------------------------------------------------------------

let _instance: ElasticConnector | null = null;

export function getElasticConnector(): ElasticConnector | null {
  if (_instance) return _instance;

  const url = process.env.ELASTIC_URL;
  if (!url) return null;

  try {
    _instance = new ElasticConnector({
      url,
      apiKey: process.env.ELASTIC_API_KEY,
      username: process.env.ELASTIC_USERNAME,
      password: process.env.ELASTIC_PASSWORD,
      index: process.env.ELASTIC_INDEX ?? DEFAULT_INDEX,
      pipeline: process.env.ELASTIC_PIPELINE,
      useCef: process.env.ELASTIC_SOURCETYPE === "cef",
    });
    return _instance;
  } catch (err) {
    console.error("[elastic] Failed to initialize connector:", err);
    return null;
  }
}
