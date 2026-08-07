/**
 * GET /api/dashboard/overview
 *
 * The signed-in operator's OWN gateway telemetry, aggregated for the Command
 * Center overview: totals, hourly/daily activity, provider mix, severity mix,
 * detections by engine, and the newest events.
 *
 * SECURITY — the tenant boundary is the `user_id` filter, not RLS.
 * `getComplianceEvents` (and this route) read through the service-role client,
 * which bypasses row-level security by design. Isolation therefore comes from
 * one rule, enforced below: the id is taken from the SESSION via `requireUser()`
 * and never from the query string or body. This is the audit-C5 pattern already
 * used by /api/compliance/events; a client-supplied `user_id` here would be a
 * cross-tenant disclosure of another customer's security posture.
 *
 * HONESTY — there is no demo fallback. The older events endpoint substitutes a
 * canned sample set when Supabase is unconfigured, which is right for a public
 * marketing preview and wrong here: this endpoint answers "what did MY gateway
 * see", so a customer with no traffic gets `connected: false` and empty series.
 * The UI renders "connect your proxy", never a plausible-looking chart.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { requireUser } from '@/lib/auth/api-guard'
import {
  aggregateOverview,
  emptyTelemetry,
  toRecentEvents,
  type TelemetryEventRow,
} from '@/lib/dashboard/overview-telemetry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Windows the UI offers. Anything else clamps to 7 rather than erroring — a
 *  bad query string should not blank an operator's dashboard. */
const ALLOWED_WINDOWS = [1, 7, 30] as const

/**
 * Hard cap on rows pulled into memory for aggregation.
 *
 * ponytail: page-and-aggregate in Node, move to a SQL aggregate (or a
 * materialized rollup) when a customer's 30-day volume routinely exceeds this.
 * At that point the `truncated` flag below starts firing, which is the signal
 * to do it — and it is surfaced in the response rather than silently capping,
 * because an evidence dashboard that quietly drops data is worse than a slow one.
 */
const MAX_ROWS = 5_000

// `metadata` is read for exactly one field — `synthetic` — which is how the
// dashboard knows to label seeded demo data as seeded. See the `synthetic` note
// on OverviewTelemetry. The prompt itself is still never selected.
const SELECT_COLUMNS =
  'id, created_at, destination_provider, risk_level, classifications, action_taken, processing_time_ms, metadata'

export async function GET(req: NextRequest) {
  // Identity from the session. Fails closed with 401 when there is none — and
  // in demo mode (no Supabase) there are no sessions, so the route is simply
  // unreachable anonymously.
  const auth = await requireUser()
  if (!auth.user) return auth.response

  const requested = Number(req.nextUrl.searchParams.get('days'))
  const windowDays = (ALLOWED_WINDOWS as readonly number[]).includes(requested) ? requested : 7

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ...emptyTelemetry(windowDays), recent: [], truncated: false })
  }

  const now = Date.now()
  const since = new Date(now - windowDays * 86_400_000).toISOString()

  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('compliance_events')
      .select(SELECT_COLUMNS)
      // The tenant boundary. Session-derived, never client-supplied.
      .eq('user_id', auth.user.id)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(MAX_ROWS)

    if (error) throw new Error(error.message)

    const rows = (data ?? []) as TelemetryEventRow[]
    return NextResponse.json({
      ...aggregateOverview(rows, { now, windowDays }),
      recent: toRecentEvents(rows),
      truncated: rows.length >= MAX_ROWS,
    })
  } catch (err) {
    console.error('[dashboard/overview] aggregation failed:', err)
    // Fail visibly, not into a fake-looking empty dashboard: `connected: false`
    // means "no traffic yet", which would be a lie if the query merely broke.
    return NextResponse.json({ error: 'Failed to load telemetry' }, { status: 500 })
  }
}
