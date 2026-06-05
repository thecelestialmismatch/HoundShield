// Slack webhook alerts — fire-and-forget, never throw

export interface BudgetAlertPayload {
  orgName: string;
  orgId: string;
  usedUsd: number;
  limitUsd: number;
  pctUsed: number;
  period: string;
  scopeType: string;
  scopeId: string;
}

/**
 * Send a budget threshold alert to Slack.
 * webhookUrl may be an org-specific URL stored in orgs.slack_webhook_url,
 * or fall back to the global SLACK_WEBHOOK_URL env var.
 */
export async function sendBudgetAlert(
  webhookUrl: string | null | undefined,
  payload: BudgetAlertPayload,
  level: "warning" | "critical"
): Promise<void> {
  const url = webhookUrl ?? process.env.SLACK_WEBHOOK_URL;
  if (!url) return;

  const emoji = level === "critical" ? "🚨" : "⚠️";
  const threshold = level === "critical" ? "HARD BLOCKED" : `${payload.pctUsed.toFixed(0)}% used`;
  const scopeLabel =
    payload.scopeType === "org"
      ? "org-wide"
      : `${payload.scopeType}:${payload.scopeId}`;

  const text =
    `${emoji} *AIBudgetGuard — ${level === "critical" ? "Budget Exceeded" : "Budget Warning"}*\n` +
    `*Org:* ${payload.orgName} (\`${payload.orgId}\`)\n` +
    `*Scope:* ${scopeLabel} | *Period:* ${payload.period}\n` +
    `*Spend:* $${payload.usedUsd.toFixed(4)} / $${payload.limitUsd.toFixed(2)} (${threshold})\n` +
    (level === "critical"
      ? "🛑 Requests are being *blocked* until the budget resets or limit is increased."
      : "Requests will be blocked when 100% is reached. Increase limit at aibudgetguard.com/dashboard.");

  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch (err) {
    // Log but never propagate — alert failure must never affect proxy response
    console.error("[slack-alert] failed to send", err);
  }
}
