/**
 * MiniBar — a thin, animated progress bar used by the framework list and the
 * controls table. Colour is passed in (steel by default) so a single component
 * serves both the neutral framework rows and the status-tinted control rows.
 */
'use client';

import { STEEL, STEEL_DEEP } from './tokens';

interface MiniBarProps {
  /** 0–100. */
  value: number;
  /** Optional explicit fill; defaults to the steel gradient. */
  color?: string;
  className?: string;
  height?: number;
}

export function MiniBar({ value, color, className = '', height = 6 }: MiniBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-white/[0.06] ${className}`}
      style={{ height }}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${clamped}%`,
          background: color ?? `linear-gradient(90deg, ${STEEL_DEEP}, ${STEEL})`,
          transition: 'width 900ms cubic-bezier(0.16,1,0.3,1)',
        }}
      />
    </div>
  );
}
