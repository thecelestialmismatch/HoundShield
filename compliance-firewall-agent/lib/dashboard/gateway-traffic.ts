/**
 * "Has this operator's gateway ever seen a prompt?"
 *
 * One boolean, used by the dashboard's activation checklist to decide whether
 * steps 1 and 2 ("point your traffic at the proxy", "see your first live scan")
 * are genuinely done. It is a real query on purpose: the previous shell passed a
 * constant, so the checklist told every signed-in operator those steps were
 * complete — including the ones who had never sent a single prompt and for whom
 * that checklist is the entire point of the page.
 *
 * SECURITY — same tenant boundary as /api/dashboard/overview: the service-role
 * client bypasses RLS, so isolation is the explicit `user_id` filter, and that
 * id comes from the SESSION. Never accept it from a caller. See that route's
 * header for the full audit-C5 rationale.
 *
 * Fails to `false`, never to `true`. An unreachable database means "we cannot
 * show you as connected", which leaves the operator with an actionable checklist.
 * The opposite default would tick a step nobody completed — a fabricated
 * completion state, on the one surface whose job is honesty about what is left.
 */

import { createServiceClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { getSessionUser } from '@/lib/auth/session'

export async function hasGatewayTraffic(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false

  try {
    const user = await getSessionUser()
    if (!user) return false

    const supabase = createServiceClient()
    // head + exact count: asks the database whether a single row exists without
    // transferring any prompt metadata into this render.
    const { count, error } = await supabase
      .from('compliance_events')
      .select('id', { count: 'exact', head: true })
      // The tenant boundary. Session-derived, never client-supplied.
      .eq('user_id', user.id)
      .limit(1)

    if (error) throw new Error(error.message)
    return (count ?? 0) > 0
  } catch (err) {
    console.error('[dashboard/gateway-traffic] connectivity probe failed:', err)
    return false
  }
}
