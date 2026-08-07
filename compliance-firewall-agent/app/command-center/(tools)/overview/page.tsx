import type { Metadata } from 'next'
import { OperatorDashboard } from '@/components/dashboard/OperatorDashboard'
import { getSessionUser } from '@/lib/auth/session'
import { hasGatewayTraffic } from '@/lib/dashboard/gateway-traffic'

export const metadata: Metadata = {
  title: 'Command Center — HoundShield',
  description:
    'HoundShield Command Center — real-time AI prompt interception, SPRS posture, CMMC assessment, and on-device Brain AI.',
  robots: { index: false, follow: false },
}

// Personalized per signed-in user (reads the session cookie), so it must render
// per request — never prerendered static at build time.
export const dynamic = 'force-dynamic'

/**
 * THE after-login dashboard, at THE canonical dashboard URL.
 *
 * The URL is unchanged. This file moved from `app/command-center/overview/` into
 * the `(tools)` route group on 2026-07-31, and a route group is parentheses-only
 * — it never appears in the path. So `/command-center/overview` still resolves
 * here, and the seven post-login landings, the `/login?redirect=` target and
 * every existing bookmark keep working untouched.
 *
 * What the move buys, and why the founder asked for it: the group's layout is
 * the 23-item Command Center sidebar. Before this, the dashboard was the ONE
 * page that escaped it — `LiveCommandCenter` brings its own rival sidebar — so
 * "Dashboard Home" and "Overview" were links that navigated OUT of the
 * navigation, and the twenty deep tool pages were unreachable from the page a
 * customer actually lands on. Now the dashboard sits in the same shell as
 * everything else.
 *
 * The panels are unchanged: `OperatorDashboard` mounts the same
 * `OperatorOverview` against the same three real sources. Only the shell around
 * it moved.
 *
 * Access was already decided upstream by the fail-closed gate in
 * `app/command-center/layout.tsx`, the parent of this route group. Nothing
 * below is a security control.
 */
export default async function CommandCenterOverviewPage() {
  // Best-effort personalization ONLY. A missing or failed session degrades the
  // greeting, never the door — and never the honesty of the data, which
  // useOperatorTelemetry fetches per session regardless of what happens here.
  //
  // `getSessionUser`, not `getSessionProfile`: the only field read here is
  // `user.name`, which comes off the session itself. The profile variant fired a
  // `select full_name from profiles` whose result was then discarded on the very
  // next line — a whole database round-trip, per dashboard load, for a value it
  // never used. And `getSessionUser` is request-cached, so after the gate in
  // app/command-center/layout.tsx already resolved the session this costs nothing.
  let name: string | null = null
  try {
    const user = await getSessionUser()
    name = user?.name?.split(' ')[0] ?? null
  } catch {
    name = null
  }

  // Real signal for the activation checklist: has this operator's gateway seen
  // anything at all? Ticking "you are connected" for someone who has never sent
  // a prompt would be a fabricated completion state on the one panel whose
  // entire job is telling them what is still undone.
  const connected = await hasGatewayTraffic()

  return <OperatorDashboard name={name} connected={connected} />
}
