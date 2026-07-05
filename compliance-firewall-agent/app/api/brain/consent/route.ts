import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { z } from 'zod';

/**
 * Brain AI account-data consent — GET reads, POST sets the signed-in user's
 * opt-in for Brain AI to access THEIR OWN account data (SPRS posture, assessment
 * progress, $499 report order status) to personalize guidance.
 *
 * This is the "ask permission" gate. Default is off (migration 022). Reads and
 * writes go through the cookie (anon) Supabase client, so RLS restricts them to
 * the caller's own profile row — a user can only see and toggle their own
 * consent, never anyone else's.
 */

export const dynamic = 'force-dynamic';

const bodySchema = z.object({ consent: z.boolean() });

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ consent: false, configured: false });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('brain_ai_data_consent, brain_ai_consent_updated_at')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('[brain/consent] read failed:', error.message);
    return NextResponse.json({ error: 'Failed to read consent' }, { status: 500 });
  }

  return NextResponse.json({
    consent: Boolean(data?.brain_ai_data_consent),
    updatedAt: data?.brain_ai_consent_updated_at ?? null,
    configured: true,
  });
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Expected { consent: boolean }' }, { status: 400 });
  }

  // RLS (WITH CHECK auth.uid() = id) guarantees this only ever touches the
  // caller's own row. The explicit .eq is belt-and-suspenders.
  const { error } = await supabase
    .from('profiles')
    .update({
      brain_ai_data_consent: parsed.data.consent,
      brain_ai_consent_updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    console.error('[brain/consent] write failed:', error.message);
    return NextResponse.json({ error: 'Failed to save consent' }, { status: 500 });
  }

  return NextResponse.json({ consent: parsed.data.consent });
}
