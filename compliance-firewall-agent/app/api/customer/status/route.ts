import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { buildOrderView, type OrderRowLike } from '@/lib/reports/order-view';
import { buildCustomerStatus, type OrderSummary } from '@/lib/customer/status';

/**
 * GET /api/customer/status — the signed-in customer's ACCOUNT-level status
 * (tier, latest $499 report order → stage / next step). Every read is RLS-scoped
 * to auth.uid(), so it only ever reflects the caller's own data.
 *
 * Note the deliberate privacy split: SPRS / assessment data lives in the browser
 * (localStorage) and is NOT read here — the dashboard panel computes the full
 * readiness view client-side and merges it with this account view. This endpoint
 * is the server-side source for account status (and a no-assessment fallback).
 */

export const dynamic = 'force-dynamic';

function toOrderSummary(row: OrderRowLike): OrderSummary {
  const view = buildOrderView(row);
  return {
    reference: view.reference,
    status: view.status,
    statusLabel: view.statusLabel,
    reportDueDate: view.reportDueDate,
    isDelivered: view.status === 'report_delivered' || Boolean(view.reportDeliveredAt),
  };
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    // Demo mode: no account data. Return a coherent not-started status.
    return NextResponse.json({
      status: buildCustomerStatus({ sprs: null, account: { tier: 'free', latestOrder: null } }),
      configured: false,
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [profileRes, ordersRes] = await Promise.all([
    supabase.from('profiles').select('tier, company, full_name').eq('id', user.id).maybeSingle(),
    supabase
      .from('report_orders')
      .select(
        'id, email, full_name, vertical, amount_cents, currency, status, is_wholesale, stripe_session_id, report_delivered_at, created_at',
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  const tier = (profileRes.data?.tier as string) || 'free';
  const company = (profileRes.data?.company as string) || null;
  const fullName = (profileRes.data?.full_name as string) || '';
  const firstName = fullName.trim().split(/\s+/)[0] || null;
  const latestRow = (ordersRes.data?.[0] as OrderRowLike | undefined) ?? null;
  const latestOrder = latestRow ? toOrderSummary(latestRow) : null;

  const status = buildCustomerStatus({
    sprs: null,
    account: { tier, latestOrder },
    org: { name: company },
  });

  return NextResponse.json({ status, firstName, configured: true });
}
