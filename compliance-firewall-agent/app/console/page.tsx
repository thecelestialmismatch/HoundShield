import type { Metadata } from 'next'
import { LiveCommandCenter } from '@/components/dashboard/LiveCommandCenter'
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
 * THE after-login dashboard. The Live Command Center is the whole page — the
 * operator lands on live operations first. The guide ("what to do next") and
 * the plan restrictions ("pay to unlock") live behind their own SIDEBAR
 * buttons inside the command center, per founder direction — never stacked
 * above the dashboard, and never leading with the assessment.
 */
export default async function ConsolePage() {
  const viewer = await getViewer()
  return <LiveCommandCenter viewer={viewer} />
}
