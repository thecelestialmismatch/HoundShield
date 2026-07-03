import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServiceClient } from '@/lib/supabase/client';
import { upgradeEmail } from '@/lib/email/templates/upgrade';
import { canceledEmail } from '@/lib/email/templates/canceled';
import { reportOrderEmail } from '@/lib/email/templates/report-order';

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
 * Send a transactional email to a raw address (no account required). Used for
 * the one-time $499 report buyer, who purchases without signing up. Best-effort:
 * never throws, never blocks the webhook's core job.
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
    console.error('[Stripe Webhook] report email failed (non-fatal):', err);
  }
}

/**
 * Record + fulfill a one-time $499 CMMC AI Risk Assessment Report purchase.
 * Best-effort fulfillment email; the order row is the source of truth. Never
 * throws — billing has already succeeded by the time Stripe calls us.
 */
async function handleReportOrder(
  supabase: ServiceClient,
  session: Stripe.Checkout.Session,
): Promise<void> {
  const email =
    session.customer_details?.email ?? session.customer_email ?? '';
  const fullName = session.customer_details?.name ?? '';
  const meta = session.metadata ?? {};
  const isWholesale = meta.wholesale === 'true';

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

  const { error } = await supabase.from('report_orders').upsert(
    {
      email,
      full_name: fullName || null,
      vertical: meta.vertical || null,
      stripe_session_id: session.id,
      stripe_payment_intent_id: (session.payment_intent as string) ?? null,
      stripe_customer_id: (session.customer as string) ?? null,
      amount_cents: session.amount_total ?? (isWholesale ? 29900 : 49900),
      currency: session.currency ?? 'usd',
      partner_ref: meta.partner_ref || null,
      is_wholesale: isWholesale,
      status: 'paid',
      user_id: linkedUserId,
    },
    { onConflict: 'stripe_session_id' },
  );

  if (error) {
    console.error('[Stripe Webhook] report_orders upsert failed:', error);
  }
  console.log(`[Stripe Webhook] report order recorded: ${session.id} email=${email} wholesale=${isWholesale}`);

  await sendTransactionalToEmail(email, {
    from: reportOrderEmail.from,
    subject: reportOrderEmail.subject,
    html: reportOrderEmail.html(fullName),
  });
}

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-02-25.clover',
  });
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
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  if (!process.env.STRIPE_SECRET_KEY || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const stripe = getStripe();
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
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // One-time $499 report (mode: 'payment') — Stage 1 primary product.
        // No subscription, and the buyer may not have an account. Handle and stop.
        if (session.mode === 'payment' || session.metadata?.product === 'cmmc_ai_risk_report') {
          await handleReportOrder(supabase, session);
          break;
        }

        const subscriptionId = session.subscription as string;
        const userId = session.metadata?.supabase_user_id
          || (await getCustomerUserId(supabase, session.customer as string));

        if (!userId) {
          console.warn('[Stripe Webhook] checkout.session.completed: no user ID found', { subscriptionId });
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
        const subscriptionId = invoice.subscription as string | undefined;
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
        const subscriptionId = invoice.subscription as string | undefined;
        if (subscriptionId) {
          await supabase.from('subscriptions')
            .update({ status: 'active' })
            .eq('stripe_subscription_id', subscriptionId)
            .eq('status', 'past_due'); // only touch past_due rows
          console.log(`[Stripe Webhook] invoice.paid: sub=${subscriptionId} → active`);
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
