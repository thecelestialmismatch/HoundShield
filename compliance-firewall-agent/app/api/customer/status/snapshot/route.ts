import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured, createServiceClient } from '@/lib/supabase/client';
import { buildCustomerStatus, type SprsInput } from '@/lib/customer/status';
import { sprsInputSchema } from '@/lib/brain-ai/status-intent';
import {
  toSnapshotRow,
  shouldInsertSnapshot,
  computeTrend,
  type StatusSnapshotRow,
} from '@/lib/customer/snapshot';

/**
 * POST /api/customer/status/snapshot
 *
 * Records a non-CUI snapshot of the caller's OWN compliance posture so the
 * dashboard can show progress over time. The client sends its locally-computed
 * SPRS slice; the server merges account data (own rows), stores only the posture
 * columns, and returns the trend vs the previous snapshot.
 *
 * Guards:
 *   • Auth required (session-derived id).
 *   • Consent required — only stored when the user has granted Brain AI data
 *     access (migration 022). Without consent → 200 { stored:false } (no write).
 *   • Deduped — an unchanged snapshot inside the min window is not re-written.
 */

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ stored: false, reason: 'not_configured' });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('brain_ai_data_consent, tier, company')
    .eq('id', user.id)
    .maybeSingle();

  // No consent → never store posture. Fail closed.
  if (!profile?.brain_ai_data_consent) {
    return NextResponse.json({ stored: false, reason: 'no_consent' });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsedSprs = sprsInputSchema.safeParse((body as { sprs?: unknown })?.sprs);
  const sprs: SprsInput | null = parsedSprs.success ? parsedSprs.data : null;

  const status = buildCustomerStatus({
    sprs,
    account: { tier: (profile.tier as string) || 'free', latestOrder: null },
    org: { name: (profile.company as string) || null },
  });

  // Latest prior snapshot (own rows via RLS through the cookie client).
  const { data: latestRows } = await supabase
    .from('customer_status_snapshots')
    .select('user_id, sprs_score, completion_percent, stage, gap_count, next_step_title, next_step_href, captured_at')
    .eq('user_id', user.id)
    .order('captured_at', { ascending: false })
    .limit(1);

  const latest = (latestRows?.[0] as StatusSnapshotRow | undefined) ?? null;
  const trend = computeTrend(status, latest);

  if (!shouldInsertSnapshot(status, latest, Date.now())) {
    return NextResponse.json({ stored: false, reason: 'deduped', trend });
  }

  // Insert via the service role (RLS write policy is service-role); the row is
  // still stamped with the authenticated user's own id — never a client value.
  const service = createServiceClient();
  const { error } = await service
    .from('customer_status_snapshots')
    .insert(toSnapshotRow(status, user.id));

  if (error) {
    console.error('[status/snapshot] insert failed:', error.message);
    return NextResponse.json({ stored: false, reason: 'error' }, { status: 500 });
  }

  return NextResponse.json({ stored: true, trend });
}
