/**
 * SIEM Broadcast — fan-out to all configured connectors in parallel.
 *
 * Usage:
 *   import { broadcastToSiem } from "@/lib/integrations/siem";
 *   await broadcastToSiem(event);
 *
 * Connectors activate automatically when their env vars are present:
 *   Elastic:   ELASTIC_URL + (ELASTIC_API_KEY or ELASTIC_USERNAME+PASSWORD)
 *   Splunk:    SPLUNK_URL + SPLUNK_HEC_TOKEN
 *   Sentinel:  SENTINEL_WORKSPACE_ID + SENTINEL_WORKSPACE_KEY
 */

export type { SiemEvent, SiemSeverity, SiemConnector } from "./types";
export { toCef, severityScore } from "./types";
export { ElasticConnector, getElasticConnector } from "./elastic";
export { SplunkConnector, getSplunkConnector } from "./splunk";
export { SentinelConnector, getSentinelConnector } from "./sentinel";

import type { SiemEvent } from "./types";
import { getElasticConnector } from "./elastic";
import { getSplunkConnector } from "./splunk";
import { getSentinelConnector } from "./sentinel";

/** Broadcast one event to every configured SIEM connector. */
export async function broadcastToSiem(event: SiemEvent): Promise<void> {
  const connectors = [
    getElasticConnector(),
    getSplunkConnector(),
    getSentinelConnector(),
  ].filter(Boolean);

  if (connectors.length === 0) return;

  const results = await Promise.allSettled(
    connectors.map((c) => c!.send(event))
  );

  for (const r of results) {
    if (r.status === "rejected") {
      console.error("[siem] Connector send failed:", r.reason);
    }
  }
}

/** Broadcast a batch of events to every configured SIEM connector. */
export async function broadcastBatchToSiem(events: SiemEvent[]): Promise<void> {
  if (events.length === 0) return;

  const connectors = [
    getElasticConnector(),
    getSplunkConnector(),
    getSentinelConnector(),
  ].filter(Boolean);

  if (connectors.length === 0) return;

  const results = await Promise.allSettled(
    connectors.map((c) => c!.sendBatch(events))
  );

  for (const r of results) {
    if (r.status === "rejected") {
      console.error("[siem] Connector batch send failed:", r.reason);
    }
  }
}
