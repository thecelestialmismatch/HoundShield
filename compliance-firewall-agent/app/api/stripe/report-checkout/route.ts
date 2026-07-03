import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { isSupabaseConfigured, createServiceClient } from '@/lib/supabase/client';

/**
 * POST /api/stripe/report-checkout
 *
 * Stage 1 PRIMARY PRODUCT — the $499 one-time "CMMC AI Risk Assessment Report".
 *
 * Deliberately NOT gated behind Supabase auth. A $499 report is an impulse
 * purchase that bypasses procurement review; forcing a full account signup
 * before payment adds friction that kills the conversion. Stripe Checkout
 * collects the buyer's email; the webhook records the order in `report_orders`
 * and sends fulfillment instructions.
 *
 * Pricing is anchored at $499 and must never drop below it (it anchors value).
 * RPO/MSP co-brand wholesale is $299 — passed via `partner_ref` + `wholesale`.
 *
 * Env:
 *   STRIPE_SECRET_KEY        (required)
 *   STRIPE_REPORT_PRICE_ID   (optional — if set, uses the configured one-time
 *                             price; otherwise builds an inline $499 price so
 *                             the product sells before the dashboard SKU exists)
 */

const RETAIL_CENTS = 49900;     // $499 — never lower (anchors value)
const WHOLESALE_CENTS = 29900;  // $299 — RPO/MSP co-brand wholesale only

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-02-25.clover',
  });
}

const VALID_VERTICALS = new Set(['defense', 'healthcare', 'legal']);

/**
 * Wholesale ($299) is only valid for a real, approved partner (audit H3).
 * `partner_ref` must be the id of a partner_applications row whose status is
 * 'approved' or 'active'. Any unverified ref falls back to the $499 retail price
 * so the $499 anchor can never be self-served away.
 */
async function isApprovedPartner(partnerRef: string | undefined): Promise<boolean> {
  if (!partnerRef || !isSupabaseConfigured()) return false;
  // partner_ref must look like a UUID (the partner application id).
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(partnerRef)) {
    return false;
  }
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('partner_applications')
      .select('id, status')
      .eq('id', partnerRef)
      .in('status', ['approved', 'active'])
      .limit(1)
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe not configured. Set STRIPE_SECRET_KEY in environment.' },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      vertical,
      partner_ref,
      wholesale = false,
    } = body as { vertical?: string; partner_ref?: string; wholesale?: boolean };

    // Wholesale ($299) is only valid for a verified, approved partner — the
    // ref is checked against the DB server-side (audit H3). A client cannot
    // self-serve the wholesale price by passing an arbitrary partner_ref.
    const isWholesale = Boolean(wholesale) && (await isApprovedPartner(partner_ref));
    const amount = isWholesale ? WHOLESALE_CENTS : RETAIL_CENTS;

    const cleanVertical =
      typeof vertical === 'string' && VALID_VERTICALS.has(vertical) ? vertical : '';

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://houndshield.com';

    const configuredPriceId = process.env.STRIPE_REPORT_PRICE_ID;

    // Use the configured SKU at retail; fall back to an inline price so the
    // product is purchasable immediately. Wholesale always uses an inline price
    // (the configured SKU is the public $499 one).
    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem =
      configuredPriceId && !isWholesale
        ? { price: configuredPriceId, quantity: 1 }
        : {
            quantity: 1,
            price_data: {
              currency: 'usd',
              unit_amount: amount,
              product_data: {
                name: 'CMMC AI Risk Assessment Report',
                description:
                  '14-day AI prompt risk assessment in your own environment → SHA-256-signed PDF mapped to NIST 800-171 Rev 2.',
              },
            },
          };

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [lineItem],
      success_url: `${appUrl}/report/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing?report_canceled=true`,
      billing_address_collection: 'auto',
      allow_promotion_codes: true,
      // Stripe collects the email; webhook reads it for fulfillment.
      metadata: {
        product: 'cmmc_ai_risk_report',
        vertical: cleanVertical,
        partner_ref: partner_ref ?? '',
        wholesale: isWholesale ? 'true' : 'false',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[Stripe Report Checkout]', err);
    return NextResponse.json(
      { error: 'Failed to create report checkout session' },
      { status: 500 }
    );
  }
}
