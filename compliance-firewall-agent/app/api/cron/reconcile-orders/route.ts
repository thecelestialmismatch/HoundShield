import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeSecretKey } from '@/lib/stripe/env';
import { STRIPE_API_VERSION } from '@/lib/stripe/api-version';
import { createServiceClient } from '@/lib/supabase/client';
import {
  recordReportOrder,
  isReportSession,
  isSessionPaid,
  type RecordReportOrderResult,
} from '@/lib/stripe/report-fulfillment';
import {
  lookbackDays,
  moneyPathStatus,
  isWeeklyAlertDay,
  type MoneyPathStatus,
} from '@/lib/stripe/money-path';
import { moneyPathAlertEmail } from '@/lib/email/templates/money-path-alert';
import { founderInbox } from '@/lib/email/identity';

/**
 * GET /api/cron/reconcile-orders
 *
 * THE SECOND RAIL FOR MONEY.
 *
 * Until this existed, one env var (`STRIPE_WEBHOOK_SECRET`) was the single
 * point of failure for every $499 sale. Unset, `POST /api/stripe/webhook`
 * answers 503 to every delivery: no `report_orders` row, no buyer receipt, no
 * founder alert, and after enough failed deliveries Stripe disables the
 * endpoint entirely. A real customer could pay and nobody would ever know —
 * the exact failure `tasks/todo.md` has carried as the #1 revenue item since
 * 2026-08-15, on a product whose Stage-1 milestone is literally "3 paid
 * reports".
 *
 * This job closes that hole from the other direction. Once a day it asks
 * Stripe what it was actually paid, and replays anything the webhook missed
 * through the SAME `recordReportOrder` the webhook uses. Worst case a sale is
 * recorded and alerted 24 hours late instead of never.
 *
 * It also watches the rails themselves. When the money path is degraded (no
 * webhook secret, no/malformed API key) it emails the founder a weekly, plain
 * -English alert — because "the money path is broken" currently lives only in
 * a Vercel log line that nobody reads.
 *
 * Auth: `Authorization: Bearer <CRON_SECRET>` — Vercel sets this on scheduled
 * invocations. Manual runs (e.g. after fixing the webhook, to sweep the
 * backlog) pass the same header and may widen the window with `?days=N`.
 *
 * Requires `STRIPE_SECRET_KEY`: reading sessions back out of Stripe is an API
 * call, so unlike the webhook this rail cannot work key-free. Without the key
 * the run is a no-op that still fires the configuration alert — silence is the
 * one outcome that is never acceptable here.
 */

