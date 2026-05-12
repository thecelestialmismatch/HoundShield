/**
 * Notification dispatch for HITL approval requests and compliance events.
 *
 * Routes notifications to all configured channels simultaneously:
 *   1. Slack (via lib/integrations/slack.ts — Block Kit, retry, multi-channel)
 *   2. Microsoft Teams (via lib/integrations/teams.ts — Adaptive Cards, retry)
 *   3. Console logging (always-on fallback)
 *
 * For full compliance event forwarding to SIEM platforms (Splunk, Sentinel),
 * use lib/integrations/siem/ directly from your audit logger.
 */

import { postSlackMessage } from "@/lib/integrations/slack";
import { postTeamsMessage } from "@/lib/integrations/teams";

export interface NotificationPayload {
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  action_url?: string;
  metadata?: Record<string, string>;
}

/**
 * Dispatches a notification to all configured channels.
 *
 * Failures in any individual channel are caught and logged — they never
 * prevent the notification from reaching other channels.
 */
export async function sendNotification(
  payload: NotificationPayload
): Promise<void> {
  // Console is always-on — useful even in production for log aggregators
  const prefix =
    payload.severity === "critical"
      ? "[CRITICAL]"
      : payload.severity === "warning"
        ? "[WARNING]"
        : "[INFO]";

  console.log(
    `${prefix} ${payload.title}: ${payload.message}`,
    payload.metadata ?? ""
  );

  // Dispatch to all channels in parallel; individual failures are isolated
  await Promise.allSettled([
    postSlackMessage({
      title: payload.title,
      message: payload.message,
      severity: payload.severity,
      actionUrl: payload.action_url,
      metadata: payload.metadata,
    }),
    postTeamsMessage({
      title: payload.title,
      message: payload.message,
      severity: payload.severity,
      actionUrl: payload.action_url,
      metadata: payload.metadata,
    }),
  ]);
}
