'use client'

import Link from 'next/link'
import type { OverviewTelemetry } from '@/lib/dashboard/overview-telemetry'
import { STEEL, ORANGE, fmt, NoTelemetry } from './panelPrimitives'

/**
 * Three more views, all derived from data already aggregated — no new endpoint,
 * no new query:
 *
 *  - BlockRateTrend      — blocked as a PERCENTAGE per day. Volume charts hide
 *                          this: a day with twice the traffic and twice the
 *                          blocks looks worse and is actually identical.
 *  - HourOfDayProfile    — the 7-day `heat` grid summed down its columns, so
 *                          "our risk window is 2-4pm" becomes visible. The
 *                          heatmap shows it per-day; this shows the pattern.
 *  - CumulativeInspected — running total across the week. The number that grows
 *                          is the one an operator screenshots for their board.
 */

/** Blocked % per day. */
export function BlockRateTrend({ tel }: { tel: OverviewTelemetry }) {
  const days = tel.daily ?? []
  const rates = days.map((d) => (d.events ? (d.blocked / d.events) * 100 : 0))
  const max = Math.max(1, ...rates)
  const W = 100, H = 30
  const line = rates
    .map((r, i) => `${(i / Math.max(1, rates.length - 1)) * W},${H - (r / max) * (H - 2) - 1}`)
    .join(' ')
  const avg = days.reduce((n, d) => n + d.events, 0)
    ? (days.reduce((n, d) => n + d.blocked, 0) / days.reduce((n, d) => n + d.events, 0)) * 100
    : 0

  return (
    <div className="panel">
      <div className="ph">
        <h3>Block rate</h3>
        <span className="mono">% of traffic stopped, per day</span>
      </div>
      <p className="ph-sub">
        A rate, not a count. Twice the traffic with twice the blocks is the same posture — only this
        chart says so.
      </p>
      {!tel.connected ? (
        <NoTelemetry what="a block rate" />
      ) : (
        <div className="pad">
          <div className="op-rate-hd">
            <b>{avg.toFixed(1)}%</b>
            <span>average across the window</span>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="op-rate-svg" aria-hidden>
            <polyline points={line} fill="none" stroke={ORANGE} strokeWidth="1"
              vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
          <div className="op-rate-x">
            {days.map((d) => (
              <Link key={d.date} href={`/command-center/events?date=${d.date}&outcome=blocked`} className="op-rate-d">
                <b>{d.events ? `${((d.blocked / d.events) * 100).toFixed(1)}%` : '—'}</b>
                <span>{d.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/** The 7-day heat grid, summed down its columns: volume by hour of day. */
export function HourOfDayProfile({ tel }: { tel: OverviewTelemetry }) {
  const heat = tel.heat ?? []
  const heatB = tel.heatBlocked ?? []
  const byHour = Array.from({ length: 24 }, (_, h) =>
    heat.reduce((n, row) => n + (row[h] ?? 0), 0),
  )
  const blockedByHour = Array.from({ length: 24 }, (_, h) =>
    heatB.reduce((n, row) => n + (row[h] ?? 0), 0),
  )
  const max = Math.max(1, ...byHour)
  const peak = byHour.indexOf(Math.max(...byHour))
  const riskiest = blockedByHour.indexOf(Math.max(...blockedByHour))
  const anyBlocked = blockedByHour.some((n) => n > 0)

  return (
    <div className="panel">
      <div className="ph">
        <h3>Hour-of-day profile</h3>
        <span className="mono">all 7 days combined (UTC)</span>
      </div>
      <p className="ph-sub">
        When your people actually use AI. The heatmap shows each day; this shows the habit across
        all of them.
      </p>
      {!tel.connected ? (
        <NoTelemetry what="an hourly profile" />
      ) : (
        <div className="pad">
          <div className="op-hod">
            {byHour.map((n, h) => (
              <Link
                key={h}
                href={`/command-center/events?hour=${h}`}
                className="op-hod-b"
                title={`${String(h).padStart(2, '0')}:00 — ${fmt(n)} prompts, ${blockedByHour[h]} blocked`}
              >
                <i style={{ height: `${(n / max) * 100}%`, background: blockedByHour[h] ? ORANGE : STEEL }} />
              </Link>
            ))}
          </div>
          <div className="op-hod-x"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div>
          <p className="op-hod-foot">
            Busiest at <b>{String(peak).padStart(2, '0')}:00</b>
            {anyBlocked && <> · most blocks at <b>{String(riskiest).padStart(2, '0')}:00</b></>}
            . Orange marks any hour that contained a block.
          </p>
        </div>
      )}
    </div>
  )
}

/** Running total across the window. */
export function CumulativeInspected({ tel }: { tel: OverviewTelemetry }) {
  const days = tel.daily ?? []
  // Running total via reduce, not a `let` mutated inside map — a render-time
  // reassignment happens to work today and breaks the moment React re-runs the
  // render, which it is free to do at any time.
  const cum = days.reduce<number[]>((acc, d) => [...acc, (acc[acc.length - 1] ?? 0) + d.events], [])
  const total = cum[cum.length - 1] ?? 0
  const max = Math.max(1, total)
  const W = 100, H = 30
  const line = cum
    .map((v, i) => `${(i / Math.max(1, cum.length - 1)) * W},${H - (v / max) * (H - 2) - 1}`)
    .join(' ')

  return (
    <div className="panel">
      <div className="ph">
        <h3>Cumulative inspected</h3>
        <span className="mono">running total, {tel.windowDays}d</span>
      </div>
      <p className="ph-sub">
        Every prompt that passed through your own gateway this window. None of it was sent anywhere
        to be scanned.
      </p>
      {!tel.connected ? (
        <NoTelemetry what="a running total" />
      ) : (
        <div className="pad">
          <div className="op-rate-hd">
            <b>{fmt(total)}</b>
            <span>inspected locally, 0 sent out for scanning</span>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="op-rate-svg" aria-hidden>
            <polygon points={`0,${H} ${line} ${W},${H}`} fill={STEEL} opacity="0.16" />
            <polyline points={line} fill="none" stroke={STEEL} strokeWidth="1"
              vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          </svg>
          <Link href="/command-center/events" className="op-gauge-cta">Open the audit log →</Link>
        </div>
      )}
    </div>
  )
}
