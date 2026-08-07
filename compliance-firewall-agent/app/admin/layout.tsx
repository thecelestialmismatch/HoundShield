import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/session'
import { getViewerRole } from '@/lib/admin/role'

/**
 * THE authorization boundary for the founder admin panel.
 *
 * Everything under /admin reads ACROSS TENANTS — every customer's orders,
 * signups and gateway volume, with no `user_id` filter. That is the point of
 * the surface and it is also the reason this gate is the most consequential
 * one in the codebase: a hole here is not a leak of one account's data, it is a
 * leak of all of them.
 *
 * The rules, in the order they matter:
 *
 *  1. FAIL CLOSED, TWICE. `getSessionUser()` returns null for "no session" AND
 *     for every error path; `getViewerRole()` returns 'user' for a missing
 *     profile, an unreachable database, or a thrown exception. A transient
 *     Supabase outage therefore denies access rather than granting it. Do not
 *     "improve" either into a permissive fallback.
 *
 *  2. A CUSTOMER GETS A 404, NOT A 403. Signed-in non-admins are redirected to
 *     their own dashboard. `robots: noindex` plus no link from any customer
 *     surface means the panel is not discoverable; announcing "forbidden" to a
 *     customer confirms the URL exists and is worth attacking.
 *
 *  3. THE ROLE COMES FROM THE DATABASE, NEVER THE SESSION. Supabase user
 *     metadata is writable by the user in some flows; `profiles.role` is written
 *     by the service client only. See lib/admin/role.ts.
 *
 * `dynamic = 'force-dynamic'` is load-bearing for the same reason it is on
 * /command-center: a client-component subtree gets prerendered to static HTML
 * and served from the Vercel CDN to anonymous visitors. That exact bug shipped
 * on 2026-07-29 (see docs/DASHBOARD-AUTH-GATE.md). Resolving the session per
 * request makes the subtree uncacheable.
 */

export const metadata: Metadata = {
  title: 'Admin — HoundShield',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  if (!user) redirect('/login?redirect=%2Fadmin')

  const role = await getViewerRole(user.id)
  if (role !== 'admin') redirect('/command-center/overview')

  return <>{children}</>
}
