/**
 * Notification dispatch for HITL approval requests.
 *
 * Supports two channels:
 *   1. Slack webhook (free — just create an incoming webhook)
 *   2. Console logging (always-on fallback)
 *
 * Email could be added via Resend (free tier: 100 emails/day)
 * but is omitted to keep dependencies at zero cost.
 */

export interface NotificationPayload {
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  action_url?: string;
  metadata?: Record<string, string>;
}

export async function sendNotification(
  payload: NotificationPayload
): Promise<void> {
  // Always log to console
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

  // Slack webhook (if configured)
  const slackUrl = process.env.SLACK_WEBHOOK_URL;
  if (slackUrl) {
    try {
      await fetch(slackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `${severityEmoji(payload.severity)} *${payload.title}*`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `${severityEmoji(payload.severity)} *${payload.title}*\n${payload.message}`,
              },
            },
            ...(payload.action_url
              ? [
                  {
                    type: "actions",
                    elements: [
                      {
                        type: "button",
                        text: { type: "plain_text", text: "Review" },
                        url: payload.action_url,
                        style: "primary",
                      },
                    ],
                  },
                ]
              : []),
          ],
        }),
      });
    } catch (err) {
      console.error("Slack notification failed:", err);
    }
  }
}

function severityEmoji(severity: string): string {
  switch (severity) {
    case "critical":
      return ":red_circle:";
    case "warning":
      return ":large_yellow_circle:";
    default:
      return ":large_blue_circle:";
  }
}
