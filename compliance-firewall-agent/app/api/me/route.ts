import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';

/**
 * GET /api/me — the signed-in user's own identity for personalization.
 *
 * Session-derived (never a client-sent id), own-account only. Used to greet the
 * customer by their real first name in Brain AI and the dashboard, so the name
 * shown is ALWAYS their own account — never another user's, never a sample org.
 * Returns { authenticated:false } for guests (public widget) rather than erroring.
 */

export const dynamic = 'force-dynamic';

function firstName(full: string | null | undefined): string {
  return (full ?? '').trim().split(/\s+/)[0] ?? '';
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ authenticated: false });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ authenticated: false });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, company, role, tier')
    .eq('id', user.id)
    .maybeSingle();

  const fullName = (profile?.full_name as string) || '';
  return NextResponse.json({
    authenticated: true,
    name: fullName || null,
    firstName: firstName(fullName) || null,
    company: (profile?.company as string) || null,
    role: (profile?.role as string) || null,
    tier: (profile?.tier as string) || 'free',
    // Never expose the email or id here — name-level personalization only.
  });
}
