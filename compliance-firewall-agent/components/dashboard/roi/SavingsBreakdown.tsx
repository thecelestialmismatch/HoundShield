/**
 * SavingsBreakdown — per-category "savings goal" bars.
 *
 * The reference's savings-goals list, rebuilt for compliance: each detection
 * category shows dollars protected, incidents prevented, and a bar reading
 * avoided-vs-modeled-annual-exposure. Every figure comes from the resolved
 * CategoryLine[] (a tested pure aggregation). Bars use the steel ramp — a
 * positive value surface stays on-brand, not the reference's neon.
 */
'use client';

import type { CategoryLine } from '@/lib/dashboard/roi-model';
import { formatUsd } from '@/lib/dashboard/roi-model';
import { CATEGORY_HEX } from './tokens';

export function SavingsBreakdown({ categories }: { categories: CategoryLine[] }) {
  // Show the biggest dollar-savers first — the headline story reads top-down.
  const rows = [...categories].sort((a, b) => b.costAvoided - a.costAvoided);

  return (
    <div id="savings" className="scroll-mt-20 rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-editorial text-lg font-semibold text-white">Where the value came from</h2>
      </div>
      <p className="mb-4 text-[12px] text-slate-400">
        Remediation avoided by detection category · % of modeled annual exposure neutralized
      </p>

      <div className="flex flex-col gap-4">
        {rows.map((c) => (
          <div key={c.id}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <div className="flex min-w-0 items-baseline gap-2">
                <span className="truncate text-[13px] font-semibold text-slate-100">{c.label}</span>
                <span className="hidden text-[11px] text-slate-500 sm:inline">
                  {c.incidents} prevented
                </span>
              </div>
              <span className="flex-shrink-0 font-mono text-[14px] font-bold tabular-nums text-white">
                {formatUsd(c.costAvoided)}
              </span>
            </div>
            <div
              className="relative h-2 w-full overflow-hidden rounded-full bg-white/[0.06]"
              role="progressbar"
              aria-valuenow={c.coveragePct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${c.label}: ${c.coveragePct}% of modeled annual exposure`}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${c.coveragePct}%`,
                  background: `linear-gradient(90deg, ${CATEGORY_HEX[c.id]}, #AACDDC)`,
                  transition: 'width 900ms cubic-bezier(0.16,1,0.3,1)',
                }}
              />
            </div>
            <div className="mt-1 text-right text-[10px] font-mono text-slate-500">
              {c.coveragePct}% of annual exposure
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
