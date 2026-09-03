import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/session'
import { isAdmin } from '@/lib/admin/role'
import { isBetterAuthEnabled } from '@/lib/auth/auth-config'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { buildHealthReport } from '@/lib/health/service-status'

/**
 * Protected diagnostic counterpart to /api/health.
 *
 * The public endpoint deliberately exposes only liveness. This route is kept
 * server-side, requires an authenticated profile-backed administrator role, and
 * fails closed on any missing session, role lookup failure, or configuration
 * uncertainty. It reports only coarse non-secret readiness signals.
 *
 * ── 2026-09-03: the real diagnostics are wired back in ──
 * `lib/health/service-status.ts` (431 lines) and `lib/auth/reset-diagnostics.ts`
 * were written to answer "which control is actually doing its job", and a
 * reachability audit found NOTHING imported either of them. They were orphaned
 * when /api/health was correctly reduced to a bare liveness probe, and were
 * never re-homed here.
 *
 * The cost was not the dead code. CLAUDE.md's Session Start Protocol tells every
 * session to curl /api/health to check integration health, and its Integration
 * Status table claimed that endpoint reports missing control stores and
 * reset-code configuration as degraded rather than green. It could not: it
 * returns a constant. The documented check was answering `ok` no matter what
 * was broken.
 *
 * `buildHealthReport()` is value-free by construction — every signal is derived
 * from the SHAPE or PRESENCE of configuration, never its content — so it is safe
 * behind this admin gate, which is strictly stronger than the public endpoint it
 * was originally written for.
 */
export async function GET() {
  const viewer = await getSessionUser()
  if (!viewer || !(await isAdmin(viewer.id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } })
  }

  // Never throws by contract — a health endpoint that 500s during an incident
  // is the one time it had a job to do.
  const report = await buildHealthReport()

  return NextResponse.json({
    // `ok` only when every probed control is actually operational. An admin
    // reading this needs the verdict, not just the rows.
    status: report.degraded.length === 0 ? 'ok' : 'degraded',
    degraded: report.degraded,
    services: report.services,
    diagnostics: {
      authProvider: isBetterAuthEnabled() ? 'better-auth' : 'supabase-auth',
      supabaseConfigured: isSupabaseConfigured(),
    },
  }, { headers: { 'Cache-Control': 'no-store' } })
}
