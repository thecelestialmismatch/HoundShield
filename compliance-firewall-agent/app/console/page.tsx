import type { Metadata } from 'next'
import { LiveCommandCenter } from '@/components/dashboard/LiveCommandCenter'
import { WelcomeBanner } from '@/components/WelcomeBanner'
import { CustomerStatusPanel } from '@/components/dashboard/CustomerStatusPanel'
import { ConsoleDashboard } from '@/components/dashboard/ConsoleDashboard'
import { getSessionProfile } from '@/lib/auth/profile'
import { buildDashboardViewer, type ViewerProfile } from '@/lib/auth/dashboard-viewer'

export const metadata: Metadata = {
  title: 'Live Command Center — HoundShield',
  description: 'HoundShield Live Command Center — real-time AI prompt interception, SPRS posture, CMMC assessment, and on-device Brain AI.',
  robots: { index: false, follow: false },
}

// Personalized per signed-in user (reads the session cookie), so it must render
// per request — not be prerendered static at build time when no session exists.
export const dynamic = 'force-dynamic'

/**
 * Resolve the signed-in user into the dashboard identity. Best-effort: any
 * failure (anonymous visitor, demo mode, missing profile) falls back to the
 * public sample org. Never blocks the page.
 */
async function getViewer() {
  try {
    // Provider-agnostic: resolves the session (Better Auth or Supabase) and
    // the caller's own profile row through lib/auth/profile.
    const session = await getSessionProfile('company, full_name, tier')
    if (!session?.profile) return undefined
    return buildDashboardViewer(session.profile as ViewerProfile) ?? undefined
  } catch {
    return undefined
  }
}

export default async function ConsolePage() {
  const viewer = await getViewer()
  return (
    <>
      {/* Personalized status header — scoped to the light "Steel & Cream" palette
          (cc-light) so it matches the LiveCommandCenter below it: one consistent
          light dashboard, no dark→light seam. */}
      <div className="cc-light bg-[var(--hs-surface-1)] px-4 pt-4 sm:px-6 lg:px-8">
        <WelcomeBanner />
        <CustomerStatusPanel />
        {/* Tier-gated capability grid + inline CMMC self-assessment. Free sees a
            restricted board (assessment unlocked, paid capabilities locked with an
            Upgrade CTA); paid tiers see everything unlocked. */}
        <ConsoleDashboard tier={viewer?.tier} />
      </div>
      <LiveCommandCenter viewer={viewer} />
    </>
  )
}
