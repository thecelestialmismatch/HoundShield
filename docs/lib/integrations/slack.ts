/**
 * Hound Shield — Slack Integration
 *
 * Full Slack integration using Incoming Webhooks and Block Kit.
 *
 * Features:
 *   - Rich Block Kit messages with severity color bars
 *   - Context blocks showing detected entity types
 *   - Metadata key-value section
 *   - Action buttons linking to the dashboard review page
 *   - Exponential backoff retry (3 attempts: 1s → 2s → 4s)
 *   - Multi-channel routing: critical alerts go to a separate alert channel
 *
 * Environment variables:
 *   SLACK_WEBHOOK_URL          — default channel (required)
 *   SLACK_ALERT_WEBHOOK_URL    — high-severity override channel (optional)
 *   NEXT_PUBLIC_APP_URL        — base URL for review links
 */

export interface SlackCompliancePayload {
  eventId: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  riskLevel: string;
  action: "ALLOWED" | "BLOCKED" | "QUARANTINED";
  entities?: string[];
  userId?: string;
  provider?: string;
  confidence?: number;
  reviewUrl?: string;
  timestamp?: string;
}

// Retry delays in milliseconds
const RETRY_DELAYS = [1_000, 2_000, 4_000];

const SEVERITY_COLORS: Record<SlackCompliancePayload["severity"], string> = {
  low: "#36a64f",       // green
  medium: "#ff9800",    // orange
  high: "#e53935",      // red
  critical: "#6a0dad",  // purple
};

const SEVERITY_EMOJI: Record<SlackCompliancePayload["severity"], string> = {
  low: ":white_check_mark:",
  medium: ":warning:",
  high: ":red_circle:",
  critical: ":rotating_light:",
};

const ACTION_EMOJI: Record<SlackCompliancePayload["action"], string> = {
  ALLOWED: ":unlock:",
  BLOCKED: ":no_entry:",
  QUARANTINED: ":lock:",
};

/**
 * Posts a compliance event notification to Slack.
 *
 * Routes CRITICAL events to `SLACK_ALERT_WEBHOOK_URL` if configured,
 * falling back to `SLACK_WEBHOOK_URL` for all other events.
 */
export async function postSlackAlert(payload: SlackCompliancePayload): Promise<void> {
  const defaultUrl = process.env.SLACK_WEBHOOK_URL;
  const alertUrl = process.env.SLACK_ALERT_WEBHOOK_URL;

  const webhookUrl =
    (payload.severity === "critical" || payload.severity === "high") && alertUrl
      ? alertUrl
      : defaultUrl;

  if (!webhookUrl) return; // Slack not configured

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://houndshield.com";
  const reviewUrl =
    payload.reviewUrl ??
    `${appUrl}/command-center/events?id=${payload.eventId}`;

  const ts = payload.timestamp ?? new Date().toISOString();

  const body = {
    // Fallback text for notifications and clients that don't render blocks
    text: `${SEVERITY_EMOJI[payload.severity]} *${payload.title}* — ${payload.action}`,
    attachments: [
      {
        color: SEVERITY_COLORS[payload.severity],
        blocks: [
          // Header
          {
            type: "header",
            text: {
              type: "plain_text",
              text: `${SEVERITY_EMOJI[payload.severity]} ${payload.title}`,
              emoji: true,
            },
          },
          // Main description
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: payload.description,
            },
          },
          // Key fields
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Action*\n${ACTION_EMOJI[payload.action]} ${payload.action}`,
              },
              {
                type: "mrkdwn",
                text: `*Risk Level*\n${payload.riskLevel}`,
              },
              ...(payload.provider
                ? [{ type: "mrkdwn", text: `*Provider*\n${payload.provider}` }]
                : []),
              ...(payload.confidence !== undefined
                ? [
                    {
                      type: "mrkdwn",
                      text: `*Confidence*\n${Math.round(payload.confidence * 100)}%`,
                    },
                  ]
                : []),
              ...(payload.userId
                ? [{ type: "mrkdwn", text: `*User*\n${payload.userId.slice(0, 8)}…` }]
                : []),
              {
                type: "mrkdwn",
                text: `*Event ID*\n\`${payload.eventId.slice(0, 12)}…\``,
              },
            ],
          },
          // Detected entities (if any)
          ...(payload.entities && payload.entities.length > 0
            ? [
                {
                  type: "context",
                  elements: [
                    {
                      type: "mrkdwn",
                      text: `*Detected:* ${payload.entities.slice(0, 5).join(" · ")}${payload.entities.length > 5 ? ` · +${payload.entities.length - 5} more` : ""}`,
                    },
                  ],
                },
              ]
            : []),
          // Timestamp
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `<!date^${Math.floor(new Date(ts).getTime() / 1000)}^{date_short_pretty} at {time}|${ts}>`,
              },
            ],
          },
          // Action button
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: { type: "plain_text", text: "Review in Dashboard", emoji: true },
                url: reviewUrl,
                style: payload.severity === "critical" ? "danger" : "primary",
                action_id: "review_event",
              },
            ],
          },
        ],
      },
    ],
  };

  await postWithRetry(webhookUrl, body);
}

/**
 * Posts a plain notification (used by HITL approval gates, system alerts, etc.)
 */
export async function postSlackMessage(options: {
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  actionUrl?: string;
  metadata?: Record<string, string>;
}): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;

  const emoji =
    options.severity === "critical"
      ? ":rotating_light:"
      : options.severity === "warning"
        ? ":warning:"
        : ":information_source:";

  const body: Record<string, unknown> = {
    text: `${emoji} *${options.title}*`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${emoji} *${options.title}*\n${options.message}`,
        },
      },
      ...(options.metadata && Object.keys(options.metadata).length > 0
        ? [
            {
              type: "section",
              fields: Object.entries(options.metadata)
                .slice(0, 10)
                .map(([k, v]) => ({
                  type: "mrkdwn",
                  text: `*${k}*\n${v}`,
                })),
            },
          ]
        : []),
      ...(options.actionUrl
        ? [
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: { type: "plain_text", text: "Review", emoji: true },
                  url: options.actionUrl,
                  style: "primary",
                  action_id: "review_action",
                },
              ],
            },
          ]
        : []),
    ],
  };

  await postWithRetry(url, body);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function postWithRetry(
  url: string,
  body: Record<string, unknown>
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok || res.status === 400) {
        // 400 from Slack means bad payload, not transient — don't retry
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.error(`[houndshield:slack] Payload rejected (${res.status}): ${text}`);
        }
        return;
      }

      // 429 or 5xx — retry
      if (attempt < RETRY_DELAYS.length) {
        const retryAfter = parseInt(res.headers.get("retry-after") ?? "0", 10);
        await sleep(retryAfter > 0 ? retryAfter * 1_000 : RETRY_DELAYS[attempt]);
        continue;
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < RETRY_DELAYS.length) {
        await sleep(RETRY_DELAYS[attempt]);
        continue;
      }
    }
  }

  console.error("[houndshield:slack] Notification failed after retries:", lastError);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
