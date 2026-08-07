'use client'

import Link from 'next/link'
import type { OverviewTelemetry } from '@/lib/dashboard/overview-telemetry'
import { STEEL, ORANGE, GREEN, VIOLET, RISK_COLOR, fmt, NoTelemetry } from './panelPrimitives'

/**
 * Two donuts: what happened to every prompt, and how severe the blocks were.
 *
 * Hand-rolled SVG like every other chart here — Recharts crashes on SSR and
 * these render inside the server-rendered shell.
 *
 * Every slice and every legend row is a link into the audit log filtered to that
 * slice, so a number and the rows behind it are one click apart.
 */

type Slice = { name: string; count: number; color: string; href: string }

function Donut({ slices, total }: { slices: Slice[]; total: number }) {
  const R = 54
  const C = 2 * Math.PI * R
  // Arc lengths and their running start, derived up front. A `let offset`
  // mutated inside the map is a render-time reassignment — it happens to work
  // today and breaks the moment React re-orders or re-runs the render.
  const arcs = slices.reduce<{ s: Slice; dash: number; start: number }[]>((acc, s) => {
    const dash = total > 0 ? (s.count / total) * C : 0
    const start = acc.length ? acc[acc.length - 1].start + acc[acc.length - 1].dash : 0
    return [...acc, { s, dash, start }]
  }, [])

  return (
    <svg width="130" height="130" viewBox="0 0 130 130" role="img" aria-hidden="true">
      <g transform="rotate(-90 65 65)">
        {arcs.map(({ s, dash, start }) => (
          <circle
            key={s.name}
            cx="65" cy="65" r={R}
            fill="none" stroke={s.color} strokeWidth="16"
            strokeDasharray={`${dash} ${C - dash}`}
            strokeDashoffset={-start}
          />
        ))}
      </g>
      <text x="65" y="62" textAnchor="middle" className="op-dn-total">{fmt(total)}</text>
      <text x="65" y="78" textAnchor="middle" className="op-dn-cap">prompts</text>
    </svg>
  )
}

function Legend({ slices, total }: { slices: Slice[]; total: number }) {
  return (
    <div className="op-donut-lg">
      {slices.map((s) => (
        <Link key={s.name} href={s.href} className="op-dn-row">
          <i style={{ background: s.color }} aria-hidden />
          <span>{s.name}</span>
          <b>{fmt(s.count)}</b>
          <em>{total > 0 ? `${Math.round((s.count / total) * 100)}%` : '—'}</em>
        </Link>
      ))}
    </div>
  )
}

/** What happened to every prompt the gateway saw. */
export function OutcomeMix({ tel }: { tel: OverviewTelemetry }) {
  const t = tel.totals
  const slices: Slice[] = [
    { name: 'Passed', count: t.passed, color: GREEN, href: '/command-center/events?outcome=passed' },
    { name: 'Held for review', count: t.warning, color: ORANGE, href: '/command-center/quarantine' },
    { name: 'Blocked', count: t.blocked, color: 'var(--bad)', href: '/command-center/events?outcome=blocked' },
  ].filter((s) => s.count > 0)

  return (
    <div className="panel">
      <div className="ph">
        <h3>Outcome mix</h3>
        <span className="mono">every prompt, last {tel.windowDays}d</span>
      </div>
      <p className="ph-sub">
        What your gateway did with each prompt. Click any slice to open those events.
      </p>
      {!tel.connected ? (
        <NoTelemetry what="an outcome breakdown" />
      ) : (
        <div className="pad">
          <div className="op-donut">
            <Donut slices={slices} total={t.events} />
            <Legend slices={slices} total={t.events} />
          </div>
        </div>
      )}
    </div>
  )
}

/** Severity of the BLOCKED events only — how bad were the things we stopped. */
export function BlockedSeverity({ tel }: { tel: OverviewTelemetry }) {
  const palette = [VIOLET, STEEL, ORANGE, GREEN]
  const slices: Slice[] = tel.riskMix.map((r, i) => ({
    name: r.name,
    count: r.count,
    color: RISK_COLOR[r.name] ?? palette[i % palette.length],
    href: `/command-center/events?outcome=blocked&risk=${encodeURIComponent(r.name)}`,
  }))
  const total = slices.reduce((n, s) => n + s.count, 0)

  return (
    <div className="panel">
      <div className="ph">
        <h3>Blocked by severity</h3>
        <span className="mono">stopped before egress</span>
      </div>
      <p className="ph-sub">
        How serious the blocked prompts were. An empty ring is the good outcome — nothing was stopped
        because nothing needed to be.
      </p>
      {!tel.connected ? (
        <NoTelemetry what="a severity breakdown" />
      ) : total === 0 ? (
        <div className="pad op-empty-quiet">
          Nothing was blocked in this window. Every prompt your gateway inspected passed policy.
        </div>
      ) : (
        <div className="pad">
          <div className="op-donut">
            <Donut slices={slices} total={total} />
            <Legend slices={slices} total={total} />
          </div>
        </div>
      )}
    </div>
  )
}
