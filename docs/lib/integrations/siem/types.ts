/**
 * Shared SIEM types — universal compliance event envelope.
 * All SIEM connectors (Splunk, Sentinel, Elastic) consume this format.
 */

export type SiemSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface SiemEvent {
  /** Unique event ID (UUID) */
  id: string;
  /** ISO-8601 timestamp */
  timestamp: string;
  /** Hound Shield-assigned severity */
  severity: SiemSeverity;
  /** Numeric severity for correlation (LOW=2, MEDIUM=5, HIGH=7, CRITICAL=10) */
  severity_score: number;
  /** Gateway action taken */
  action: "BLOCKED" | "QUARANTINED" | "ALLOWED" | "FLAGGED";
  /** Risk level from classifier */
  risk_level: string;
  /** Detected data categories (CUI, PII, PHI, etc.) */
  classifications: string[];
  /** Number of sensitive entities detected */
  entities_found: number;
  /** AI provider the request was destined for */
  provider: string;
  /** AI model used */
  model: string;
  /** Org / tenant ID */
  org_id?: string;
  /** User ID (hashed for privacy) */
  user_id_hash?: string;
  /** Processing latency in ms */
  latency_ms?: number;
  /** Whether stream was truncated */
  stream_truncated?: boolean;
  /** Framework that triggered the event (compliance standard) */
  framework?: "CMMC" | "HIPAA" | "SOC2" | "GDPR";
}

export interface SiemConnector {
  /** Send a single event to the SIEM. */
  send(event: SiemEvent): Promise<void>;
  /** Send a batch of events (more efficient than N individual sends). */
  sendBatch(events: SiemEvent[]): Promise<void>;
}

export interface SiemConnectorConfig {
  /** Maximum retries on transient failures */
  maxRetries?: number;
  /** Initial retry delay in ms (doubles each retry) */
  retryDelayMs?: number;
}

/** Map severity string to numeric score for SIEM correlation. */
export function severityScore(sev: SiemSeverity): number {
  return { LOW: 2, MEDIUM: 5, HIGH: 7, CRITICAL: 10 }[sev];
}

/** Serialize a SiemEvent to CEF (Common Event Format) for QRadar/ArcSight/syslog. */
export function toCef(event: SiemEvent): string {
  const sev = { LOW: 3, MEDIUM: 5, HIGH: 7, CRITICAL: 10 }[event.severity];
  const ext = [
    `eventId=${event.id}`,
    `action=${event.action}`,
    `riskLevel=${event.risk_level}`,
    `classifications=${event.classifications.join(",")}`,
    `provider=${event.provider}`,
    `model=${event.model}`,
    event.org_id ? `orgId=${event.org_id}` : "",
    event.latency_ms != null ? `latencyMs=${event.latency_ms}` : "",
    `entitiesFound=${event.entities_found}`,
    `severityScore=${event.severity_score}`,
  ]
    .filter(Boolean)
    .join(" ");

  return `CEF:0|Hound Shield|AIFirewall|2.0|${event.action}|Hound Shield AI Compliance Event|${sev}|${ext}`;
}

/** Exponential backoff retry helper used by all connectors. */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000,
  label = "siem"
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, delayMs * 2 ** attempt));
        console.warn(`[${label}] retry ${attempt + 1}/${maxRetries}`);
      }
    }
  }
  throw lastErr;
}
