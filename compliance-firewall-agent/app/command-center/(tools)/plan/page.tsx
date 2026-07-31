import type { Metadata } from 'next'
import { PlanUnlocksBoard } from '@/components/dashboard/PlanUnlocksBoard'
import { getSessionProfile } from '@/lib/auth/profile'
import { buildDashboardViewer, type ViewerProfile } from '@/lib/auth/dashboard-viewer'

export const metadata: Metadata = {
  title: 'Plan & Unlocks — HoundShield',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Plan & Unlocks — what this account has, and what the next tier adds.
 *
 * This pane existed only as a tab inside `LiveCommandCenter`'s own shell. When
 * the dashboard moved into the `(tools)` sidebar on 2026-07-31 that shell
 * stopped being rendered, which would have silently stranded the ONLY upgrade
 * surface in the product — a revenue path, deleted by a refactor nobody would
 * have noticed until a customer went looking for how to pay us more.
 *
 * So it became a route, and a sidebar entry, instead. Same component, unchanged.
 *
 * Access is decided upstream by the fail-closed gate in
 * `app/command-center/layout.tsx`. Tier resolution below is display only: a
 * missing profile degrades to the free tier's view, which under-promises rather
 * than showing paid features to someone who has not bought them.
 */
export default async function PlanPage() {
  let tier = 'free'
  let founder = false

  try {
    const session = await getSessionProfile('company, full_name, tier')
    if (session) {
      const viewer = buildDashboardViewer(session.profile as ViewerProfile | null, {
        email: session.user.email,
        name: session.user.name,
      })
      tier = viewer?.tier ?? 'free'
      founder = viewer?.isFounder ?? false
    }
  } catch {
    // Fall through to the free-tier view — never upward.
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <h1 className="mb-1 text-2xl font-semibold text-[var(--hs-ink)]">Plan &amp; Unlocks</h1>
      <p className="mb-6 text-sm text-[var(--hs-ink-secondary)]">
        What your account includes today, and what each tier adds.
      </p>
      <PlanUnlocksBoard tier={tier} founder={founder} />
    </div>
  )
}
