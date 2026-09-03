import type Stripe from 'stripe';
import { createServiceClient } from '@/lib/supabase/client';
import { reportOrderEmail } from '@/lib/email/templates/report-order';
import { verticalFromClientReference } from '@/lib/stripe/report-payment-link';
import { founderInbox } from '@/lib/email/identity';
import { maskEmail } from '@/lib/reports/order-view';
import { RISK_REPORT_RETAIL_CENTS, RISK_REPORT_WHOLESALE_CENTS } from '@/lib/pricing/plans';

/**
 * Recording and fulfillment for the $499 one-time CMMC AI Risk Assessment
 * Report — the Stage-1 primary product.
 *
 * WHY THIS IS A MODULE AND NOT A FUNCTION INSIDE THE WEBHOOK ROUTE.
 * Until now the only thing that could turn a Stripe payment into a
 * `report_orders` row, a buyer receipt and a founder alert was
 * `POST /api/stripe/webhook`. That made one env var —
 * `STRIPE_WEBHOOK_SECRET` — the single point of failure for the entire
 * revenue path: unset, the route answers 503 to every delivery, Stripe retries
 * and eventually disables the endpoint, and a real $499 sale leaves no trace
 * anywhere the founder looks.
 *
 * `app/api/cron/reconcile-orders` is the second rail. It reads paid Checkout
 * Sessions back out of Stripe and replays them through THIS function, so a
 * sale the webhook never delivered is still recorded and still alerted — one
 * day late instead of never.
 *
 * Two rails means two chances to diverge. Per `tasks/lessons.md` ("four copies
 * of an escape function is four different escape functions"), there is exactly
 * one definition of what a report order IS, and both rails call it.
 */

export type ServiceClient = ReturnType<typeof createServiceClient>;

/** Which rail recorded this order. Logged, and returned to the reconciler. */
export type ReportOrderSource = 'webhook' | 'reconciler';

export type RecordReportOrderResult = {
  /** The Stripe Checkout Session id — the idempotency key. */
  sessionId: string;
  /** True when this call created the row (as opposed to finding it already there). */
  created: boolean;
  /** True when the buyer receipt + founder alert were sent on this call. */
  notified: boolean;
  /** The status the row now carries: 'paid' | 'pending_payment' | a later fulfillment state. */
  status: string;
  /** Set when the upsert failed. The caller decides whether that is fatal. */
  error?: string;
};

/**
 * Send a transactional email to a raw address (no account required). Used for
 * the one-time $499 report buyer, who purchases without signing up. Best-effort:
 * never throws, never blocks the caller's core job.
 */
async function sendTransactionalToEmail(
  to: string,
  build: { from: string; subject: string; html: string },
): Promise<void> {
  try {
    if (!process.env.RESEND_API_KEY || !to) return;
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({ from: build.from, to, subject: build.subject, html: build.html });
  } catch (err) {
    console.error('[Report Fulfillment] report email failed (non-fatal):', err);
  }
}

/**
 * `checkout.session.completed` does NOT mean the money arrived.
 * Delayed-notification payment methods (ACH Direct Debit, Bacs, SEPA, Klarna)
 * fire it the moment the buyer authorises, with `payment_status: 'unpaid'` and
 * funds still days out. Recording that as 'paid' puts an unfunded order into
 * the fulfillment queue and into the founder revenue count.
 *
 * Exported because the reconciler filters on it BEFORE deciding a session is
 * worth replaying, and that decision must use the same rule as the webhook.
 */
export function isSessionPaid(session: Pick<Stripe.Checkout.Session, 'payment_status'>): boolean {
  return session.payment_status !== 'unpaid';
}

/**
 * True when this Checkout Session is a $499 report purchase rather than a
 * subscription. Mirrors the webhook's branch exactly: `mode: 'payment'` covers
 * both the dynamic checkout and the Stripe-hosted Payment Link fallback (which
 * carries no metadata at all), and the explicit product tag is belt-and-braces.
 */
export function isReportSession(
  session: Pick<Stripe.Checkout.Session, 'mode' | 'metadata'>,
): boolean {
  return session.mode === 'payment' || session.metadata?.product === 'cmmc_ai_risk_report';
}

/**
 * Record + fulfill a one-time $499 CMMC AI Risk Assessment Report purchase.
 * Best-effort fulfillment email; the order row is the source of truth. Never
 * throws — billing has already succeeded by the time either rail calls this.
 */
