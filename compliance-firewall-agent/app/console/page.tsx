import { permanentRedirect } from 'next/navigation'

/**
 * `/console` → `/command-center`.
 *
 * The 2026-07-29 merge collapsed the two after-login dashboards into one
 * canonical URL. `/command-center` won because the footer "Dashboard" link,
 * `next.config.js`'s `/dashboard` and `/shieldready` redirects, and all 20 deep
 * tool routes already pointed there.
 *
 * This is a page-level redirect rather than a `next.config.js` entry on
 * purpose: the production deployment's repo-root `vercel.json` still uses the
 * legacy `builds` + `routes` keys, which is exactly what silently dropped the
 * middleware route (see docs/DASHBOARD-AUTH-GATE.md). A redirect that lives
 * inside the Next app itself cannot be dropped by the deployment's routing
 * layer, so every link, bookmark, and already-sent signup email keeps working
 * no matter how the platform config lands.
 *
 * `permanentRedirect` emits 308 (method-preserving), so it is safe on the POST
 * paths that used to land here after signup.
 */
// MUST be dynamic. Prerendered, this page answered 200 with a client-side hop
// instead of a 308 (verified against the production build on 2026-07-29) — a
// redirect that only fires once JS runs is not a redirect for crawlers, curl,
// or a POST. force-dynamic makes the server issue the real status code.
export const dynamic = 'force-dynamic'

export default function ConsoleRedirectPage(): never {
  permanentRedirect('/command-center')
}
