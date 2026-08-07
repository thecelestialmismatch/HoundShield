import 'server-only'
import { cache } from 'react'
import { createServiceClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { profileKeyColumn } from '@/lib/auth/auth-config'
import { isBetterAuthEnabled } from '@/lib/auth/auth-config'

/**
 * Resolve a caller's role from `profiles.role`.
 *
 * Deliberately NOT from the session. Supabase `user_metadata` is writable by the
 * user through some auth flows, so a role read from the session token is a role
 * the user can grant themselves. `profiles.role` is written by the service
 * client only, which makes it the one trustworthy source — the same reasoning
 * `lib/auth/api-guard.ts` already applies for API routes. This is the Server
 * Component equivalent, so the page gate and the API gate cannot disagree.
 *
 * FAILS TO 'user'. A missing profile, an unconfigured database, a network error
 * or a thrown exception all return the least-privileged role. The admin panel
 * reads across every tenant, so "we could not check" must never mean "let them
 * in".
 *
 * Request-cached for the same reason `getSessionUser` is: the layout gate and
 * anything else that asks during one render share a single round-trip.
 */
async function resolveViewerRole(userId: string): Promise<string> {
  if (!isSupabaseConfigured()) return 'user'

  try {
    const { data } = await createServiceClient()
      .from('profiles')
      .select('role')
      .eq(profileKeyColumn(isBetterAuthEnabled()), userId)
      .maybeSingle()

    const role = (data as { role?: unknown } | null)?.role
    return typeof role === 'string' && role.trim() ? role.trim() : 'user'
  } catch (err) {
    console.error('[admin/role] lookup failed, denying:', err)
    return 'user'
  }
}

export const getViewerRole = cache(resolveViewerRole)

/** True only for the founder role. One place, so the check cannot drift. */
export async function isAdmin(userId: string): Promise<boolean> {
  return (await getViewerRole(userId)) === 'admin'
}
