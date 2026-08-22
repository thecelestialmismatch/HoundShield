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
 * uncertainty.
 *
 * WHY THE FULL REPORT LIVES HERE AND NOT AT /api/health.
 * `lib/health/service-status.ts` was written to close audit finding #20c —
 * security controls that are entirely absent while everything else reads green
 * — and it was complete, tested, and wired to NOTHING. `buildHealthReport()`
 * had zero production callers, so the only thing that ever ran it was its own
 * test file. A control-degradation report nobody can read is the same failure
 * it was written to fix, one level up.
 *
 * It is mounted behind the admin gate rather than on the public route because
 * its hints name unapplied migrations by filename and unset environment
 * variables by name. That is precisely the remediation detail an operator
 * needs and precisely the deployment topology the public probe refuses to
 * disclose. Values are never included — every status is derived from the SHAPE
 * or PRESENCE of configuration — but the key names alone map the stack, so the
 * gate stays.
 *
 * `degraded` is computed by the producer, never by the reader: `/status` once
 * kept its own local idea of what "operational" meant and alarmed permanently
 * on its own explanatory text.
 */
export async function GET() {
  const viewer = await getSessionUser()
  if (!viewer || !(await isAdmin(viewer.id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } })
  }

  const { services, degraded } = await buildHealthReport()

  return NextResponse.json({
    // The endpoint answered, so the app is alive; `degraded` is the signal that
    // actually matters and it must not be buried inside `diagnostics`.
    status: degraded.length === 0 ? 'ok' : 'degraded',
    degraded,
    diagnostics: {
      authProvider: isBetterAuthEnabled() ? 'better-auth' : 'supabase-auth',
      supabaseConfigured: isSupabaseConfigured(),
      services,
    },
  }, { headers: { 'Cache-Control': 'no-store' } })
}
