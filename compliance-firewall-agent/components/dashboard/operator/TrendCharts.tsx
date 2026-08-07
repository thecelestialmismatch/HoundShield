'use client'

import Link from 'next/link'
import type { OverviewTelemetry } from '@/lib/dashboard/overview-telemetry'
import type { SprsPosture } from '@/lib/dashboard/sprs-posture'
import { SPRS_TARGET } from '@/lib/dashboard/sprs-posture'
import { STEEL, GREEN, fmt, NoTelemetry } from './panelPrimitives'

/**
 * Three charts the dashboard was missing, all from data it already had:
 *
 *  - DailyTrend     — 7 days of volume with the blocked share. `daily` was
 *                     aggregated and then never drawn; `ActivityByHour` only
 *                     ever covered 24h, so week-over-week was invisible.
 *  - LatencyProfile — p50/p90/p99. The KPI showed the median alone, which is the
 *                     number that always looks good; the tail is what an
 *                     operator actually feels and what a <10ms claim lives or
 *                     dies on.
 *  - SprsGauge      — score against the conditional-Level-2 target, as a dial.
 *
 * Hand-rolled SVG like every other chart here (Recharts crashes on SSR), and
 * every one links through to where its data comes from.
 */

/** 7-day volume, blocked stacked on top. */
export function DailyTrend({ tel }: { tel: OverviewTelemetry }) {
  const days = tel.daily ?? []
  const max = Math.max(1, ...days.map((d) => d.events))
  const W = 100, H = 34

  // Area path across the 7 points, plus a baseline close.
  const pt = (i: number, v: number) => [
    (i / Math.max(1, days.length - 1)) * W,
    H - (v / max) * (H - 2) - 1,
  ]
  const line = days.map((d, i) => pt(i, d.events).join(',')).join(' ')
  const area = days.length ? `0,${H} ${line} ${W},${H}` : ''

  return (
    <div className="panel">
      <div className="ph">
        <h3>7-day trend</h3>
        <span className="mono">volume &amp; blocks per day</span>
      </div>
      <p className="ph-sub">
        Week over week. The bar under each day is what was stopped — a rising line with a flat bar
        is growth; a rising bar is a policy problem.
      </p>
      {!tel.connected ? (
        <NoTelemetry what="a weekly trend" />
      ) : (
        <div className="pad">
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="op-tr-svg" aria-hidden>
            <polygon points={area} fill={STEEL} opacity="0.14" />
            <polyline points={line} fill="none" stroke={STEEL} strokeWidth="0.8"
              vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          </svg>

          <div className="op-tr-days">
            {days.map((d) => (
              <Link key={d.date} href={`/command-center/events?date=${d.date}`} className="op-tr-day">
                <b>{fmt(d.events)}</b>
                <i style={{ height: `${d.events ? Math.max(2, (d.blocked / Math.max(1, d.events)) * 26) : 0}px` }} />
                <span>{d.label}</span>
                <em>{d.blocked ? `${d.blocked} blocked` : 'clean'}</em>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/** p50 / p90 / p99 scan latency. */
export function LatencyProfile({ tel }: { tel: OverviewTelemetry }) {
  const marks = [
    { k: 'p50', v: tel.scanP50Ms, note: 'typical request' },
    { k: 'p90', v: tel.scanP90Ms, note: '9 in 10 faster than this' },
    { k: 'p99', v: tel.scanP99Ms, note: 'worst 1% — the tail users feel' },
  ]
  const max = Math.max(1, ...marks.map((m) => m.v ?? 0))
  const timed = marks.some((m) => m.v != null)

  return (
    <div className="panel">
      <div className="ph">
        <h3>Scan latency profile</h3>
        <span className="mono">measured on your hardware</span>
      </div>
      <p className="ph-sub">
        Every percentile is a reading your own gateway recorded — nothing is interpolated, so each
        number is a request that actually happened.
      </p>
      {!timed ? (
        <NoTelemetry what="latency readings" />
      ) : (
        <div className="pad">
          {marks.map((m) => (
            <div className="op-lat" key={m.k}>
              <span className="op-lat-k">{m.k}</span>
              <div className="op-lat-track">
                <i
                  style={{
                    width: `${((m.v ?? 0) / max) * 100}%`,
                    background: (m.v ?? 0) <= 10 ? GREEN : STEEL,
                  }}
                />
              </div>
              <b className="op-lat-v">{m.v == null ? '—' : `${m.v}ms`}</b>
              <span className="op-lat-n">{m.note}</span>
            </div>
          ))}
          <p className="op-lat-foot">
            Green is at or under the 10ms the product promises. All of it happens before the prompt
            leaves your network.
          </p>
        </div>
      )}
    </div>
  )
}

/** SPRS score as a dial, against the conditional-Level-2 target. */
export function SprsGauge({ posture }: { posture: SprsPosture }) {
  // SPRS runs −203…110. Normalise onto 0…1 for the arc.
  const MIN = -203, MAX = 110
  const norm = (v: number) => Math.min(1, Math.max(0, (v - MIN) / (MAX - MIN)))
  const R = 52, CIRC = Math.PI * R // half circle
  const frac = posture.assessed ? norm(posture.score) : 0
  const targetFrac = norm(SPRS_TARGET)
  const hit = posture.assessed && posture.score >= SPRS_TARGET

  return (
    <div className="panel">
      <div className="ph">
        <h3>SPRS score</h3>
        <span className="mono">target {SPRS_TARGET} for conditional L2</span>
      </div>
      <p className="ph-sub">
        Your DoD supplier risk score, computed in your browser from your own answers. It is never
        uploaded.
      </p>
      {!posture.assessed ? (
        <NoTelemetry what="a score" />
      ) : (
        <div className="pad op-gauge">
          <svg width="150" height="92" viewBox="0 0 130 78" aria-hidden>
            <g transform="translate(65,66)">
              <path d={`M -${R} 0 A ${R} ${R} 0 0 1 ${R} 0`} fill="none"
                stroke="var(--line)" strokeWidth="12" strokeLinecap="round" />
              <path d={`M -${R} 0 A ${R} ${R} 0 0 1 ${R} 0`} fill="none"
                stroke={hit ? GREEN : STEEL} strokeWidth="12" strokeLinecap="round"
                strokeDasharray={`${frac * CIRC} ${CIRC}`} />
              {/* Target notch */}
              <line
                x1={-R * Math.cos(targetFrac * Math.PI)} y1={-R * Math.sin(targetFrac * Math.PI)}
                x2={-(R + 9) * Math.cos(targetFrac * Math.PI)} y2={-(R + 9) * Math.sin(targetFrac * Math.PI)}
                stroke="var(--ink)" strokeWidth="2" strokeLinecap="round"
              />
            </g>
            <text x="65" y="58" textAnchor="middle" className="op-gauge-v">{posture.score}</text>
          </svg>

          <div className="op-gauge-side">
            <div><b>{posture.metCount}</b><span>controls met of {posture.totalControls}</span></div>
            <div><b>{posture.unmetCount + posture.partialCount}</b><span>still open</span></div>
            <Link href="/command-center/shield/gaps" className="op-gauge-cta">Close the gaps →</Link>
          </div>
        </div>
      )}
    </div>
  )
}
