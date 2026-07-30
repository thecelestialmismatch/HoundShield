import type { Metadata } from 'next'
import { LiveCommandCenter } from '@/components/dashboard/LiveCommandCenter'
import { getSessionProfile } from '@/lib/auth/profile'
import { buildDashboardViewer, type ViewerProfile } from '@/lib/auth/dashboard-viewer'

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
 * Resolve the signed-in user into the dashboard identity.
 *
 * Best-effort BY DESIGN and NOT a security control: access was already decided
 * by the fail-closed gate in `layout.tsx`, so by the time this runs there IS a
 * session. A missing/failed profile row therefore degrades personalization
 * (generic greeting, free-tier entitlements) rather than the door.
 *
 * Founder accounts (lib/billing/founder-access) resolve to a full-access
 * viewer — top tier, "Founder" plan label — even without a profile row.
 */
async function getViewer() {
  try {
    // Provider-agnostic: resolves the session (Better Auth or Supabase) and
    // the caller's own profile row through lib/auth/profile.
    const session = await getSessionProfile('company, full_name, tier')
    if (!session) return undefined
    return (
      buildDashboardViewer(session.profile as ViewerProfile | null, {
        email: session.user.email,
        name: session.user.name,
      }) ?? undefined
    )
  } catch {
    return undefined
  }
}

/**
 * THE after-login dashboard, at THE canonical dashboard URL.
 *
 * Before 2026-07-29 there were two: `/console` (the personalized Live Command
 * Center) and `/command-center` (a separate 20-page tool app with its own
 * shell) — two sidebars, two mental models, and zero links between them. They
 * are now one surface: this page is the home, the deep tools live under the
 * `(tools)` route group at their unchanged URLs, and `/console` permanently
 * redirects to `/command-center`, which forwards here.
 *
 * Why `/command-center/overview` and not `/command-center` (founder direction
 * 2026-07-29): this URL previously served an 804-line CLIENT mockup — every
 * chart hardcoded (`generateTokenData`, `threatDistribution`, `riskRadarData`,
 * a `REVENUE_DATA` block) and no session lookup anywhere in the file, so it
 * showed every signed-in operator the same invented security metrics and could
 * not greet them by name. That is the "why is it showing something else logged
 * in" symptom, and for a product that sells audit evidence it is the one thing
 * the dashboard must never do. The mockup is gone; this real, session-aware
 * page took its URL.
 *
 * It lives OUTSIDE the `(tools)` route group on purpose. That group's layout
 * renders its own `cc-light` shell — aside + header + main — and
 * `LiveCommandCenter` brings its own `hs-lcc` shell, so nesting them would
 * paint two sidebars and two headers.
 *
 * The Live Command Center is the whole page — the operator lands on live
 * operations first. The guide ("what to do next") and the plan restrictions
 * ("pay to unlock") live behind their own SIDEBAR buttons inside it, per
 * founder direction — never stacked above the dashboard, and never leading
 * with the assessment.
 */
export default async function CommandCenterPage() {
  const viewer = await getViewer()
  return <LiveCommandCenter viewer={viewer} />
}
