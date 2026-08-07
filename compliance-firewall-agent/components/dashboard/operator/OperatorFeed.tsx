'use client'

/**
 * The live event feed and the deep-tool shortcuts.
 *
 * Split out of OperatorPanels.tsx on 2026-08-07 (616 lines, over the repo's
 * 500-line rule). Behaviour unchanged.
 */

import Link from 'next/link'
import {
  Scan, ShieldCheck, BarChart3, Brain, CheckCircle2, XCircle, AlertTriangle, ArrowRight,
} from 'lucide-react'
import type { RecentEvent, EventOutcome } from '@/lib/dashboard/overview-telemetry'
import { NoTelemetry, RISK_COLOR } from './panelPrimitives'

const OUTCOME_ICON: Record<EventOutcome, React.ElementType> = {
  blocked: XCircle, warning: AlertTriangle, passed: CheckCircle2,
}
const OUTCOME_COLOR: Record<EventOutcome, string> = {
  blocked: 'var(--bad)', warning: 'var(--warn)', passed: 'var(--ok)',
}

/** The operator's own newest gateway events, filterable — metadata only. */
export function LiveEvents({ recent, filter, onFilter, onSettings }: {
  recent: RecentEvent[]
  filter: 'all' | EventOutcome
  onFilter: (f: 'all' | EventOutcome) => void
  onSettings?: () => void
}) {
  const shown = filter === 'all' ? recent : recent.filter((e) => e.outcome === filter)
  return (
    <div className="panel">
      <div className="ph">
        <h3>Live events</h3>
        <div className="chips op-filters">
          {(['all', 'blocked', 'warning', 'passed'] as const).map((f) => (
            <button key={f} type="button" aria-pressed={filter === f}
              className={filter === f ? 'is-on' : undefined} onClick={() => onFilter(f)}>
              {f === 'warning' ? 'Held' : f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {recent.length === 0 ? (
        <div className="pad"><NoTelemetry what="events" onSettings={onSettings} /></div>
      ) : shown.length === 0 ? (
        <div className="pad"><p className="ph-sub" style={{ margin: 0 }}>No {filter} events in this window.</p></div>
      ) : (
        <div>
          {shown.map((e) => {
            const Icon = OUTCOME_ICON[e.outcome]
            return (
              <div className="feed-row" key={e.ref}>
                <Icon aria-hidden style={{ width: 16, height: 16, flexShrink: 0, color: OUTCOME_COLOR[e.outcome] }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="op-ev-detail">{e.detected || 'Clean request — no policy match'}</div>
                  <div className="op-ev-meta">
                    <span className="mono">{e.ref}</span>
                    <span>{e.provider}</span>
                    {e.scanMs !== null && <span>{e.scanMs}ms</span>}
                  </div>
                </div>
                <div className="op-ev-right">
                  <b style={{ color: RISK_COLOR[e.risk] ?? 'var(--mut)' }}>{e.risk}</b>
                  <span className="mono">{new Date(e.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div className="pad">
        <Link href="/command-center/events" className="btn btn-g btn-sm">
          View all events <ArrowRight aria-hidden />
        </Link>
      </div>
    </div>
  )
}

/** Four deep-tool shortcuts. Static links to pages that exist — the one panel
 *  here with no data behind it, and none claimed. */
export function QuickActions() {
  const actions = [
    { label: 'Run full scan', icon: Scan, href: '/command-center/scanner' },
    { label: 'CMMC assessment', icon: ShieldCheck, href: '/command-center/shield/assessment' },
    { label: 'Agent workspace', icon: Brain, href: '/command-center/workspace' },
    { label: 'Generate report', icon: BarChart3, href: '/command-center/shield/reports' },
  ]
  return (
    <div className="op-actions">
      {actions.map((a) => (
        <Link key={a.href} href={a.href} className="op-action">
          <span className="op-action-ic"><a.icon aria-hidden /></span>
          <span className="op-action-label">{a.label}</span>
          <ArrowRight className="op-action-go" aria-hidden />
        </Link>
      ))}
    </div>
  )
}
