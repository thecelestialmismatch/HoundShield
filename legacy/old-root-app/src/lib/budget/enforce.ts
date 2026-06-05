import { createServiceClient } from "@/lib/supabase/server";
import { sendBudgetAlert } from "@/lib/alerts/slack";
import type { BudgetRow, OrgRow } from "@/lib/supabase/types";

export type BudgetStatus = "within_budget" | "soft_alert" | "hard_blocked";

export interface BudgetCheckResult {
  allowed: boolean;
  status: BudgetStatus;
  usedUsd: number;
  limitUsd: number | null;
  pctUsed: number | null;
  /** Set when the caller should fire a Slack alert */
  alertPayload?: AlertPayload;
}

interface AlertPayload {
  webhookUrl: string | null | undefined;
  orgName: string;
  orgId: string;
  usedUsd: number;
  limitUsd: number;
  pctUsed: number;
  period: string;
  scopeType: string;
  scopeId: string;
  level: "warning" | "critical";
}

/**
 * In-memory dedup: track when we last sent a soft alert per org.
 * Volatile (resets on cold start) — acceptable for V1.
 * Replace with a Supabase column (last_alert_sent_at) for production durability.
 */
const lastSoftAlertMs = new Map<string, number>();
const SOFT_ALERT_COOLDOWN_MS = 60 * 60 * 1_000; // 1 hour

/**
 * Check whether the org has budget remaining for this period.
 * Returns immediately if no budget is configured (allow all).
 *
 * This function does NOT send alerts — it returns an alertPayload
 * for the caller to fire asynchronously so the proxy response is not blocked.
 */
export async function checkBudget(orgId: string): Promise<BudgetCheckResult> {
  const supabase = createServiceClient();

  // Fetch org-level budget (scope '*') for the monthly period
  // Future: layer in project/user-scoped budgets
  const { data: budget, error: budgetErr } = await supabase
    .from("budgets")
    .select("*")
    .eq("org_id", orgId)
    .eq("scope_type", "org")
    .eq("scope_id", "*")
    .eq("period", "monthly")
    .maybeSingle();

  if (budgetErr) {
    console.error("[budget] failed to fetch budget", budgetErr);
    // Fail open — never block on infra errors
    return { allowed: true, status: "within_budget", usedUsd: 0, limitUsd: null, pctUsed: null };
  }

  if (!budget) {
    // No budget configured — allow all
    return { allowed: true, status: "within_budget", usedUsd: 0, limitUsd: null, pctUsed: null };
  }

  // Sum usage since period start
  const periodStart = getPeriodStart(budget.period);
  const { data: usedRaw, error: sumErr } = await supabase.rpc("sum_usage_since", {
    p_org_id: orgId,
    p_since: periodStart.toISOString(),
  });

  if (sumErr) {
    console.error("[budget] failed to sum usage", sumErr);
    return { allowed: true, status: "within_budget", usedUsd: 0, limitUsd: null, pctUsed: null };
  }

  const usedUsd = Number(usedRaw ?? 0);
  const limitUsd = Number(budget.limit_usd);
  const pctUsed = limitUsd > 0 ? (usedUsd / limitUsd) * 100 : 0;

  // Hard block
  if (pctUsed >= budget.hard_block_pct) {
    // Fetch org for Slack alert context (fire-and-forget later)
    const { data: org } = await supabase.from("orgs").select("name,slack_webhook_url").eq("id", orgId).single();

    return {
      allowed: false,
      status: "hard_blocked",
      usedUsd,
      limitUsd,
      pctUsed,
      alertPayload: buildAlertPayload(org, budget, orgId, usedUsd, limitUsd, pctUsed, "critical"),
    };
  }

  // Soft alert
  if (pctUsed >= budget.soft_alert_pct) {
    const now = Date.now();
    const lastSent = lastSoftAlertMs.get(orgId) ?? 0;
    const shouldAlert = now - lastSent > SOFT_ALERT_COOLDOWN_MS;

    if (shouldAlert) {
      lastSoftAlertMs.set(orgId, now);
      const { data: org } = await supabase.from("orgs").select("name,slack_webhook_url").eq("id", orgId).single();

      return {
        allowed: true,
        status: "soft_alert",
        usedUsd,
        limitUsd,
        pctUsed,
        alertPayload: buildAlertPayload(org, budget, orgId, usedUsd, limitUsd, pctUsed, "warning"),
      };
    }
  }

  return { allowed: true, status: "within_budget", usedUsd, limitUsd, pctUsed };
}

function buildAlertPayload(
  org: Pick<OrgRow, "name" | "slack_webhook_url"> | null,
  budget: BudgetRow,
  orgId: string,
  usedUsd: number,
  limitUsd: number,
  pctUsed: number,
  level: "warning" | "critical"
): AlertPayload {
  return {
    webhookUrl: org?.slack_webhook_url,
    orgName: org?.name ?? orgId,
    orgId,
    usedUsd,
    limitUsd,
    pctUsed,
    period: budget.period,
    scopeType: budget.scope_type,
    scopeId: budget.scope_id,
    level,
  };
}

/** Fire Slack alert from an alertPayload (async, non-blocking) */
export function fireAlert(payload: AlertPayload): void {
  sendBudgetAlert(
    payload.webhookUrl,
    {
      orgName: payload.orgName,
      orgId: payload.orgId,
      usedUsd: payload.usedUsd,
      limitUsd: payload.limitUsd,
      pctUsed: payload.pctUsed,
      period: payload.period,
      scopeType: payload.scopeType,
      scopeId: payload.scopeId,
    },
    payload.level
  ).catch((err) => console.error("[budget] alert fire failed", err));
}

/**
 * Get period start timestamp in UTC (exported for testing).
 * UTC is correct for a multi-tenant proxy: one unambiguous boundary for all orgs.
 */
export function getPeriodStart(period: string): Date {
  const now = new Date();
  switch (period) {
    case "daily":
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    case "weekly": {
      const dayOfWeek = now.getUTCDay(); // 0 = Sunday
      return new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - dayOfWeek, // rewind to Sunday
      ));
    }
    case "monthly":
    default:
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }
}
