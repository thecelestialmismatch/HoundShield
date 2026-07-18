/**
 * FrameworkPanel — the "CMMC Frameworks" column.
 *
 * Lists each framework the portfolio is assessed against with a rollup bar. The
 * active framework (the one the org is driving toward) gets a steel-tinted card
 * and an "Active" pill, mirroring the reference's highlighted row.
 */
'use client';

import { Shield, FileText, ListChecks, ArrowRight } from 'lucide-react';
import type { Framework } from '@/lib/dashboard/control-map-data';
import { MiniBar } from './MiniBar';
import { STEEL } from './tokens';

/** Small per-framework glyph so the list scans quickly. */
function frameworkIcon(id: string) {
  if (id.startsWith('cmmc')) return Shield;
  if (id.startsWith('nist')) return FileText;
  return ListChecks;
}

export function FrameworkPanel({ frameworks }: { frameworks: Framework[] }) {
  return (
    <section
      id="frameworks"
      className="flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-editorial text-base font-semibold text-white">CMMC Frameworks</h2>
      </div>

      <div className="space-y-2.5">
        {frameworks.map((fw) => {
          const Icon = frameworkIcon(fw.id);
          return (
            <div
              key={fw.id}
              className={`rounded-xl border p-3.5 transition-colors ${
                fw.active
                  ? 'border-brand-400/30 bg-brand-500/[0.08]'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                    fw.active ? 'bg-brand-500/20' : 'bg-white/[0.05]'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${fw.active ? 'text-brand-300' : 'text-slate-400'}`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[13px] font-semibold text-white">
                      {fw.name}
                    </span>
                    {fw.level && (
                      <span className="text-[11px] text-slate-400">{fw.level}</span>
                    )}
                    {fw.active && (
                      <span className="ml-auto flex-shrink-0 rounded-full border border-brand-400/30 bg-brand-400/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-brand-200">
                        Active
                      </span>
                    )}
                  </div>
                </div>
                <span className="flex-shrink-0 font-mono text-[13px] font-bold tabular-nums text-white">
                  {fw.progress}%
                </span>
              </div>
              <div className="mt-2.5">
                <MiniBar
                  value={fw.progress}
                  color={fw.active ? undefined : STEEL}
                  height={fw.active ? 6 : 5}
                />
              </div>
            </div>
          );
        })}
      </div>

      <a
        href="/command-center/shield/coverage"
        className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-brand-300 transition-colors hover:text-brand-200"
      >
        View all frameworks
        <ArrowRight className="h-3.5 w-3.5" />
      </a>
    </section>
  );
}
