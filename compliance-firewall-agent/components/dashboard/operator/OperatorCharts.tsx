'use client'

/**
 * Every chart on the operator dashboard: activity, providers, risk radar, SPRS
 * trend, the NIST family matrix and detections by engine.
 *
 * Split out of OperatorPanels.tsx on 2026-08-07 (616 lines, over the repo's
 * 500-line rule). Behaviour unchanged — hand-rolled SVG throughout, because
 * Recharts crashes on SSR and these render inside the server-rendered shell.
 */

import { ClipboardCheck, ArrowRight, BarChart3 } from 'lucide-react'
import type { OverviewTelemetry } from '@/lib/dashboard/overview-telemetry'
import type { SprsPosture } from '@/lib/dashboard/sprs-posture'
import { SPRS_TARGET } from '@/lib/dashboard/sprs-posture'
import type { SprsHistoryPoint } from './useOperatorTelemetry'
import { STEEL, ORANGE, GREEN, VIOLET, fmt, NoTelemetry } from './panelPrimitives'

/** 24 stacked bars: the operator's own events per hour, blocked share on top. */
export function ActivityByHour({ tel, onSettings }: { tel: OverviewTelemetry; onSettings?: () => void }) {
  const W = 480
  const H = 130
  const max = Math.max(1, ...tel.hourly.map((h) => h.events))
  const bw = W / 24
  return (
    <div className="panel">
      <div className="ph">
        <h3>24h activity</h3>
        <span className="mono">events per hour</span>
      </div>
      <p className="ph-sub">
        Every prompt your gateway inspected, hour by hour. The orange tip is what
        it stopped before it left the network.
      </p>
      <div className="pad" style={{ paddingTop: 6 }}>
        {!tel.connected ? (
          <NoTelemetry what="gateway activity" onSettings={onSettings} />
        ) : (
          <>
            <svg viewBox={`0 0 ${W} ${H + 14}`} className="ovc-svg" role="img"
              aria-label="Bar chart of prompts scanned per hour over the last 24 hours, with blocked prompts highlighted">
              {tel.hourly.map((slot, i) => {
                const h = (slot.events / max) * H
                const bh = slot.blocked > 0 ? Math.max((slot.blocked / max) * H, 2.5) : 0
                return (
                  <g key={i}>
                    <title>{`${String(slot.hour).padStart(2, '0')}:00 — ${fmt(slot.events)} scanned · ${fmt(slot.blocked)} blocked`}</title>
                    <rect x={i * bw + 2} y={H - h} width={bw - 4} height={Math.max(h - bh, 0)} rx={2.5} fill={STEEL} opacity={0.82} />
                    {bh > 0 && <rect x={i * bw + 2} y={H - bh} width={bw - 4} height={bh} rx={1.5} fill={ORANGE} />}
                  </g>
                )
              })}
              {[0, 6, 12, 18, 23].map((i) => (
                <text key={i} x={i === 0 ? 2 : i === 23 ? W - 2 : i * bw + bw / 2} y={H + 11}
                  textAnchor={i === 0 ? 'start' : i === 23 ? 'end' : 'middle'} className="ovc-axis">
                  {i === 23 ? 'now' : `${String(tel.hourly[i].hour).padStart(2, '0')}:00`}
                </text>
              ))}
            </svg>
            <div className="ovc-legend">
              <span><i style={{ background: STEEL }} /> Scanned &amp; passed</span>
              <span><i style={{ background: ORANGE }} /> Blocked ({fmt(tel.totals.blocked)})</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/** Stacked horizontal bars per destination provider — passed / warning / blocked. */
export function ProviderBreakdown({ tel, onSettings }: { tel: OverviewTelemetry; onSettings?: () => void }) {
  const max = Math.max(1, ...tel.providers.map((p) => p.total))
  return (
    <div className="panel">
      <div className="ph">
        <h3>Provider breakdown</h3>
        <span className="mono">requests by LLM provider</span>
      </div>
      <p className="ph-sub">
        Which AI providers your prompts were headed to, and how each request was
        resolved. Every one passed through the same local gateway first.
      </p>
      <div className="pad" style={{ paddingTop: 6 }}>
        {tel.providers.length === 0 ? (
          <NoTelemetry what="provider traffic" onSettings={onSettings} />
        ) : (
          <>
            {tel.providers.map((p) => (
              <div className="ovc-hrow" key={p.provider}>
                <span className="ovc-hlab" title={p.provider}>{p.provider}</span>
                <div className="ovc-htrack" title={`${p.provider}: ${fmt(p.passed)} passed · ${fmt(p.warning)} held · ${fmt(p.blocked)} blocked`}>
                  <div className="op-stackbar" style={{ width: `${(p.total / max) * 100}%` }}>
                    {p.passed > 0 && <i style={{ flex: p.passed, background: GREEN }} />}
                    {p.warning > 0 && <i style={{ flex: p.warning, background: '#B08205' }} />}
                    {p.blocked > 0 && <i style={{ flex: p.blocked, background: '#C93A3F' }} />}
                  </div>
                </div>
                <b className="ovc-hval">{fmt(p.total)}</b>
              </div>
            ))}
            <div className="ovc-legend">
              <span><i style={{ background: GREEN }} /> Passed</span>
              <span><i style={{ background: '#B08205' }} /> Held for review</span>
              <span><i style={{ background: '#C93A3F' }} /> Blocked</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Risk-assessment radar over the 14 NIST 800-171 control families.
 *
 * The mockup drew eight axes from a hardcoded array. These fourteen are the
 * families the scoring engine actually reports, and each spoke is the share of
 * that family's SPRS points the operator currently retains — the same maths
 * behind the CMMC Assessment tab and the $499 PDF.
 */
export function RiskRadar({ posture, onAssess }: { posture: SprsPosture; onAssess?: () => void }) {
  const SIZE = 260
  const c = SIZE / 2
  const R = SIZE / 2 - 34
  const axes = posture.axes
  /** Mesh rings. Five at 20% intervals + labels, so a spoke can be READ off the
   *  chart rather than merely compared to its neighbours. */
  const RINGS = [20, 40, 60, 80, 100]
  const point = (i: number, pct: number) => {
    // Start at 12 o'clock and go clockwise, so the first family reads top-centre.
    const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2
    const r = (pct / 100) * R
    return [c + Math.cos(angle) * r, c + Math.sin(angle) * r] as const
  }
  const poly = (pct: (a: (typeof axes)[number]) => number) =>
    axes.map((a, i) => point(i, pct(a)).map((n) => n.toFixed(1)).join(',')).join(' ')

  return (
    <div className="panel">
      <div className="ph">
        <h3>Risk assessment</h3>
        <span className="mono">by control family</span>
      </div>
      <p className="ph-sub">
        How much of each NIST 800-171 family you have in place. The outer ring is
        full compliance; the dip is where an assessor looks first.
      </p>
      <div className="pad" style={{ paddingTop: 6 }}>
        {!posture.assessed ? (
          <div className="op-empty">
            <ClipboardCheck className="op-empty-ic" aria-hidden />
            <div className="op-empty-txt">
              <b>No assessment yet</b>
              <span>
                Answer the 110 controls and this radar fills in from your own
                answers — computed in your browser, never uploaded.
              </span>
            </div>
            {onAssess && (
              <button type="button" className="btn btn-p btn-sm" onClick={onAssess}>
                Open assessment <ArrowRight aria-hidden />
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="op-radar">
            <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="ovc-svg" role="img"
              aria-label={`Radar chart of control-family coverage: ${axes.map((a) => `${a.label} ${a.retainedPct}%`).join(', ')}`}>
              {RINGS.map((ring) => (
                <polygon key={ring} points={poly(() => ring)} fill="none" stroke="var(--line)"
                  strokeWidth={ring === 100 ? 1.25 : 0.75} opacity={ring === 100 ? 1 : 0.7} />
              ))}
              {axes.map((a, i) => {
                const [x, y] = point(i, 100)
                return <line key={a.code} x1={c} y1={c} x2={x} y2={y} stroke="var(--line)" strokeWidth={0.75} />
              })}
              {/* Scale labels up the 12 o'clock spoke — without them the mesh is
                  decorative and a spoke can only be compared, never read. */}
              {RINGS.map((ring) => (
                <text key={`s${ring}`} x={c + 3} y={point(0, ring)[1] + 3} className="ovc-axis" opacity={0.65}>
                  {ring}%
                </text>
              ))}
              <polygon points={poly((a) => a.retainedPct)} fill={GREEN} fillOpacity={0.18} stroke={GREEN} strokeWidth={2} strokeLinejoin="round" />
              {/* A dot per family: on a 14-axis chart the vertices are otherwise
                  hard to locate, especially where two neighbours sit at 0. */}
              {axes.map((a, i) => {
                const [x, y] = point(i, a.retainedPct)
                return <circle key={`d${a.code}`} cx={x} cy={y} r={2.5} fill={GREEN} />
              })}
              {axes.map((a, i) => {
                const [x, y] = point(i, 116)
                return (
                  <text key={a.code} x={x} y={y} className="ovc-axis" textAnchor="middle" dominantBaseline="middle">
                    <title>{`${a.label} — ${a.retainedPct}% in place (${a.met} met, ${a.partial} partial, ${a.unmet} unmet of ${a.total})`}</title>
                    {a.code}
                  </text>
                )
              })}
            </svg>
            </div>
            <div className="ovc-legend">
              <span><i style={{ background: GREEN }} /> In place</span>
              <span className="mono">{posture.metCount} met · {posture.partialCount} partial · {posture.unmetCount} unmet</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * SPRS score over time, from the operator's own consented posture snapshots.
 *
 * Fewer than two points is an empty state, not an excuse to interpolate: this
 * series is genuinely sparse (one snapshot per meaningful change, and only with
 * Brain AI data consent), and a smooth invented curve here is exactly the
 * fabrication that got the previous dashboard deleted.
 */
export function SprsTrend({ points, onAssess }: { points: SprsHistoryPoint[]; onAssess?: () => void }) {
  const W = 480
  // Taller than the 24h chart on purpose: .ovc-svg is width:100%, so rendered
  // height follows the viewBox ratio, and this panel shares a row with the
  // square radar, which sets the row height and cannot shrink. At 130 this
  // panel ended ~145px above its own bottom edge; 218 makes the two columns
  // finish level. Measured, not guessed.
  const H = 218
  const enough = points.length >= 2

  const scores = points.map((p) => p.score)
  const lo = Math.min(SPRS_TARGET, ...scores, 0)
  const hi = Math.max(SPRS_TARGET, ...scores, 110)
  const y = (v: number) => H - ((v - lo) / (hi - lo || 1)) * (H - 16) - 8
  const x = (i: number) => (i / Math.max(points.length - 1, 1)) * W
  const line = points.map((p, i) => `${x(i).toFixed(1)},${y(p.score).toFixed(1)}`).join(' ')
  const last = points[points.length - 1]
  const first = points[0]

  return (
    <div className="panel">
      <div className="ph">
        <h3>SPRS compliance trend</h3>
        <span className="mono">your recorded history</span>
      </div>
      <p className="ph-sub">
        Your DoD supplier risk score as controls get fixed. Points are recorded
        when your posture changes — the dashed line is the score a conditional
        CMMC Level&nbsp;2 typically needs.
      </p>
      <div className="pad" style={{ paddingTop: 6 }}>
        {!enough ? (
          <div className="op-empty">
            <BarChart3 className="op-empty-ic" aria-hidden />
            <div className="op-empty-txt">
              <b>Not enough history yet</b>
              <span>
                {points.length === 1
                  ? 'One posture snapshot recorded. The trend line appears once your score changes again.'
                  : 'Your score is tracked over time once you complete an assessment and enable posture history.'}
              </span>
            </div>
            {onAssess && (
              <button type="button" className="btn btn-p btn-sm" onClick={onAssess}>
                Open assessment <ArrowRight aria-hidden />
              </button>
            )}
          </div>
        ) : (
          <>
            <svg viewBox={`0 0 ${W} ${H}`} className="ovc-svg" role="img"
              aria-label={`Line chart of SPRS score across ${points.length} recorded snapshots, from ${first.score} to ${last.score}; target ${SPRS_TARGET}`}>
              <line x1={0} y1={y(SPRS_TARGET)} x2={W} y2={y(SPRS_TARGET)} stroke={GREEN} strokeWidth={1.5} strokeDasharray="5 4" opacity={0.7} />
              <text x={W - 4} y={y(SPRS_TARGET) - 4} textAnchor="end" className="ovc-axis" fill={GREEN}>target {SPRS_TARGET}</text>
              <polygon points={`0,${H} ${line} ${W},${H}`} fill={STEEL} opacity={0.13} />
              <polyline points={line} fill="none" stroke={STEEL} strokeWidth={2.25} strokeLinejoin="round" strokeLinecap="round" />
              {points.map((p, i) => (
                <circle key={p.at} cx={x(i)} cy={y(p.score)} r={i === points.length - 1 ? 4 : 2.5} fill={STEEL}>
                  <title>{`${new Date(p.at).toLocaleDateString()} — SPRS ${p.score}`}</title>
                </circle>
              ))}
            </svg>
            <div className="ovc-legend">
              <span><i style={{ background: STEEL }} /> SPRS {last.score} ({last.score - first.score >= 0 ? '+' : ''}{last.score - first.score} since {new Date(first.at).toLocaleDateString()})</span>
              <span><i className="ovc-dash" /> CMMC L2 target</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * The matrix behind the radar: every NIST 800-171 family with its exact
 * coverage and met / partial / unmet counts.
 *
 * The radar answers "where am I weak?" at a glance; this answers "by how much,
 * and on how many controls?" — which is the form an operator can act on and an
 * assessor will accept. Same `posture` object, so the shape and the numbers can
 * never disagree.
 *
 * Full width rather than tucked under the chart: at 14 rows inside the radar's
 * column it made that panel ~1050px tall and stretched the trend chart beside
 * it into 750px of dead space.
 */
/** Halve a list, left column taking the extra row on an odd count. */
function splitInTwo<T>(items: readonly T[]): T[][] {
  const half = Math.ceil(items.length / 2)
  return [items.slice(0, half), items.slice(half)]
}

export function FamilyMatrix({ posture }: { posture: SprsPosture }) {
  // Nothing to break down before the assessment exists. The radar directly
  // above already shows that empty state and its CTA; a second identical card
  // underneath is noise, not information.
  if (!posture.assessed) return null

  return (
    <div className="panel">
      <div className="ph">
        <h3>Control coverage by family</h3>
        <span className="mono">
          {posture.metCount} met · {posture.partialCount} partial · {posture.unmetCount} unmet
        </span>
      </div>
      <p className="ph-sub">
        All 14 NIST 800-171 families, with how many controls in each are in
        place. The red rows are what an assessor opens first.
      </p>
      <div className="pad" style={{ paddingTop: 6 }}>
        {/* Two explicit column groups, each carrying its own header row.
            CSS `column-count` would have been fewer lines but flows a single
            header atop the left column only, leaving the right-hand seven
            families unlabelled. */}
        <div className="op-matrix" role="table" aria-label="Control coverage by NIST 800-171 family">
          {splitInTwo(posture.axes).map((group, gi) => (
            <div className="op-matrix-col" role="rowgroup" key={gi}>
              <div className="op-matrix-h" role="row">
                <span role="columnheader">Family</span>
                <span role="columnheader">In place</span>
                <span role="columnheader" title="Met">Met</span>
                <span role="columnheader" title="Partial">Part</span>
                <span role="columnheader" title="Unmet">Unmet</span>
              </div>
              {group.map((a) => (
                <div className="op-matrix-r" role="row" key={a.code} title={`${a.label} — ${a.total} controls`}>
                  <span role="cell"><b>{a.code}</b> <em>{a.label}</em></span>
                  <span role="cell" className="op-matrix-bar">
                    <i style={{
                      width: `${a.retainedPct}%`,
                      background: a.retainedPct >= 80 ? GREEN : a.retainedPct >= 40 ? '#B08205' : '#C93A3F',
                    }} />
                    <b>{a.retainedPct}%</b>
                  </span>
                  <span role="cell" className="mono">{a.met}</span>
                  <span role="cell" className="mono">{a.partial}</span>
                  <span role="cell" className="mono">{a.unmet}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


/** Detections by engine — which classifiers fired, from the operator's events. */
export function DetectionsByEngine({ tel, onSettings }: { tel: OverviewTelemetry; onSettings?: () => void }) {
  const max = Math.max(1, ...tel.detections.map((d) => d.count))
  const palette = [STEEL, ORANGE, GREEN, VIOLET, '#B08205', '#C93A3F']
  return (
    <div className="panel">
      <div className="ph">
        <h3>Detections by engine</h3>
        <span className="mono">last {tel.windowDays}d</span>
      </div>
      <p className="ph-sub">
        Which of the 16 detection engines fired on your traffic. A quiet engine
        is still on — it simply found nothing to stop.
      </p>
      <div className="pad" style={{ paddingTop: 6 }}>
        {tel.detections.length === 0 ? (
          <NoTelemetry what="detections" onSettings={onSettings} />
        ) : (
          tel.detections.slice(0, 8).map((d, i) => (
            <div className="ovc-hrow" key={d.name} title={`${d.name}: ${fmt(d.count)}`}>
              <span className="ovc-hlab">{d.name}</span>
              <div className="ovc-htrack">
                <i style={{ width: `${(d.count / max) * 100}%`, background: palette[i % palette.length] }} />
              </div>
              <b className="ovc-hval">{fmt(d.count)}</b>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
