import { stripeKeyDiagnostic, stripeWebhookDiagnostic } from '@/lib/stripe/env';

/**
 * The state of the money path, and the knobs the reconciler runs on.
 *
 * These live here rather than in `app/api/cron/reconcile-orders/route.ts`
 * because a Next.js route module may only export HTTP handlers and a fixed set
 * of config keys — anything else fails the build's route-type check. That
 * constraint pushed the logic somewhere better: this is money-path domain
 * knowledge, not request handling, and it is now unit-testable without going
 * through a route.
 */

/** How far back a scheduled reconciliation run looks. Stripe retains sessions
 *  far longer; the window only has to exceed the gap between runs by a wide
 *  margin so a few missed days cannot open a hole. */
export const DEFAULT_LOOKBACK_DAYS = 30;

/** Manual sweeps (after fixing a long-broken webhook) may widen the window,
 *  but not without bound — an unbounded window is an unbounded Stripe read. */
export const MAX_LOOKBACK_DAYS = 90;

/** Parse and clamp `?days=`. Anything unparseable falls back to the default,
 *  because a typo in a manual sweep must not silently narrow the window. */
export function lookbackDays(raw: string | null): number {
  const n = Number.parseInt(raw ?? '', 10);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_LOOKBACK_DAYS;
  return Math.min(n, MAX_LOOKBACK_DAYS);
}

export type MoneyPathStatus = {
  keyOk: boolean;
  webhookOk: boolean;
  degraded: boolean;
  keyStatus: string;
  webhookStatus: string;
  hints: string[];
};

/**
 * Is the money path whole?
 *
 * Two independent conditions, because they fail independently and the fixes
 * are different:
 *  - `webhookOk`  — sales are recorded in real time.
 *  - `keyOk`      — the reconciler can read Stripe at all, promo codes work,
 *                   and the branded thank-you page resolves.
 *
 * Neither being false stops the $499 report from SELLING: the Stripe-hosted
 * Payment Link is billed by Stripe directly and no env state here can take it
 * down. What they decide is whether anyone finds out.
 */
export function moneyPathStatus(): MoneyPathStatus {
  const key = stripeKeyDiagnostic();
  const hook = stripeWebhookDiagnostic();
  const keyOk = key.status === 'connected';
  const webhookOk = hook.status === 'configured';
  return {
    keyOk,
    webhookOk,
    degraded: !keyOk || !webhookOk,
    keyStatus: key.status,
    webhookStatus: hook.status,
    hints: [key.hint, hook.hint].filter((h): h is string => Boolean(h)),
  };
}

/**
 * Send the degraded-money-path alert at most once a week, without needing any
 * storage to remember when it last went out.
 *
 * A daily nag for a condition that takes five minutes to fix gets read twice
 * and filtered forever — after which the alarm is worth less than nothing,
 * because its silence no longer means anything either. Tracking "last sent"
 * properly needs a table this app does not have. Keying on the weekday gives
 * exactly one alert per week, deterministically, from a stateless daily job.
 *
 * Monday, in UTC, to match the cron's own UTC schedule.
 */
export function isWeeklyAlertDay(now: Date = new Date()): boolean {
  return now.getUTCDay() === 1;
}
