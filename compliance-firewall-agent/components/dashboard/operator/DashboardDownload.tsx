'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Download, Loader2, Check, AlertTriangle } from 'lucide-react'

/**
 * "Download" in the dashboard's top-right corner — founder direction 2026-08-07.
 *
 * WHY THIS BUILDS NOTHING NEW: `GET /api/reports/generate?from&to&format=pdf`
 * already exists and already renders the compliance report through
 * `jspdf`/`jspdf-autotable`. A second export path would mean two documents that
 * drift apart, and the PDF an assessor receives is the product. This is a
 * control on the existing endpoint, not a new one.
 *
 * Every failure the route can return is surfaced as itself, because a download
 * button that silently does nothing is worse than no button:
 *
 *   401  session gone            → say so, point at sign-in
 *   402  PDF needs a higher tier → say so, link to Plan & Unlocks (JSON still works)
 *   400/500                      → say so, keep the menu open so it can be retried
 *
 * The window matches whatever the operator has selected in the toolbar, so the
 * file always covers the period they are looking at rather than a fixed 30 days.
 *
 * ponytail: native <details> for the menu — no dropdown dependency, keyboard and
 * screen-reader behaviour for free. Upgrade path if this ever needs submenus or
 * async option loading: the repo already has shadcn primitives.
 */

type Fmt = 'pdf' | 'json'
type State = { kind: 'idle' } | { kind: 'busy'; fmt: Fmt } | { kind: 'done' } | { kind: 'err'; msg: string; upgrade?: boolean }

export function DashboardDownload({ windowDays }: { windowDays: number }) {
  const [state, setState] = useState<State>({ kind: 'idle' })

  async function download(fmt: Fmt) {
    setState({ kind: 'busy', fmt })
    const to = new Date()
    const from = new Date(to.getTime() - windowDays * 24 * 60 * 60 * 1000)
    const qs = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() })
    if (fmt === 'pdf') qs.set('format', 'pdf')

    try {
      const res = await fetch(`/api/reports/generate?${qs}`)

      if (!res.ok) {
        // Read the route's own message rather than inventing one.
        const body = await res.json().catch(() => null)
        const msg = body?.error || `Report failed (${res.status})`
        setState({ kind: 'err', msg, upgrade: res.status === 402 })
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const stamp = to.toISOString().slice(0, 10)
      a.download = `houndshield-compliance-${stamp}.${fmt}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setState({ kind: 'done' })
      setTimeout(() => setState({ kind: 'idle' }), 2500)
    } catch {
      setState({ kind: 'err', msg: 'Could not reach the report service.' })
    }
  }

  const busy = state.kind === 'busy'

  return (
    <details className="op-dl" onToggle={() => setState({ kind: 'idle' })}>
      <summary className="btn btn-p btn-sm" aria-label="Download this dashboard">
        {busy ? <Loader2 className="op-dl-spin" aria-hidden /> : state.kind === 'done' ? <Check aria-hidden /> : <Download aria-hidden />}
        <span>{busy ? 'Preparing…' : state.kind === 'done' ? 'Downloaded' : 'Download'}</span>
      </summary>

      <div className="op-dl-menu" role="menu">
        <button type="button" role="menuitem" disabled={busy} onClick={() => download('pdf')}>
          <b>PDF report</b>
          <span>Signed, C3PAO-ready. Mapped to NIST 800-171.</span>
        </button>
        <button type="button" role="menuitem" disabled={busy} onClick={() => download('json')}>
          <b>JSON data</b>
          <span>Every figure on this page, machine-readable.</span>
        </button>

        <p className="op-dl-note">
          Covers the last {windowDays} {windowDays === 1 ? 'day' : 'days'} — the window selected above.
        </p>

        {state.kind === 'err' && (
          <p className="op-dl-err" role="status">
            <AlertTriangle aria-hidden /> {state.msg}
            {state.upgrade && (
              <>
                {' '}
                <Link href="/command-center/plan">See plans</Link> — JSON export still works on your
                current plan.
              </>
            )}
          </p>
        )}
      </div>
    </details>
  )
}
