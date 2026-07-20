/**
 * SavingsTrend — the cumulative "value protected" line chart.
 *
 * The reference's profit-margin trend line, rebuilt as HoundShield's compounding
 * savings curve. Pure inline SVG (no Recharts) so it renders identically on the
 * server and client — no `dynamic(ssr:false)`, no hydration flicker, and no
 * runtime Date() (labels are period-relative, not wall-clock, so SSR is stable).
 * The series comes straight from snapshot.trend (a tested pure aggregation).
 */
'use client';

import { formatCompact, formatUsd } from '@/lib/dashboard/roi-model';
import { POSITIVE, POSITIVE_DEEP } from './tokens';

interface SavingsTrendProps {
  trend: number[];
  periodLabel: string;
}

const W = 720;
const H = 260;
const PAD = { top: 20, right: 20, bottom: 34, left: 56 };

export function SavingsTrend({ trend, periodLabel }: SavingsTrendProps) {
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const n = trend.length;
  const total = n > 0 ? trend[n - 1] : 0;
  const yMax = Math.max(1, total * 1.08);

  const x = (i: number) => PAD.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (v: number) => PAD.top + plotH - (v / yMax) * plotH;

  const pts = trend.map((v, i) => ({ x: x(i), y: y(v), v }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath =
    pts.length > 0
      ? `${linePath} L${pts[pts.length - 1].x.toFixed(1)},${(PAD.top + plotH).toFixed(1)} L${pts[0].x.toFixed(1)},${(PAD.top + plotH).toFixed(1)} Z`
      : '';

  // 3 horizontal gridlines + y labels.
  const gridLevels = [0.25, 0.5, 0.75, 1].map((f) => ({ f, val: yMax * f, yy: y(yMax * f) }));
  const last = pts[pts.length - 1];

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-editorial text-lg font-semibold text-white">Value protected over time</h2>
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
          Cumulative
        </span>
      </div>
      <p className="mb-3 text-[12px] text-slate-400">{periodLabel} · compounding remediation avoided</p>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: 'auto' }}
        role="img"
        aria-label={`Cumulative value protected reaching ${formatUsd(total)} over ${periodLabel}`}
      >
        <defs>
          <linearGradient id="roi-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={POSITIVE} stopOpacity="0.28" />
            <stop offset="100%" stopColor={POSITIVE} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="roi-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={POSITIVE_DEEP} />
            <stop offset="100%" stopColor={POSITIVE} />
          </linearGradient>
        </defs>

        {/* gridlines + y labels */}
        {gridLevels.map((g) => (
          <g key={g.f}>
            <line
              x1={PAD.left}
              y1={g.yy}
              x2={W - PAD.right}
              y2={g.yy}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
            <text
              x={PAD.left - 10}
              y={g.yy + 3}
              textAnchor="end"
              fill="rgba(148,163,184,0.7)"
              fontSize="10"
              fontFamily="var(--f-mono, monospace)"
            >
              {formatCompact(g.val)}
            </text>
          </g>
        ))}

        {/* area + line */}
        {areaPath && <path d={areaPath} fill="url(#roi-area)" />}
        <path
          d={linePath}
          fill="none"
          stroke="url(#roi-line)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* end marker */}
        {last && (
          <>
            <circle cx={last.x} cy={last.y} r="4.5" fill={POSITIVE} stroke="#08090e" strokeWidth="2" />
            <circle cx={last.x} cy={last.y} r="9" fill="none" stroke={POSITIVE} strokeOpacity="0.25" strokeWidth="1.5" />
          </>
        )}

        {/* x axis endpoints */}
        <text x={PAD.left} y={H - 12} fill="rgba(148,163,184,0.7)" fontSize="10" fontFamily="var(--f-mono, monospace)">
          Period start
        </text>
        <text x={W - PAD.right} y={H - 12} textAnchor="end" fill={POSITIVE} fontSize="10" fontWeight="700" fontFamily="var(--f-mono, monospace)">
          Now · {formatCompact(total)}
        </text>
      </svg>
    </div>
  );
}
