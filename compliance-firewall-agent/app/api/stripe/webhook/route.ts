import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeSecretKey, getStripeWebhookSecret } from '@/lib/stripe/env';
import { STRIPE_API_VERSION } from '@/lib/stripe/api-version';
import { createServiceClient } from '@/lib/supabase/client';
import { upgradeEmail } from '@/lib/email/templates/upgrade';
import { canceledEmail } from '@/lib/email/templates/canceled';
// ONE definition of what a $499 report order is. The daily reconciler
// (app/api/cron/reconcile-orders) replays missed sales through the same
// function, so the two rails cannot drift.
import { recordReportOrder, isReportSession } from '@/lib/stripe/report-fulfillment';

type ServiceClient = ReturnType<typeof createServiceClient>;

/**
 * Best-effort transactional email. NEVER throws and NEVER blocks the webhook's
 * core job (DB writes) — billing state must persist even if email fails.
 */
async function sendTransactional(
  supabase: ServiceClient,
  userId: string,
  build: (orgName: string) => { from: string; subject: string; html: string },
): Promise<void> {
  try {
    if (!process.env.RESEND_API_KEY) return;
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();
    if (!profile?.email) return;

    const { from, subject, html } = build(profile.full_name ?? 'there');
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({ from, to: profile.email, subject, html });
  } catch (err) {
    console.error('[Stripe Webhook] transactional email failed (non-fatal):', err);
  }
}

/**
 * Signature verification (`webhooks.constructEvent`) is a local HMAC check over
 * the raw body — it needs the signing secret, never the API key. But stripe-node
 * (22.x) throws "Neither apiKey nor config.authenticator provided" on a falsy
 * key, so key-free deliveries get this placeholder. It is never used for an API
 * call: the only branch that talks to Stripe guards on the real key first.
 *
 * Deliberately NOT `sk_`-shaped — a credential-shaped literal in source trips
 * secret scanners and invites a reader to mistake it for a real key.
 */
const SIGNATURE_ONLY_PLACEHOLDER_KEY = 'unset-signature-verification-only';

function getStripe(secretKey: string | null) {
  return new Stripe(secretKey ?? SIGNATURE_ONLY_PLACEHOLDER_KEY, {
    apiVersion: STRIPE_API_VERSION,
  });
}

/**
 * The subscription id on an Invoice.
 *
 * Stripe MOVED this field in API version `2025-04-30.basil`: the top-level
 * `invoice.subscription` was replaced by
 * `invoice.parent.subscription_details.subscription`. This integration pins
 * `2026-07-29.dahlia` (lib/stripe/api-version.ts) and the live event
 * destination runs `2026-02-25.clover` — BOTH are past basil, so the old field
 * is absent on every delivery in production.
 *
 * The two invoice handlers below read `invoice.subscription` directly and were
 * therefore dead: a failed payment never moved a subscription to `past_due`,
 * and a recovered one never moved it back to `active`. Nothing failed loudly
 * because both handlers `as`-cast the invoice to `Record<string, unknown>`,
 * which silences the compiler, and because their tests hand-build the
 * pre-basil shape (`{ subscription: "sub_123" }`) — a payload Stripe no longer
 * sends. Green tests over dead code.
 *
 * Read the new path first, then fall back to the legacy field so an endpoint
 * still pinned to a pre-basil API version keeps working. The value may be
 * expanded to a full Subscription object, so accept either form.
 */
function invoiceSubscriptionId(invoice: Record<string, unknown>): string | undefined {
  const parent = invoice.parent as
    | { subscription_details?: { subscription?: string | { id?: string } } }
    | undefined;
  const fromParent = parent?.subscription_details?.subscription;
  if (typeof fromParent === 'string') return fromParent;
  if (fromParent && typeof fromParent === 'object' && typeof fromParent.id === 'string') {
    return fromParent.id;
  }
  return typeof invoice.subscription === 'string' ? invoice.subscription : undefined;
}

// Extract period dates from subscription (handles API version differences)
function extractPeriodDates(sub: Record<string, unknown>) {
  const start = sub.current_period_start as number | undefined;
  const end = sub.current_period_end as number | undefined;
  const trialStart = sub.trial_start as number | null | undefined;
  const trialEnd = sub.trial_end as number | null | undefined;
  return {
    current_period_start: start ? new Date(start * 1000).toISOString() : null,
    current_period_end: end ? new Date(end * 1000).toISOString() : null,
    trial_start: trialStart ? new Date(trialStart * 1000).toISOString() : null,
    trial_end: trialEnd ? new Date(trialEnd * 1000).toISOString() : null,
  };
}

