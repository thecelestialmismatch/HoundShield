'use client'

/**
 * Overview analytics row — four small, self-explanatory charts that make the
 * command center legible to someone seeing it for the first time (founder
 * direction 2026-07-14: more graphs, more colour, small explanations, and
 * numbers that AGREE with each other).
 *
 * Data consistency is a contract, not a vibe: every chart is derived from the
 * same seeds the KPI tiles show (142,690 prompts / 2,233 blocked), and the
 * unit tests assert the sums match. All values are the dashboard's demo-shell
 * data — static and deterministic, so SSR, hydration and tests never drift.
 *
 * Colour system (dataviz-skill validated on the light panel surface):
 *   categorical — steel #3A6EA5 · orange #C96A28 · green #0E9F6E · violet #7C5CB8
 *   status      — critical #C93A3F · high #C96A28 · medium #B08205 · low #3A6EA5
 * Identity is never colour-alone: every series carries a direct label, and
 * every mark has a native tooltip.
 */

// ─── The one source of truth for the overview's numbers ──────────────────────

/** Matches the "Prompts scanned (24h)" KPI seed in LiveCommandCenter. */
export const SCANS_24H = 142_690
/** Matches the "Blocked today" KPI seed. */
export const BLOCKED_TODAY = 2_233

/** Prompts per hour, oldest → now. Sums exactly to SCANS_24H. */
export const HOURLY_SCANS = [
  3180, 2410, 1930, 1650, 1540, 1720, 2610, 4480, 7890, 9420, 10160, 9930,
  9340, 9910, 10240, 9870, 9210, 8240, 6520, 5310, 4390, 3720, 3350, 5670,
] as const

/** Blocked per hour (subset of HOURLY_SCANS). Sums exactly to BLOCKED_TODAY. */
export const HOURLY_BLOCKED = [
  48, 36, 29, 25, 23, 26, 41, 70, 108, 132, 144, 140,
  131, 140, 145, 139, 129, 117, 102, 83, 69, 58, 53, 245,
] as const

/** Where the prompts went. Counts sum exactly to SCANS_24H. */
export const DESTINATIONS = [
  { name: 'ChatGPT', count: 65_640, color: '#3A6EA5' },
  { name: 'Copilot', count: 44_230, color: '#C96A28' },
  { name: 'Claude', count: 25_680, color: '#0E9F6E' },
  { name: 'Other AI', count: 7_140, color: '#7C5CB8' },
] as const

/** Risk severity of today's blocks. Counts sum exactly to BLOCKED_TODAY. */
export const RISK_MIX = [
  { name: 'Critical', count: 118, color: '#C93A3F', note: 'CUI · ITAR · clearance' },
  { name: 'High', count: 526, color: '#C96A28', note: 'secrets · PHI' },
  { name: 'Medium', count: 1_043, color: '#B08205', note: 'PII · internal IP' },
  { name: 'Low', count: 546, color: '#3A6EA5', note: 'policy flags' },
] as const

/** SPRS score, one point per day for 30 days (oldest → today = 78). */
export const SPRS_TREND = [
  62, 63, 63, 64, 66, 66, 67, 69, 70, 70, 71, 72, 72, 73, 74,
  74, 75, 75, 76, 76, 77, 77, 77, 78, 78, 78, 78, 78, 78, 78,
] as const
export const SPRS_TARGET = 88

const fmt = (n: number) => n.toLocaleString('en-US')
const pct = (n: number, total: number) => `${Math.round((n / total) * 100)}%`

// ─── Panels ───────────────────────────────────────────────────────────────────

/** 24 stacked bars: prompts per hour, with the blocked share in orange. */
function HourlyActivity() {
  const W = 480
  const H = 120
  const max = Math.max(...HOURLY_SCANS)
  const bw = W / HOURLY_SCANS.length
  return (
    <div className="panel">
      <div className="ph">
        <h3>Activity by hour · last 24h</h3>
        <span className="mono">{fmt(SCANS_24H)} prompts</span>
      </div>
      <p className="ph-sub">
        Every prompt your team sent to AI tools, hour by hour. The orange tip of
        each bar is what HoundShield stopped before it left your network.
      </p>
      <div className="pad" style={{ paddingTop: 6 }}>
        <svg viewBox={`0 0 ${W} ${H + 14}`} className="ovc-svg" role="img"
          aria-label="Bar chart of prompts scanned per hour over the last 24 hours, with blocked prompts highlighted">
          {HOURLY_SCANS.map((v, i) => {
            const h = (v / max) * H
            const bh = Math.max((HOURLY_BLOCKED[i] / max) * H, 2.5)
            const x = i * bw + 2
            const w = bw - 4
            return (
              <g key={i}>
                <title>{`${String(i).padStart(2, '0')}:00 — ${fmt(v)} scanned · ${fmt(HOURLY_BLOCKED[i])} blocked`}</title>
                <rect x={x} y={H - h} width={w} height={h - bh - 2 > 0 ? h - bh - 2 : h} rx={2.5} fill="#3A6EA5" opacity={0.82} />
                <rect x={x} y={H - bh} width={w} height={bh} rx={1.5} fill="#C96A28" />
              </g>
            )
          })}
          {[0, 6, 12, 18, 23].map((hr) => (
            <text key={hr} x={hr * bw + bw / 2} y={H + 11} textAnchor="middle" className="ovc-axis">
              {hr === 23 ? 'now' : `${String(hr).padStart(2, '0')}:00`}
            </text>
          ))}
        </svg>
        <div className="ovc-legend">
          <span><i style={{ background: '#3A6EA5' }} /> Scanned &amp; passed</span>
          <span><i style={{ background: '#C96A28' }} /> Blocked ({fmt(BLOCKED_TODAY)})</span>
        </div>
      </div>
    </div>
  )
}

