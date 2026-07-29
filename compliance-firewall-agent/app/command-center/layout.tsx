import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/session'

/**
 * THE authorization boundary for the whole after-login dashboard.
 *
 * Why this exists as a server layout and not only in middleware:
 *
 *  1. Middleware is an optimization, not an authorization boundary. The App
 *     Router contract is to verify the session in the protected subtree, on the
 *     server, close to the data.
 *  2. It was demonstrably not enough here. `/command-center/*` pages are client
 *     components, so Next prerendered them as STATIC HTML and Vercel served
 *     them straight from the CDN — `x-nextjs-prerender: 1`, `x-vercel-cache:
 *     HIT`. On 2026-07-29 `curl https://www.houndshield.com/command-center`
 *     returned 200 with the full dashboard to an anonymous visitor, because the
 *     repo-root `vercel.json` still uses the legacy `builds` + `routes` keys,
 *     which drop the generated middleware route from the deployment. The
 *     middleware compiled (`ƒ Proxy (Middleware)` in the build log) and never
 *     ran: no `X-Robots-Tag`, no `X-RateLimit-*`, `/auth/signup` 404ing instead
 *     of redirecting. See docs/DASHBOARD-AUTH-GATE.md.
 *
 * This layout closes that hole independently of any deployment config: the
 * session is resolved per request, so the subtree can never be prerendered and
 * can never be served from cache to a signed-out visitor.
 *
 * FAIL CLOSED. `getSessionUser()` returns null for "no session" AND for every
 * error path (auth unreachable, Supabase unconfigured, thrown exception), so a
 * transient outage redirects to login rather than exposing the dashboard. Do
 * not soften this into a permissive fallback — `getViewer()` in the page below
 * is the permissive one, and it only decides PERSONALIZATION, never access.
 *
 * The `redirect` target is the dashboard root rather than the exact deep path:
 * a layout is not given the pathname by design. Middleware preserves the deep
 * path when it is alive; this gate guarantees the door is shut when it is not.
 */

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

// Reads the session cookie — must render per request, never prerender.
export const dynamic = 'force-dynamic'

export default async function CommandCenterAuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSessionUser()
  if (!user) redirect('/login?redirect=%2Fcommand-center')
  return <>{children}</>
}