export async function POST(request: NextRequest) {
  const webhookSecret = getStripeWebhookSecret() || '';
  const secretKey = getStripeSecretKey();

  // Only the SIGNING SECRET is required to accept a delivery. The $499 report
  // order — the Stage-1 primary product, and the one that sells through the
  // Stripe-hosted Payment Link fallback whenever STRIPE_SECRET_KEY is missing or
  // mis-pasted — is recorded straight from the event payload and never calls the
  // Stripe API. Requiring the API key here meant a live sale on the fallback rail
  // was dropped on the floor: no `report_orders` row, no buyer receipt, no founder
  // alert. Setting the webhook secret alone now makes the money path whole.
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Stripe webhook not configured' }, { status: 503 });
  }

  const stripe = getStripe(secretKey);
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServiceClient();

  console.log(`[Stripe Webhook] Received: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      // `async_payment_succeeded` re-delivers the SAME session once a delayed
      // payment method (ACH, Bacs, SEPA, Klarna) actually settles. It shares this
      // branch so `recordReportOrder` can promote the pending row to 'paid' and
      // send the fulfillment emails then — not at authorisation time.
      case 'checkout.session.async_payment_succeeded':
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // One-time $499 report (mode: 'payment') — Stage 1 primary product.
        // No subscription, and the buyer may not have an account. Handle and stop.
        if (isReportSession(session)) {
          await recordReportOrder(supabase, session, 'webhook');
          break;
        }

        const subscriptionId = session.subscription as string;
        const userId = session.metadata?.supabase_user_id
          || (await getCustomerUserId(supabase, session.customer as string));

        if (!userId) {
          console.warn('[Stripe Webhook] checkout.session.completed: no user ID found', { subscriptionId });
          break;
        }

        // The ONLY branch that calls the Stripe API. Without a usable key we must
        // still ACKNOWLEDGE (2xx): a non-2xx makes Stripe retry and eventually
        // disable the endpoint, which would take the report-order path down with
        // it — the exact revenue loss this route was just fixed to prevent.
        if (!secretKey) {
          console.error(
            `[Stripe Webhook] subscription ${subscriptionId} needs STRIPE_SECRET_KEY to expand — acknowledged and skipped (set the key, then replay this event from the Stripe dashboard)`,
          );
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const tier = subscription.metadata?.tier || 'pro';
        const periods = extractPeriodDates(subscription as unknown as Record<string, unknown>);

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_subscription_id: subscriptionId,
          stripe_price_id: subscription.items.data[0]?.price.id,
          tier,
          status: subscription.status as string,
          cancel_at_period_end: subscription.cancel_at_period_end,
          ...periods,
        }, { onConflict: 'stripe_subscription_id' });

        await supabase.from('profiles').update({ tier }).eq('id', userId);
        console.log(`[Stripe Webhook] checkout.session.completed: user=${userId} tier=${tier} status=${subscription.status}`);

        // Payment confirmation receipt (best-effort).
        await sendTransactional(supabase, userId, (orgName) => ({
          from: upgradeEmail.from,
          subject: upgradeEmail.subject(tier),
          html: upgradeEmail.html(orgName, tier),
        }));
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id
          || (await getCustomerUserId(supabase, subscription.customer as string));

        if (!userId) {
          console.warn('[Stripe Webhook] customer.subscription.updated: no user ID found', { subscriptionId: subscription.id });
          break;
        }

        const tier = subscription.metadata?.tier || 'pro';
        const periods = extractPeriodDates(subscription as unknown as Record<string, unknown>);

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_subscription_id: subscription.id,
          stripe_price_id: subscription.items.data[0]?.price.id,
          tier,
          status: subscription.status as string,
          current_period_start: periods.current_period_start,
          current_period_end: periods.current_period_end,
          cancel_at_period_end: subscription.cancel_at_period_end,
          canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        }, { onConflict: 'stripe_subscription_id' });

        const effectiveTier = subscription.status === 'active' || subscription.status === 'trialing' ? tier : 'free';
        await supabase.from('profiles').update({ tier: effectiveTier }).eq('id', userId);
        console.log(`[Stripe Webhook] customer.subscription.updated: user=${userId} tier=${effectiveTier} status=${subscription.status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id
          || (await getCustomerUserId(supabase, subscription.customer as string));

        if (!userId) {
          console.warn('[Stripe Webhook] customer.subscription.deleted: no user ID found', { subscriptionId: subscription.id });
          break;
        }

        await supabase.from('subscriptions')
          .update({ status: 'canceled', canceled_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subscription.id);

        await supabase.from('profiles').update({ tier: 'free' }).eq('id', userId);
        console.log(`[Stripe Webhook] customer.subscription.deleted: user=${userId} → downgraded to free`);

        // Cancellation confirmation + soft win-back (best-effort).
        await sendTransactional(supabase, userId, (orgName) => ({
          from: canceledEmail.from,
          subject: canceledEmail.subject,
          html: canceledEmail.html(orgName),
        }));
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as unknown as Record<string, unknown>;
        const subscriptionId = invoiceSubscriptionId(invoice);
        if (subscriptionId) {
          await supabase.from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_subscription_id', subscriptionId);
          console.log(`[Stripe Webhook] invoice.payment_failed: sub=${subscriptionId} → past_due`);
        }
        break;
      }

      case 'invoice.paid': {
        // Restores active status after a failed payment is resolved.
        // Belt-and-suspenders alongside customer.subscription.updated.
        const invoice = event.data.object as unknown as Record<string, unknown>;
        const subscriptionId = invoiceSubscriptionId(invoice);
        if (subscriptionId) {
          await supabase.from('subscriptions')
            .update({ status: 'active' })
            .eq('stripe_subscription_id', subscriptionId)
            .eq('status', 'past_due'); // only touch past_due rows
          console.log(`[Stripe Webhook] invoice.paid: sub=${subscriptionId} → active`);
        }
        break;
      }

      case 'checkout.session.async_payment_failed': {
        // The bank declined after the fact. Leave the row for the record, but take
        // it out of the fulfillment queue — nobody should start a 14-day engagement
        // on money that bounced.
        const session = event.data.object as Stripe.Checkout.Session;
        const { error: failError } = await supabase
          .from('report_orders')
          .update({ status: 'payment_failed' })
          .eq('stripe_session_id', session.id);
        if (failError) {
          console.error('[Stripe Webhook] async_payment_failed update failed:', failError);
        } else {
          console.log(`[Stripe Webhook] async_payment_failed: order ${session.id} → payment_failed`);
        }
        break;
      }

      case 'charge.refunded':
      case 'charge.dispute.created': {
        // Money leaving again. Without this, a refunded or charged-back $499 order
        // sits at status 'paid' forever — and the admin revenue rollup counts paid
        // orders as revenue and as paying customers. That is the exact number the
        // Sep 1 kill-criteria review reads, so a stale 'paid' row does not just
        // mis-report: it argues against shutting down using money that came back.
        //
        // The $499 buyer has no account, so there is no user to look up. A Charge
        // (refund) and a Dispute (chargeback) both carry `payment_intent`, which is
        // the only key linking either back to a report order.
        const obj = event.data.object as unknown as {
          payment_intent?: string | { id?: string } | null;
          refunded?: boolean;
          amount_refunded?: number;
          amount?: number;
        };
        const paymentIntentId =
          typeof obj.payment_intent === 'string' ? obj.payment_intent : obj.payment_intent?.id;

        if (!paymentIntentId) {
          console.warn(`[Stripe Webhook] ${event.type}: no payment_intent — cannot match an order`);
          break;
        }

        // `charge.refunded` also fires for PARTIAL refunds (`refunded: false`). A
        // partial refund on a fixed-price report is a support adjustment, not a
        // reversal — flag it in the log but leave the order counted, rather than
        // silently erasing a sale from revenue over a $50 goodwill credit.
        if (event.type === 'charge.refunded' && obj.refunded === false) {
          console.log(
            `[Stripe Webhook] charge.refunded: PARTIAL refund on ${paymentIntentId} (${obj.amount_refunded}/${obj.amount}) — status left unchanged, review manually`,
          );
          break;
        }

        const newStatus = event.type === 'charge.refunded' ? 'refunded' : 'disputed';
        const { error: reversalError } = await supabase
          .from('report_orders')
          .update({ status: newStatus })
          .eq('stripe_payment_intent_id', paymentIntentId);

        if (reversalError) {
          console.error(`[Stripe Webhook] ${event.type}: report_orders update failed:`, reversalError);
        } else {
          console.log(`[Stripe Webhook] ${event.type}: order on ${paymentIntentId} → ${newStatus}`);
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`[Stripe Webhook] Error processing ${event.type}:`, err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function getCustomerUserId(supabase: ReturnType<typeof createServiceClient>, stripeCustomerId: string): Promise<string | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', stripeCustomerId)
    .single();
  return data?.id ?? null;
}
