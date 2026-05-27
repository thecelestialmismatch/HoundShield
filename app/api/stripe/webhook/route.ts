import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServiceClient } from '@/lib/supabase/client';

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
