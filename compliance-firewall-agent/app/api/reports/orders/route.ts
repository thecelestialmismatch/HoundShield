import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { buildOrderView, type OrderRowLike } from '@/lib/reports/order-view';

/**
 * GET /api/reports/orders
 *
 * The signed-in customer's own $499 CMMC AI Risk Assessment Report orders.
 *
 * Uses the cookie-based (anon) Supabase client, so Row-Level Security enforces
 * ownership: migration 020's `auth_users_read_own_report_orders` policy returns
 * only rows where `user_id = auth.uid()`. The explicit `.eq('user_id', ...)` is
 * belt-and-suspenders on top of RLS. Orders reconcile to an account by email
 * (migrations 017 + the webhook's user_id linkage), so a buyer who later signs
 * in with the purchase email sees their order here.
 *
 * Returns the sanitized `buildOrderView` shape (masked email, no Stripe ids).
 */

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isSupabaseConfigured()) {
    // Demo mode / unconfigured — no orders to show, not an error.
    return NextResponse.json({ orders: [] });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('report_orders')
    .select(
      'id, email, full_name, vertical, amount_cents, currency, status, is_wholesale, stripe_session_id, report_delivered_at, created_at',
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[reports/orders] query failed:', error.message);
    return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 });
  }

  const orders = ((data as OrderRowLike[]) ?? []).map(buildOrderView);
  return NextResponse.json({ orders });
}
