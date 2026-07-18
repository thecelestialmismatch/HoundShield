/**
 * ProgressRing — the "Overall Progress" donut.
 *
 * Pure inline SVG (no Recharts) so it renders identically on the server and
 * client — no `dynamic(ssr:false)` needed, no hydration flicker. The arc is a
 * stroked circle with `stroke-dasharray`, animated via CSS transition on the
 * dash offset.
 */
'use client';

import { STEEL, STEEL_DEEP } from './tokens';

interface ProgressRingProps {
  /** 0–100. */
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
}

export function ProgressRing({
  value,
  size = 132,
  stroke = 12,
  label,
  sublabel,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const gradId = 'ring-grad';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`${clamped}% complete`}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={STEEL} />
            <stop offset="100%" stopColor={STEEL_DEEP} />
          </linearGradient>
        </defs>
        {/* track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
        />
        {/* value arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-2xl font-bold tabular-nums text-white leading-none">
          {clamped}%
        </span>
        {label && (
          <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-slate-400 leading-tight text-center px-2">
            {label}
          </span>
        )}
        {sublabel && (
          <span className="text-[10px] text-slate-500 leading-tight">{sublabel}</span>
        )}
      </div>
    </div>
  );
}
