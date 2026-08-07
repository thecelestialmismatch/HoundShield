'use client'

import Link from 'next/link'
import type { OverviewTelemetry } from '@/lib/dashboard/overview-telemetry'
import { NoTelemetry } from './panelPrimitives'

/**
 * 7 days x 24 hours of the operator's own gateway traffic.
 *
 * The one shape the other charts cannot answer: `ActivityByHour` covers 24h with
 * no day context, `daily` covers 7 days with no time of day. "Our people paste
 * CUI at 4pm on Fridays" is only visible here.
 *
 * Every cell is a link into the audit log filtered to that exact day and hour,
 * so the number on screen and the rows behind it are one click apart — founder
 * direction 2026-08-07.
 *
 * Colour encodes blocked share, not volume: a busy-but-clean hour is not the
 * thing an assessor cares about. Intensity is volume, hue is risk.
 */
export function ActivityHeatmap({ tel }: { tel: OverviewTelemetry }) {
  const heat = tel.heat ?? []
  const blocked = tel.heatBlocked ?? []
  const max = Math.max(1, ...heat.flat())
  const days = tel.daily ?? []

  return (
    <div className="panel">
      <div className="ph">
        <h3>When it happens</h3>
        <span className="mono">7 days x 24 hours (UTC)</span>
      </div>
      <p className="ph-sub">
        Every hour your gateway saw traffic. Deeper means busier; orange means a
        share of that hour was stopped. Click any cell to open those exact events.
      </p>

      {!tel.connected ? (
        <NoTelemetry what="an activity map" />
      ) : (
        <div className="pad">
          <div className="op-hm">
            <div className="op-hm-corner" />
            {/* Hour ruler — every 3rd hour labelled, so 24 columns stay legible. */}
            {Array.from({ length: 24 }, (_, h) => (
              <div key={`h${h}`} className="op-hm-hr">{h % 3 === 0 ? h : ''}</div>
            ))}

            {heat.map((row, d) => (
              <Row
                key={days[d]?.date ?? d}
                label={days[d]?.label ?? ''}
                date={days[d]?.date ?? ''}
                row={row}
                blockedRow={blocked[d] ?? []}
                max={max}
              />
            ))}
          </div>

          <div className="op-hm-key">
            <span>Quieter</span>
            <i style={{ background: 'var(--hm-1)' }} />
            <i style={{ background: 'var(--hm-2)' }} />
            <i style={{ background: 'var(--hm-3)' }} />
            <i style={{ background: 'var(--hm-4)' }} />
            <span>Busier</span>
            <i className="op-hm-bad" />
            <span>Contains blocks</span>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({
  label, date, row, blockedRow, max,
}: {
  label: string; date: string; row: number[]; blockedRow: number[]; max: number
}) {
  return (
    <>
      <div className="op-hm-day">{label}</div>
      {row.map((n, h) => {
        const b = blockedRow[h] ?? 0
        // 0 stays empty rather than becoming the lightest shade — an hour with
        // no traffic and an hour with one event must not look the same.
        const step = n === 0 ? 0 : Math.min(4, Math.ceil((n / max) * 4))
        const title = `${label} ${String(h).padStart(2, '0')}:00 — ${n} ${n === 1 ? 'prompt' : 'prompts'}${b ? `, ${b} blocked` : ''}`
        return (
          <Link
            key={h}
            href={`/command-center/events?date=${date}&hour=${h}`}
            className={`op-hm-c s${step}${b ? ' is-bad' : ''}`}
            title={title}
            aria-label={title}
          />
        )
      })}
    </>
  )
}
