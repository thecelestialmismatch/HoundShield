import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeSecretKey } from '@/lib/stripe/env';
import { STRIPE_API_VERSION } from '@/lib/stripe/api-version';
import { createClient } from '@/lib/supabase/server';
import { SITE_URL } from '@/lib/site-url';

function getStripe() {
  return new Stripe(getStripeSecretKey()!, {
    apiVersion: STRIPE_API_VERSION,
  });
}

/**
 * POST /api/stripe/portal
 * Creates a Stripe Customer Portal session for the authenticated user.
 * Allows them to manage their subscription, update payment methods, etc.
 */
export async function POST() {
  try {
    if (!getStripeSecretKey()) {
      return NextResponse.json(
        { error: 'Stripe not configured. Set STRIPE_SECRET_KEY in environment.' },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get Stripe customer ID from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No billing account found. Please subscribe to a plan first.' },
        { status: 404 }
      );
    }

    const stripe = getStripe();

    // SITE_URL, not `NEXT_PUBLIC_APP_URL || localhost`. That variable is UNSET in
    // production (measured 2026-08-14 — see lib/site-url.ts), so this route was
    // handing Stripe a `return_url` of `http://localhost:3000/command-center/settings`:
    // a paying customer finishes managing their billing, clicks back, and lands on
    // their own machine. SITE_URL still honours the override where it is set.
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${SITE_URL}/command-center/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[Stripe Portal]', err);
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    );
  }
}
