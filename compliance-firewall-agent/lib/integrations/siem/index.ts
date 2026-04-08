/**
 * Kaelus — SIEM Connector Framework
 *
 * Unified abstraction for forwarding compliance events to Security Information
 * and Event Management (SIEM) platforms.
 *
 * Supported connectors:
 *   - Splunk (HTTP Event Collector — HEC)
 *   - Azure Sentinel / Microsoft Sentinel (Log Analytics Workspace API)
 *
 * All connectors implement the `SiemConnector` interface so callers can
 * route events to one or multiple platforms without knowing the details of
 * each vendor's API.
 *
 * CEF (Common Event Format) output is also provided for platforms that
 * ingest raw syslog lines (QRadar, ArcSight, etc.).
 */

// ---------------------------------------------------------------------------
// Normalised SIEM event
// ---------------------------------------------------------------------------

export interface SiemEvent {
  /** Kaelus event UUID */
  eventId: string;
  /** ISO-8601 timestamp */
  timestamp: string;
  /** Authenticated Kaelus user */
  userId: string;
  /** Destination LLM provider (openai, anthropic, etc.) */
  provider: string;
  /** Model requested */
  model?: string;
  /** Compliance decision */
  action: "ALLOWED" | "BLOCKED" | "QUARANTINED";
  /** Highest risk level detected */
  riskLevel: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  /** Classification categories that fired */
  classifications: string[];
  /** Detected entity types (PII, FINANCIAL, etc.) */
  entityTypes: string[];
  /** Overall confidence score [0-1] */
  confidence: number;
  /** Detection latency in ms */
  latencyMs: number;
  /** SHA-256 hash of the original prompt (never the raw text) */
  promptHash: string;
  /** Seed anchor hash (cryptographic integrity chain) */
  seedHash?: string;
  /** On-chain transaction hash (if blockchain anchoring enabled) */
  txHash?: string;
  /** Source IP address (if available) */
  sourceIp?: string;
  /** Subscription tier */
  tier?: string;
}

// ---------------------------------------------------------------------------
// Connector interface
// ---------------------------------------------------------------------------

export interface SiemConnector {
  /** Human-readable name for this connector. */
  name: string;
  /** Returns true if this connector is configured and enabled. */
  isEnabled(): boolean;
  /** Forward a single compliance event. */
  sendEvent(event: SiemEvent): Promise<void>;
  /** Forward a batch of events (more efficient than individual sends). */
  sendBatch(events: SiemEvent[]): Promise<void>;
}

// ---------------------------------------------------------------------------
// CEF (Common Event Format) builder
//
// CEF is widely supported by QRadar, ArcSight, and many other SIEMs as a
// raw syslog line. Each connector can call `toCEF()` before sending if
// their platform prefers it.
// ---------------------------------------------------------------------------

const CEF_VERSION = 0;
const CEF_DEVICE_VENDOR = "Kaelus";
const CEF_DEVICE_PRODUCT = "AI Compliance Firewall";
const CEF_DEVICE_VERSION = "2.0";

/** Maps our risk levels to CEF severity (0–10). */
const CEF_SEVERITY: Record<SiemEvent["riskLevel"], number> = {
  NONE: 0,
  LOW: 2,
  MEDIUM: 5,
  HIGH: 7,
  CRITICAL: 10,
};

/** Maps action to a CEF event ID. */
const CEF_EVENT_ID: Record<SiemEvent["action"], string> = {
  ALLOWED: "100",
  BLOCKED: "200",
  QUARANTINED: "300",
};

const CEF_EVENT_NAME: Record<SiemEvent["action"], string> = {
  ALLOWED: "Prompt Allowed",
  BLOCKED: "Prompt Blocked",
  QUARANTINED: "Prompt Quarantined",
};

/**
 * Serialises a SiemEvent as a CEF syslog line.
 *
 * Format: CEF:Version|Device Vendor|Device Product|Device Version|
 *         Device Event Class ID|Name|Severity|Extension
 */
export function toCEF(event: SiemEvent): string {
  const severity = CEF_SEVERITY[event.riskLevel];
  const eventId = CEF_EVENT_ID[event.action];
  const name = CEF_EVENT_NAME[event.action];

  const ext: Record<string, string> = {
    rt: String(new Date(event.timestamp).getTime()),
    suid: event.userId,
    dhost: event.provider,
    cs1: event.riskLevel,
    cs1Label: "RiskLevel",
    cs2: event.classifications.join(","),
    cs2Label: "Classifications",
    cs3: event.entityTypes.join(","),
    cs3Label: "EntityTypes",
    cs4: String(Math.round(event.confidence * 100)),
    cs4Label: "ConfidencePct",
    cn1: String(event.latencyMs),
    cn1Label: "LatencyMs",
    msg: event.promptHash,
    externalId: event.eventId,
  };

  if (event.sourceIp) ext["src"] = event.sourceIp;
  if (event.txHash) { ext["cs5"] = event.txHash; ext["cs5Label"] = "TxHash"; }
  if (event.seedHash) { ext["cs6"] = event.seedHash; ext["cs6Label"] = "SeedHash"; }

  const extensionStr = Object.entries(ext)
    .map(([k, v]) => `${k}=${escapeCefValue(v)}`)
    .join(" ");

  return [
    `CEF:${CEF_VERSION}`,
    escapeCefHeader(CEF_DEVICE_VENDOR),
    escapeCefHeader(CEF_DEVICE_PRODUCT),
    escapeCefHeader(CEF_DEVICE_VERSION),
    escapeCefHeader(eventId),
    escapeCefHeader(name),
    String(severity),
    extensionStr,
  ].join("|");
}

function escapeCefHeader(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\|/g, "\\|");
}

function escapeCefValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/=/g, "\\=").replace(/\n/g, "\\n").replace(/\r/g, "\\r");
}

// ---------------------------------------------------------------------------
// Broadcast: send to all enabled connectors
// ---------------------------------------------------------------------------

/**
 * Sends a compliance event to every configured SIEM connector.
 * Errors from individual connectors are logged but do not propagate —
 * SIEM delivery failure must never block the gateway.
 */
export async function broadcastToSiem(
  event: SiemEvent,
  connectors: SiemConnector[]
): Promise<void> {
  const enabled = connectors.filter((c) => c.isEnabled());
  if (enabled.length === 0) return;

  await Promise.allSettled(
    enabled.map(async (connector) => {
      try {
        await connector.sendEvent(event);
      } catch (err) {
        console.error(`[kaelus:siem:${connector.name}] Event delivery failed:`, err);
      }
    })
  );
}

/**
 * Sends a batch to every configured SIEM connector in parallel.
 */
export async function broadcastBatchToSiem(
  events: SiemEvent[],
  connectors: SiemConnector[]
): Promise<void> {
  const enabled = connectors.filter((c) => c.isEnabled());
  if (enabled.length === 0) return;

  await Promise.allSettled(
    enabled.map(async (connector) => {
      try {
        await connector.sendBatch(events);
      } catch (err) {
        console.error(`[kaelus:siem:${connector.name}] Batch delivery failed:`, err);
      }
    })
  );
}
