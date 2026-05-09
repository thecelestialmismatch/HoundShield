import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-02-25.clover',
  });
}

/**
 * HoundShield Pricing — Canonical Structure (May 2026)
 *
 * Starter: $0     — 5 users, 7-day log retention, basic scan
 * Pro:     $199/mo — 25 users, 30-day retention, full CMMC + PDF export
 * Enterprise: $499/mo — 100 users, 90-day retention, SSO + API access + C3PAO report
 * Agency:  $1,499/mo — unlimited clients, white-label, partner commission
 *
 * All prices match /pricing page exactly. No orphaned tiers.
 * Env vars: STRIPE_PRO_MONTHLY_PRICE_ID, STRIPE_PRO_ANNUAL_PRICE_ID, etc.
 */
const PRICE_MAP: Record<string, { monthly: string; annual: string }> = {
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '',
    annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID || '',
  },
  enterprise: {
    monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || '',
    annual: process.env.STRIPE_ENTERPRISE_ANNUAL_PRICE_ID || '',
  },
  agency: {
    monthly: process.env.STRIPE_AGENCY_MONTHLY_PRICE_ID || '',
    annual: process.env.STRIPE_AGENCY_ANNUAL_PRICE_ID || '',
  },
};

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error: 'Demo mode active. Connect your Supabase account before subscribing.',
          setup_url: '/command-center/settings',
        },
        { status: 503 }
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
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

    const body = await request.json();
    const { tier, billing = 'monthly' } = body as { tier: string; billing?: 'monthly' | 'annual' };

    if (!PRICE_MAP[tier]) {
      return NextResponse.json(
        { error: `Invalid tier: ${tier}. Valid tiers: pro, enterprise, agency` },
        { status: 400 }
      );
    }

    const priceId = PRICE_MAP[tier][billing];
    if (!priceId) {
      return NextResponse.json(
        { error: `Price not configured for ${tier} (${billing}). Set STRIPE_${tier.toUpperCase()}_${billing.toUpperCase()}_PRICE_ID in environment.` },
        { status: 503 }
      );
    }

    const stripe = getStripe();

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, full_name')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || profile?.email || '',
        name: profile?.full_name || '',
        metadata: { supabase_user_id: user.id, source: 'houndshield' },
      });
      customerId = customer.id;

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://houndshield.com';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/command-center?upgrade=success&tier=${tier}`,
      cancel_url: `${appUrl}/pricing?canceled=true`,
      subscription_data: {
        metadata: { supabase_user_id: user.id, tier },
        trial_period_days: 14,
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[Stripe Checkout]', err);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