/** Horizontal bars: which AI tools the prompts went to. */
function Destinations() {
  const total = DESTINATIONS.reduce((s, d) => s + d.count, 0)
  const max = Math.max(...DESTINATIONS.map((d) => d.count))
  return (
    <div className="panel">
      <div className="ph">
        <h3>Where prompts go</h3>
        <span className="mono">last 24h</span>
      </div>
      <p className="ph-sub">
        The AI tools your team actually uses. Every one of them passes through
        the same local gateway — nothing is scanned in the cloud.
      </p>
      <div className="pad" style={{ paddingTop: 6 }}>
        {DESTINATIONS.map((d) => (
          <div className="ovc-hrow" key={d.name} title={`${d.name}: ${fmt(d.count)} prompts (${pct(d.count, total)})`}>
            <span className="ovc-hlab">{d.name}</span>
            <div className="ovc-htrack">
              <i style={{ width: `${(d.count / max) * 100}%`, background: d.color }} />
            </div>
            <b className="ovc-hval">{pct(d.count, total)}</b>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Single-series area chart: SPRS climbing toward the target line. */
function SprsTrendChart() {
  const W = 480
  const H = 110
  const MIN = 55
  const MAX = 95
  const y = (v: number) => H - ((v - MIN) / (MAX - MIN)) * (H - 10) - 5
  const x = (i: number) => (i / (SPRS_TREND.length - 1)) * W
  const line = SPRS_TREND.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const first = SPRS_TREND[0]
  const last = SPRS_TREND[SPRS_TREND.length - 1]
  return (
    <div className="panel">
      <div className="ph">
        <h3>SPRS score · 30 days</h3>
        <span className="mono">target {SPRS_TARGET} for CMMC L2</span>
      </div>
      <p className="ph-sub">
        Your DoD supplier risk score, recalculated as controls get fixed. Higher
        is better; the dashed line is the score a conditional CMMC Level&nbsp;2
        typically needs.
      </p>
      <div className="pad" style={{ paddingTop: 6 }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="ovc-svg" role="img"
          aria-label={`Line chart of SPRS score over 30 days, rising from ${first} to ${last}; target ${SPRS_TARGET}`}>
          <line x1={0} y1={y(SPRS_TARGET)} x2={W} y2={y(SPRS_TARGET)} stroke="#0E9F6E" strokeWidth={1.5} strokeDasharray="5 4" opacity={0.7} />
          <text x={W - 4} y={y(SPRS_TARGET) - 4} textAnchor="end" className="ovc-axis" fill="#0E9F6E">target {SPRS_TARGET}</text>
          <polygon points={`0,${H} ${line} ${W},${H}`} fill="#3A6EA5" opacity={0.13} />
          <polyline points={line} fill="none" stroke="#3A6EA5" strokeWidth={2.25} strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={x(SPRS_TREND.length - 1)} cy={y(last)} r={4} fill="#3A6EA5" />
          <text x={4} y={y(first) - 6} className="ovc-axis">{first}</text>
          <text x={x(SPRS_TREND.length - 1) - 8} y={y(last) - 8} textAnchor="end" className="ovc-num">{last}</text>
        </svg>
        <div className="ovc-legend">
          <span><i style={{ background: '#3A6EA5' }} /> Your score (+{last - first} this month)</span>
          <span><i className="ovc-dash" /> CMMC L2 target</span>
        </div>
      </div>
    </div>
  )
}

/** One stacked bar: how serious today's blocked prompts were. */
function RiskMix() {
  const total = RISK_MIX.reduce((s, r) => s + r.count, 0)
  return (
    <div className="panel">
      <div className="ph">
        <h3>Risk mix · today&apos;s blocks</h3>
        <span className="mono">{fmt(total)} blocked</span>
      </div>
      <p className="ph-sub">
        Not every block is equal. Critical means CUI or export-controlled data
        was about to leave — the ones an assessor asks about first.
      </p>
      <div className="pad" style={{ paddingTop: 6 }}>
        <div className="ovc-stack" role="img" aria-label={`Stacked bar of blocked prompts by severity: ${RISK_MIX.map((r) => `${r.name} ${r.count}`).join(', ')}`}>
          {RISK_MIX.map((r) => (
            <i
              key={r.name}
              style={{ width: `${(r.count / total) * 100}%`, background: r.color }}
              title={`${r.name}: ${fmt(r.count)} (${pct(r.count, total)}) — ${r.note}`}
            />
          ))}
        </div>
        <div className="ovc-risk-legend">
          {RISK_MIX.map((r) => (
            <div key={r.name}>
              <span className="ovc-risk-name"><i style={{ background: r.color }} /> {r.name}</span>
              <b>{fmt(r.count)}</b>
              <small>{r.note}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** The four-panel analytics rows rendered on the Overview tab. */
export function OverviewCharts() {
  return (
    <>
      <div className="row r-3-2">
        <HourlyActivity />
        <Destinations />
      </div>
      <div className="row r-3-2">
        <SprsTrendChart />
        <RiskMix />
      </div>
    </>
  )
}
