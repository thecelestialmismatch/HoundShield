'use client'

import { CustomerStatusPanel } from '@/components/dashboard/CustomerStatusPanel'

/**
 * Your Guide — where this account actually stands, and the next thing to do.
 *
 * Like Plan & Unlocks, this pane lived only as a tab inside
 * `LiveCommandCenter`'s shell. That shell stopped being rendered when the
 * dashboard moved into the `(tools)` sidebar on 2026-07-31, so it became a route
 * rather than quietly disappearing. Founder direction was explicit — "I still
 * want all of these features" — and a refactor that drops a pane is a feature
 * loss whether or not it was intended.
 *
 * Client component because `CustomerStatusPanel` fetches the caller's own status
 * on mount. Access is already decided by the fail-closed gate in
 * `app/command-center/layout.tsx`, the parent of this route group.
 */
export default function GuidePage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <h1 className="mb-1 text-2xl font-semibold text-[var(--hs-ink)]">Your Guide</h1>
      <p className="mb-6 text-sm text-[var(--hs-ink-secondary)]">
        Where your account stands right now, and the next step toward a
        C3PAO-ready report.
      </p>
      <CustomerStatusPanel />
    </div>
  )
}
