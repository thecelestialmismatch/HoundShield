import { permanentRedirect } from 'next/navigation'

/**
 * `/dashboard` → `/command-center`.
 *
 * This redirect has existed in `next.config.js` since the route was renamed —
 * and it has never worked in production. On 2026-07-29,
 * `curl https://www.houndshield.com/dashboard` returned **404**, as did
 * `/shieldready`, because the repo-root `vercel.json` still declares the legacy
 * `builds` + `routes` keys. Those replace the routing table Vercel generates
 * from the build, which is where `next.config.js` redirects and the middleware
 * route live. (Rewrites and headers survive — the Next server applies those
 * itself — which is why `/hermes` works and `/dashboard` does not.)
 *
 * Declaring the redirect as a route inside the app makes it immune to that:
 * it is part of the Next build, not the platform routing layer. Keep BOTH this
 * and the `next.config.js` entry — once the platform config is fixed
 * (docs/DASHBOARD-AUTH-GATE.md) the config redirect wins at the edge and never
 * reaches this page, which is strictly faster and equally correct.
 */
// Dynamic for the same reason as /console — a prerendered redirect answers 200
// with a client-side hop instead of a 308.
export const dynamic = 'force-dynamic'

export default function DashboardRedirectPage(): never {
  permanentRedirect('/command-center')
}
