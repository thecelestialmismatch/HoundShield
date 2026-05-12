/**
 * Hound Shield — Microsoft Teams Integration
 *
 * Posts compliance alerts to Microsoft Teams via Incoming Webhooks
 * using Adaptive Cards v1.5 format.
 *
 * Features:
 *   - Adaptive Cards with severity-coded color strips
 *   - Facts table (action, risk level, provider, confidence, event ID)
 *   - "Review in Dashboard" action button
 *   - Entity type context block
 *   - Exponential backoff retry (3 attempts)
 *
 * Environment variables:
 *   TEAMS_WEBHOOK_URL           — default channel (required)
 *   TEAMS_ALERT_WEBHOOK_URL     — high/critical override channel (optional)
 *   NEXT_PUBLIC_APP_URL         — base URL for review links
 *
 * Setup: In Teams, create an "Incoming Webhook" connector on the target
 * channel and paste the generated URL as TEAMS_WEBHOOK_URL.
 */

export interface TeamsCompliancePayload {
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

const RETRY_DELAYS = [1_000, 2_000, 4_000];

// Adaptive Card accent colors (hex)
const SEVERITY_COLORS: Record<TeamsCompliancePayload["severity"], string> = {
  low: "good",       // green
  medium: "warning", // yellow
  high: "attention", // orange/red
  critical: "accent", // blue (Teams doesn't have purple natively)
};

const ACTION_LABEL: Record<TeamsCompliancePayload["action"], string> = {
  ALLOWED: "✅ ALLOWED",
  BLOCKED: "🚫 BLOCKED",
  QUARANTINED: "🔒 QUARANTINED",
};

/**
 * Posts a compliance event notification to Microsoft Teams as an Adaptive Card.
 */
export async function postTeamsAlert(payload: TeamsCompliancePayload): Promise<void> {
  const defaultUrl = process.env.TEAMS_WEBHOOK_URL;
  const alertUrl = process.env.TEAMS_ALERT_WEBHOOK_URL;

  const webhookUrl =
    (payload.severity === "critical" || payload.severity === "high") && alertUrl
      ? alertUrl
      : defaultUrl;

  if (!webhookUrl) return; // Teams not configured

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://houndshield.com";
  const reviewUrl =
    payload.reviewUrl ??
    `${appUrl}/command-center/events?id=${payload.eventId}`;

  const ts = payload.timestamp ?? new Date().toISOString();
  const formattedTs = new Date(ts).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // Build facts array
  const facts: Array<{ title: string; value: string }> = [
    { title: "Action", value: ACTION_LABEL[payload.action] },
    { title: "Risk Level", value: payload.riskLevel },
  ];
  if (payload.provider) facts.push({ title: "Provider", value: payload.provider });
  if (payload.confidence !== undefined) {
    facts.push({ title: "Confidence", value: `${Math.round(payload.confidence * 100)}%` });
  }
  if (payload.userId) facts.push({ title: "User", value: payload.userId.slice(0, 8) + "…" });
  facts.push({ title: "Event ID", value: payload.eventId.slice(0, 16) + "…" });
  facts.push({ title: "Timestamp", value: formattedTs });

  // Adaptive Card body
  const cardBody: unknown[] = [
    // Title block with severity color
    {
      type: "TextBlock",
      text: payload.title,
      weight: "Bolder",
      size: "Large",
      color: SEVERITY_COLORS[payload.severity],
      wrap: true,
    },
    // Description
    {
      type: "TextBlock",
      text: payload.description,
      wrap: true,
      spacing: "Small",
    },
    // Separator
    { type: "TextBlock", text: " ", spacing: "None" },
    // Facts
    {
      type: "FactSet",
      facts,
      spacing: "Medium",
    },
  ];

  // Entities block
  if (payload.entities && payload.entities.length > 0) {
    const entityText = payload.entities.slice(0, 6).join("  ·  ");
    cardBody.push({
      type: "TextBlock",
      text: `**Detected:** ${entityText}${payload.entities.length > 6 ? ` · +${payload.entities.length - 6} more` : ""}`,
      wrap: true,
      spacing: "Small",
      color: "Attention",
      size: "Small",
    });
  }

  // Microsoft Teams Incoming Webhook payload (uses legacy card format for compatibility)
  const teamsPayload = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.5",
          body: cardBody,
          actions: [
            {
              type: "Action.OpenUrl",
              title: "Review in Dashboard",
              url: reviewUrl,
              style: payload.severity === "critical" ? "destructive" : "positive",
            },
          ],
          msteams: {
            width: "Full",
          },
        },
      },
    ],
  };

  await postWithRetry(webhookUrl, teamsPayload);
}

/**
 * Posts a plain text notification to Teams (for HITL, system alerts, etc.)
 */
export async function postTeamsMessage(options: {
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  actionUrl?: string;
  metadata?: Record<string, string>;
}): Promise<void> {
  const url = process.env.TEAMS_WEBHOOK_URL;
  if (!url) return;

  const color =
    options.severity === "critical"
      ? "Attention"
      : options.severity === "warning"
        ? "Warning"
        : "Good";

  const body: unknown[] = [
    {
      type: "TextBlock",
      text: options.title,
      weight: "Bolder",
      size: "Large",
      color,
      wrap: true,
    },
    {
      type: "TextBlock",
      text: options.message,
      wrap: true,
    },
  ];

  if (options.metadata && Object.keys(options.metadata).length > 0) {
    body.push({
      type: "FactSet",
      facts: Object.entries(options.metadata).slice(0, 10).map(([k, v]) => ({
        title: k,
        value: v,
      })),
      spacing: "Medium",
    });
  }

  const actions = options.actionUrl
    ? [
        {
          type: "Action.OpenUrl",
          title: "Review",
          url: options.actionUrl,
          style: "positive",
        },
      ]
    : [];

  await postWithRetry(url, {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.5",
          body,
          actions,
        },
      },
    ],
  });
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function postWithRetry(
  url: string,
  body: unknown
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) return;

      if (res.status === 400) {
        const text = await res.text().catch(() => "");
        console.error(`[houndshield:teams] Payload rejected (${res.status}): ${text}`);
        return;
      }

      if (attempt < RETRY_DELAYS.length) {
        await sleep(RETRY_DELAYS[attempt]);
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

  console.error("[houndshield:teams] Notification failed after retries:", lastError);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