/** Stripe's per-page maximum. */
const PAGE_SIZE = 100;
/** Hard stop so a pathological account cannot run the function to its timeout. */
const MAX_PAGES = 10;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[reconcile-orders] CRON_SECRET not set');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 });
  }
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const money = moneyPathStatus();
  const force = request.nextUrl.searchParams.get('alert') === 'force';
  const alerted = await maybeAlert(money, force);

  const key = getStripeSecretKey();
  if (!key || !(key.startsWith('sk_') || key.startsWith('rk_'))) {
    // No key, no read. Say so in the response body rather than 5xx-ing: a
    // scheduled job that reports "unauthorized" would be indistinguishable
    // from a broken one in the Vercel cron dashboard.
    console.error(
      '[reconcile-orders] STRIPE_SECRET_KEY missing or unusable — cannot reconcile. A webhook-missed sale stays invisible until this is set.',
    );
    return NextResponse.json({
      skipped: true,
      reason: 'STRIPE_SECRET_KEY missing or unusable',
      moneyPath: money,
      alerted,
    });
  }

  const days = lookbackDays(request.nextUrl.searchParams.get('days'));
  const since = Math.floor(Date.now() / 1000) - days * 86400;
  const stripe = new Stripe(key, { apiVersion: STRIPE_API_VERSION });
  const supabase = createServiceClient();

  let scanned = 0;
  let reportSessions = 0;
  const recovered: RecordReportOrderResult[] = [];
  const errors: string[] = [];
  let startingAfter: string | undefined;

  try {
    for (let page = 0; page < MAX_PAGES; page++) {
      const batch = await stripe.checkout.sessions.list({
        created: { gte: since },
        limit: PAGE_SIZE,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });

      for (const session of batch.data) {
        scanned++;
        // Same two predicates the webhook applies, imported rather than
        // restated — a divergence here would mean the reconciler either
        // misses report sales or invents subscription ones.
        if (!isReportSession(session) || !isSessionPaid(session)) continue;
        reportSessions++;

        const result = await recordReportOrder(supabase, session, 'reconciler');
        if (result.error) errors.push(`${result.sessionId}: ${result.error}`);
        // `notified` is the honest measure of a RECOVERY: the row was not
        // already there in a paid state, so this sale had never been seen.
        // A session that was already recorded returns notified=false and is
        // correctly not counted — the daily re-scan of the same 30-day window
        // must not inflate the number every morning.
        if (result.notified) recovered.push(result);
      }

      if (!batch.has_more) break;
      startingAfter = batch.data[batch.data.length - 1]?.id;
      if (!startingAfter) break;
    }
  } catch (err) {
    // Partial progress is real progress — anything already recovered above is
    // recorded and alerted. Report the failure rather than discarding the run.
    const message = err instanceof Error ? err.message : String(err);
    console.error('[reconcile-orders] Stripe read failed:', message);
    errors.push(`stripe_list: ${message}`);
  }

  // ── Reversals ────────────────────────────────────────────────────────────
  // Money leaves the same way it arrives, and the same broken webhook drops
  // both. A refund the webhook never delivered leaves the order at 'paid'
  // forever, which does not just mis-report: the admin revenue rollup counts
  // paid orders as revenue and as paying customers, and that is the exact
  // number the kill-criteria review reads. Reconciling sales without
  // reconciling reversals would make the number confidently wrong in the
  // flattering direction.
  const reversed: string[] = [];
  try {
    const refunds = await stripe.refunds.list({ created: { gte: since }, limit: PAGE_SIZE });
    for (const refund of refunds.data) {
      // Only a FULL reversal changes the order's standing. A partial refund on
      // a fixed-price report is a support adjustment, and the webhook makes the
      // same call — see the charge.refunded branch there.
      if (refund.status !== 'succeeded') continue;
      const paymentIntentId =
        typeof refund.payment_intent === 'string' ? refund.payment_intent : refund.payment_intent?.id;
      if (!paymentIntentId) continue;

      const { data: order } = await supabase
        .from('report_orders')
        .select('id, status, amount_cents')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .maybeSingle();
      if (!order || order.status === 'refunded' || order.status === 'disputed') continue;
      if (typeof order.amount_cents === 'number' && refund.amount < order.amount_cents) continue;

      const { error: reversalError } = await supabase
        .from('report_orders')
        .update({ status: 'refunded' })
        .eq('stripe_payment_intent_id', paymentIntentId);
      if (reversalError) {
        errors.push(`refund ${paymentIntentId}: ${reversalError.message ?? 'update failed'}`);
        continue;
      }
      reversed.push(paymentIntentId);
      console.warn(
        `[reconcile-orders] RECONCILED a refund the webhook never delivered: ${paymentIntentId} → refunded`,
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[reconcile-orders] refund read failed:', message);
    errors.push(`stripe_refunds: ${message}`);
  }

  if (recovered.length > 0) {
    console.warn(
      `[reconcile-orders] RECOVERED ${recovered.length} paid report order(s) the webhook never delivered: ${recovered
        .map((r) => r.sessionId)
        .join(', ')}`,
    );
  }

  return NextResponse.json({
    ok: true,
    windowDays: days,
    scanned,
    reportSessions,
    recovered: recovered.length,
    recoveredSessionIds: recovered.map((r) => r.sessionId),
    reversed: reversed.length,
    reversedPaymentIntentIds: reversed,
    errors,
    moneyPath: money,
    alerted,
  });
}

/**
 * Weekly configuration alert. Best-effort and never throws — a failed alert
 * must not fail the reconciliation run that follows it.
 */
async function maybeAlert(
  money: MoneyPathStatus,
  force: boolean,
): Promise<boolean> {
  if (!money.degraded) return false;
  if (!force && !isWeeklyAlertDay()) return false;
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const mail = moneyPathAlertEmail({
      webhookOk: money.webhookOk,
      keyOk: money.keyOk,
      hints: money.hints,
    });
    await resend.emails.send({
      from: mail.from,
      to: founderInbox(),
      subject: mail.subject,
      html: mail.html,
    });
    return true;
  } catch (err) {
    console.error('[reconcile-orders] money-path alert failed (non-fatal):', err);
    return false;
  }
}
