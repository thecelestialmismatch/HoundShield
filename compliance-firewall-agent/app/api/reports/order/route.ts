import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { isSupabaseConfigured, createServiceClient } from '@/lib/supabase/client';
import { buildOrderView, type OrderRowLike } from '@/lib/reports/order-view';

/**
 * GET /api/reports/order?session_id=cs_...
 *
 * Powers the post-purchase confirmation on `/report/thank-you` for the $499
 * one-time CMMC AI Risk Assessment Report.
 *
 * Deliberately unauthenticated: the buyer just paid and may not have an account.
 * The Stripe checkout `session_id` (`cs_...`, ~66 unguessable chars) acts as a
 * bearer token for THIS order only — the same id Stripe put in the success_url.
 *
 * Stripe is the source of truth for the confirmation, so it is instant and
 * immune to the webhook race (the `report_orders` row may not be written yet).
 * We retrieve the session, require it to be actually paid, then enrich with the
 * DB row if it has landed. Only the sanitized `buildOrderView` object is
 * returned — the email is masked and no Stripe/customer identifiers leak.
 */

export const dynamic = 'force-dynamic';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-02-25.clover',
  });
}

export async function GET(request: NextRequest) {
  const sessionId = new URL(request.url).searchParams.get('session_id')?.trim() ?? '';

  // Validate shape before spending a Stripe call. Checkout session ids are
  // `cs_` followed by alphanumerics/underscores.
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
    return NextResponse.json({ error: 'Invalid or missing session_id' }, { status: 400 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const stripe = getStripe();

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    // Unknown session id — don't distinguish "never existed" from "not yours".
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Only confirm genuinely-paid orders. An unpaid/expired session reveals nothing.
  const isPaid =
    session.payment_status === 'paid' || session.payment_status === 'no_payment_required';
  if (!isPaid) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Enrich from the persisted order if the webhook has already recorded it.
  let row: Record<string, unknown> | null = null;
  if (isSupabaseConfigured()) {
    try {
      const supabase = createServiceClient();
      const { data } = await supabase
        .from('report_orders')
        .select('*')
        .eq('stripe_session_id', sessionId)
        .maybeSingle();
      row = (data as Record<string, unknown> | null) ?? null;
    } catch {
      // Non-fatal: fall back to the Stripe-only synthesis below.
      row = null;
    }
  }

  const createdAtISO = new Date((session.created ?? Math.floor(Date.now() / 1000)) * 1000).toISOString();

  const normalized: OrderRowLike = {
    id: (row?.id as string) ?? null,
    email:
      (row?.email as string) ??
      session.customer_details?.email ??
      session.customer_email ??
      '',
    full_name: (row?.full_name as string) ?? session.customer_details?.name ?? null,
    vertical: (row?.vertical as string) ?? session.metadata?.vertical ?? null,
    amount_cents: (row?.amount_cents as number) ?? session.amount_total ?? 49900,
    currency: (row?.currency as string) ?? session.currency ?? 'usd',
    status: (row?.status as string) ?? 'paid',
    is_wholesale: (row?.is_wholesale as boolean) ?? session.metadata?.wholesale === 'true',
    stripe_session_id: sessionId,
    report_delivered_at: (row?.report_delivered_at as string) ?? null,
    created_at: (row?.created_at as string) ?? createdAtISO,
  };

  return NextResponse.json({ order: buildOrderView(normalized) });
}
