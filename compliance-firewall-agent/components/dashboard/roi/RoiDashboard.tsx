/**
 * RoiDashboard — the "Compliance ROI" surface (route: /roi).
 *
 * Turns HoundShield's blocked-incident count into the dollar figure a buyer
 * (Rachel/Jordan/Marcus) uses to justify spend, and the number an RPO/MSP
 * partner shows their client — the #1 channel. Faithful to the reference the
 * founder loves (gradient stat tiles · savings bars · a rising trend line ·
 * a mobile bottom tab bar) but rendered in HoundShield dark-steel.
 *
 * The period toggle is live: 90d / 6m / 12m re-resolves the whole snapshot
 * through the pure getRoiSnapshot() helper, so every number always agrees with
 * the tested model. SSR-safe — pure inline SVG, no Recharts, no window at
 * module scope.
 */
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Info } from 'lucide-react';
import { Logo } from '@/components/Logo';
import {
  getRoiSnapshot,
  formatUsd,
  CATEGORIES,
  PRO_MONTHLY,
  type RoiPeriod,
} from '@/lib/dashboard/roi-model';
import { RoiStatCards } from './RoiStatCards';
import { SavingsTrend } from './SavingsTrend';
import { SavingsBreakdown } from './SavingsBreakdown';
import { BottomTabBar } from './BottomTabBar';

const PERIODS: { id: RoiPeriod; label: string }[] = [
  { id: '90d', label: '90D' },
  { id: '6m', label: '6M' },
  { id: '12m', label: '12M' },
];

function PeriodToggle({
  period,
  onSelect,
}: {
  period: RoiPeriod;
  onSelect: (p: RoiPeriod) => void;
}) {
  return (
    <div className="inline-flex gap-1 rounded-2xl border border-white/[0.1] bg-white/[0.03] p-1">
      {PERIODS.map((p) => {
        const on = p.id === period;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            aria-pressed={on}
            className={`rounded-xl px-3 py-1.5 text-[12px] font-bold tracking-wide transition-colors ${
              on ? 'bg-brand-500/[0.16] text-brand-100' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

export function RoiDashboard() {
  const [period, setPeriod] = useState<RoiPeriod>('12m');
  const snapshot = useMemo(() => getRoiSnapshot(period), [period]);

  return (
    <div
      id="top"
      className="relative min-h-screen scroll-smooth bg-[#08090e] pb-24 text-slate-200 font-sans md:pb-0"
    >
      {/* ambient steel glow */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[8%] -top-[12%] h-[46%] w-[38%] rounded-full bg-brand-500/[0.10] blur-[130px]" />
        <div className="absolute -right-[6%] top-[34%] h-[42%] w-[34%] rounded-full bg-emerald-500/[0.06] blur-[130px]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#08090e]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
            <Link href="/" className="flex items-center gap-2.5" aria-label="HoundShield home">
              <Logo variant="dark" size={26} />
              <div className="flex flex-col leading-none">
                <span className="font-editorial text-[15px] font-semibold text-white">Compliance ROI</span>
                <span className="mt-0.5 hidden text-[9px] font-mono uppercase tracking-[0.14em] text-slate-500 sm:block">
                  Value protected
                </span>
              </div>
            </Link>
            <PeriodToggle period={period} onSelect={setPeriod} />
          </div>
        </header>

        {/* Body */}
        <main className="mx-auto max-w-5xl space-y-5 px-4 py-5 sm:px-6 sm:py-7">
          <RoiStatCards snapshot={snapshot} />

          <div id="trend" className="grid grid-cols-1 gap-5 scroll-mt-20 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <SavingsTrend trend={snapshot.trend} periodLabel={snapshot.periodLabel} />
            </div>
            <div className="lg:col-span-2">
              <SavingsBreakdown categories={snapshot.categories} />
            </div>
          </div>

          {/* Report CTA — the revenue action the ROI story justifies */}
          <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-brand-400/20 bg-brand-500/[0.06] p-6 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-editorial text-lg font-semibold text-white">
                See your own number
              </h3>
              <p className="mt-1 max-w-xl text-[13px] text-slate-300">
                Run the proxy for 14 days in your environment and get a SHA-256-signed{' '}
                <span className="font-semibold text-white">$499 CMMC AI Risk Assessment Report</span>{' '}
                — every prompt event scored against NIST 800-171, on your infrastructure.
              </p>
            </div>
            <Link
              href="/assessment"
              className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-brand-400 px-5 py-3 text-[14px] font-bold text-[#08090e] transition-transform hover:scale-[1.02]"
            >
              Get the report
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Cost model — transparent assumptions (never a fabricated live metric) */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              <Info className="h-3.5 w-3.5" />
              How this is modeled
            </div>
            <p className="text-[12px] leading-relaxed text-slate-400">
              Sample org · modeled estimate. Value protected = prevented incidents ×
              a conservative remediation cost per category (
              {CATEGORIES.map((c, i) => (
                <span key={c.id}>
                  {i > 0 ? ', ' : ''}
                  <span className="text-slate-300">{c.short} {formatUsd(c.costPerIncident)}</span>
                </span>
              ))}
              ). ROI is measured against HoundShield Pro at ${PRO_MONTHLY}/mo. One prevented CUI
              or PHI incident already exceeds a full year of HoundShield. These are transparent
              planning assumptions, not measured customer telemetry. Posture is scanned locally on
              customer infrastructure (Mode B) — prompt content never leaves the boundary.
            </p>
          </div>
        </main>
      </div>

      <BottomTabBar />
    </div>
  );
}

export default RoiDashboard;
