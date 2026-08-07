'use client'

/**
 * The six KPI tiles at the top of the operator dashboard.
 *
 * Split out of OperatorPanels.tsx on 2026-08-07 (616 lines, over the repo's
 * 500-line rule). Behaviour unchanged — see panelPrimitives.tsx for the shared
 * palette and the no-fallback-data rule these tiles follow.
 */

import { Eye, Shield, Gauge, Flag, ClipboardCheck, Zap, Info } from 'lucide-react'
import type { OverviewTelemetry } from '@/lib/dashboard/overview-telemetry'
import type { SprsPosture } from '@/lib/dashboard/sprs-posture'
import { SPRS_TARGET } from '@/lib/dashboard/sprs-posture'
import { fmt } from './panelPrimitives'

/** Six KPI tiles. Gateway figures come from the customer's events; SPRS figures
 *  are computed on-device from their own assessment. */
export function OperatorKpis({ tel, posture, onSource }: {
  tel: OverviewTelemetry
  posture: SprsPosture
  onSource: (id: 'scans-24h' | 'blocked-today' | 'sprs-score' | 'quarantine' | 'product-stats') => void
}) {
  const dash = '—'
  return (
    <div className="kpis k6">
      <button type="button" className="kpi a-ok" aria-haspopup="dialog" onClick={() => onSource('scans-24h')}>
        <Info className="kpi-info" aria-hidden />
        <div className="l"><Eye aria-hidden /> Total events</div>
        <div className="n">{tel.connected ? fmt(tel.totals.events) : dash}</div>
        <div className="d">last {tel.windowDays}d · your gateway</div>
      </button>

      <button type="button" className="kpi a-bad" aria-haspopup="dialog" onClick={() => onSource('blocked-today')}>
        <Info className="kpi-info" aria-hidden />
        <div className="l"><Shield aria-hidden /> Blocked</div>
        <div className="n" style={{ color: 'var(--bad)' }}>{tel.connected ? fmt(tel.totals.blocked) : dash}</div>
        <div className="d">{tel.connected ? `${tel.totals.blockRatePct}% of traffic` : 'no traffic yet'}</div>
      </button>

      {/* Replaces the mockup's token-count tile: the gateway records scan
          latency, never token counts, so that tile could only ever have been
          invented. Latency is the real number — and it is the product claim. */}
      <button type="button" className="kpi a-orange" aria-haspopup="dialog" onClick={() => onSource('product-stats')}>
        <Info className="kpi-info" aria-hidden />
        <div className="l"><Zap aria-hidden /> Scan latency p50</div>
        <div className="n">{tel.scanP50Ms === null ? dash : `${tel.scanP50Ms}ms`}</div>
        <div className="d">median, measured on your hardware</div>
      </button>

      <button type="button" className="kpi a-brand" aria-haspopup="dialog" onClick={() => onSource('sprs-score')}>
        <Info className="kpi-info" aria-hidden />
        <div className="l"><Gauge aria-hidden /> SPRS score</div>
        <div className="n" style={{ color: 'var(--brand)' }}>{posture.assessed ? posture.score : dash}</div>
        <div className="d">{posture.assessed ? `target ${SPRS_TARGET} for CMMC L2` : 'not assessed yet'}</div>
      </button>

      <button type="button" className="kpi a-brand" aria-haspopup="dialog" onClick={() => onSource('sprs-score')}>
        <Info className="kpi-info" aria-hidden />
        <div className="l"><ClipboardCheck aria-hidden /> Controls met</div>
        <div className="n">{posture.metCount}/{posture.totalControls}</div>
        <div className="d">{posture.completionPercent.toFixed(0)}% assessed</div>
      </button>

      <button type="button" className="kpi a-warn" aria-haspopup="dialog" onClick={() => onSource('quarantine')}>
        <Info className="kpi-info" aria-hidden />
        {/* Says what it MEASURES. This counts QUARANTINED events inside the
            window (outcomeOf maps QUARANTINED → 'warning'); it does not read
            `quarantine_queue.review_status`, so an item a reviewer already
            cleared is still in this number. It was captioned "awaiting human
            review", which claimed a live queue depth it has never computed —
            harmless while `quarantine_queue` was empty in production, and
            wrong the moment the gateway starts filling it. `/command-center/
            quarantine` is the surface that reads the real pending set.
            ponytail: wire this tile to a pending-count query if an operator
            ever needs queue depth without leaving the dashboard. */}
        <div className="l"><Flag aria-hidden /> Held for review</div>
        <div className="n" style={{ color: 'var(--warn)' }}>{tel.connected ? fmt(tel.totals.warning) : dash}</div>
        <div className="d">quarantined · last {tel.windowDays}d</div>
      </button>
    </div>
  )
}