export async function recordReportOrder(
  supabase: ServiceClient,
  session: Stripe.Checkout.Session,
  source: ReportOrderSource = 'webhook',
): Promise<RecordReportOrderResult> {
  const tag = source === 'reconciler' ? '[Reconcile Orders]' : '[Stripe Webhook]';
  const email = session.customer_details?.email ?? session.customer_email ?? '';
  const fullName = session.customer_details?.name ?? '';
  const meta = session.metadata ?? {};
  const isWholesale = meta.wholesale === 'true';
  // Payment-link sales (the fallback rail) carry no metadata — the vertical,
  // when known, rides in client_reference_id (lib/stripe/report-payment-link.ts).
  const vertical =
    meta.vertical || verticalFromClientReference(session.client_reference_id) || null;

  // Reconcile the purchase to an existing account by email, if one exists, so
  // the buyer sees their order once they sign in (migration 017 adds user_id).
  let linkedUserId: string | null = null;
  if (email) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', email)
      .limit(1)
      .maybeSingle();
    linkedUserId = profile?.id ?? null;
  }

  // Idempotency guard. Stripe retries webhooks (delivery timeout / any non-2xx)
  // and the reconciler re-reads the same window every day, so the same session
  // arrives many times. The upsert below is idempotent (onConflict:
  // stripe_session_id), but the fulfillment emails are NOT — a naive replay
  // re-sends both the buyer receipt AND the founder sale alert. Probe for an
  // existing order first so we email only the first time it is recorded.
  const { data: existingOrder } = await supabase
    .from('report_orders')
    .select('id, status')
    .eq('stripe_session_id', session.id)
    .maybeSingle();

  const paid = isSessionPaid(session);

  // Never walk a status BACKWARDS. A late Stripe retry (or an
  // async_payment_succeeded arriving after fulfillment began) must not reset
  // 'proxy_deployed', 'report_delivered', or 'refunded' back to 'paid'.
  const priorStatus = (existingOrder?.status as string | undefined) ?? null;
  const status = paid
    ? (priorStatus && priorStatus !== 'pending_payment' ? priorStatus : 'paid')
    : 'pending_payment';

  // Fulfillment emails fire exactly once: on the first delivery that is actually
  // PAID. An unpaid first delivery records the row silently; the later async
  // success promotes it and sends then. A plain replay sends nothing.
  const shouldNotify = paid && (!existingOrder || priorStatus === 'pending_payment');

  const { error } = await supabase.from('report_orders').upsert(
    {
      email,
      full_name: fullName || null,
      vertical,
      stripe_session_id: session.id,
      stripe_payment_intent_id: (session.payment_intent as string) ?? null,
      stripe_customer_id: (session.customer as string) ?? null,
      amount_cents:
        session.amount_total ?? (isWholesale ? RISK_REPORT_WHOLESALE_CENTS : RISK_REPORT_RETAIL_CENTS),
      currency: session.currency ?? 'usd',
      partner_ref: meta.partner_ref || null,
      is_wholesale: isWholesale,
      status,
      user_id: linkedUserId,
    },
    { onConflict: 'stripe_session_id' },
  );

  // A failed upsert is reported but does NOT suppress the emails below.
  // The invariant this whole module exists to defend is "a human always hears
  // about money". An email that reaches the founder beats a row nobody is
  // watching, so a database outage must not re-create the silent sale. The
  // cost is a possible duplicate alert when the reconciler later succeeds and
  // sees no existing row — one duplicate email against one missed $499 sale is
  // not a close call.
  if (error) {
    console.error(`${tag} report_orders upsert failed:`, error);
  }

  // Masked, not raw. This line wrote a paying customer's address into Vercel's
  // log retention in plaintext, where it is readable by anyone with project
  // access and outlives the request by weeks. For a compliance product whose
  // pitch is "prompts never leave your network", leaking buyer PII into a
  // third-party log store is the wrong side of our own argument. The session id
  // is retained because it is the actual correlation key for support, and it is
  // not personal data. Reuses the tested helper in lib/reports/order-view.ts.
  console.log(
    `${tag} report order recorded: ${session.id} email=${maskEmail(email)} wholesale=${isWholesale} status=${status}`,
  );

  if (!shouldNotify) {
    console.log(
      `${tag} report order ${session.id} not notifying (paid=${paid} prior=${priorStatus ?? 'none'})`,
    );
    return {
      sessionId: session.id,
      created: !existingOrder && !error,
      notified: false,
      status,
      ...(error ? { error: error.message ?? 'upsert failed' } : {}),
    };
  }

  // Buyer receipt + fulfillment kickoff (best-effort).
  await sendTransactionalToEmail(email, {
    from: reportOrderEmail.from,
    subject: reportOrderEmail.subject,
    html: reportOrderEmail.html(fullName),
  });

  // Founder alert — actionable "go fulfill this" notification for the
  // manually-delivered product, beyond Stripe's generic payment receipt.
  // Best-effort; billing already succeeded, so this never blocks or throws.
  await sendTransactionalToEmail(
    founderInbox(),
    reportOrderEmail.founderAlert({
      email,
      name: fullName,
      vertical: vertical ?? undefined,
      isWholesale,
      amountCents: session.amount_total ?? undefined,
      // A recovered sale is not a normal sale: the webhook did not deliver it,
      // so the founder is learning about it late and needs to know why.
      recovered: source === 'reconciler',
    }),
  );

  return {
    sessionId: session.id,
    created: !existingOrder && !error,
    notified: true,
    status,
    ...(error ? { error: error.message ?? 'upsert failed' } : {}),
  };
}
