import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/session'
import { isAdmin } from '@/lib/admin/role'
import { isBetterAuthEnabled } from '@/lib/auth/auth-config'
import { isSupabaseConfigured } from '@/lib/supabase/client'

/**
 * Protected diagnostic counterpart to /api/health.
 *
 * The public endpoint deliberately exposes only liveness. This route is kept
 * server-side, requires an authenticated profile-backed administrator role, and
 * fails closed on any missing session, role lookup failure, or configuration
 * uncertainty. It reports only coarse non-secret readiness signals.
 */
export async function GET() {
  const viewer = await getSessionUser()
  if (!viewer || !(await isAdmin(viewer.id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } })
  }

  return NextResponse.json({
    status: 'ok',
    diagnostics: {
      authProvider: isBetterAuthEnabled() ? 'better-auth' : 'supabase-auth',
      supabaseConfigured: isSupabaseConfigured(),
    },
  }, { headers: { 'Cache-Control': 'no-store' } })
}
