/**
 * RoiStatCards — the gradient hero tiles across the top of the ROI dashboard.
 *
 * Mirrors the reference's magenta/blue gradient cards, rebuilt in dark-steel:
 * one hero "value protected" tile plus three supporting tiles (incidents
 * prevented, monthly average, ROI multiple). Every figure is read from the
 * resolved RoiSnapshot — no hardcoded numbers.
 */
'use client';

import { ShieldCheck, TrendingUp, Ban, CalendarDays } from 'lucide-react';
import type { RoiSnapshot } from '@/lib/dashboard/roi-model';
import { formatUsd, formatCompact } from '@/lib/dashboard/roi-model';
import { TILE_GRADIENT, HERO_GRADIENT, SKY, POSITIVE } from './tokens';

export function RoiStatCards({ snapshot }: { snapshot: RoiSnapshot }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Hero — total value protected */}
      <div
        className="relative col-span-1 overflow-hidden rounded-3xl border border-white/[0.1] p-6 sm:col-span-2"
        style={{ background: HERO_GRADIENT }}
      >
        <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/[0.06] blur-2xl" />
        <div className="relative flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-sky-100/70">
          <ShieldCheck className="h-4 w-4" style={{ color: SKY }} />
          Value protected · {snapshot.periodLabel}
        </div>
        <div className="relative mt-3 font-mono text-4xl font-bold tabular-nums text-white sm:text-5xl">
          {formatUsd(snapshot.totalAvoided)}
        </div>
        <div className="relative mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px]">
          <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: POSITIVE }}>
            <TrendingUp className="h-3.5 w-3.5" />
            {snapshot.roiMultiple}× ROI
          </span>
          <span className="text-slate-300/80">
            vs {formatUsd(snapshot.toolCost)} HoundShield cost
          </span>
        </div>
      </div>

      {/* Incidents prevented */}
      <Tile
        icon={<Ban className="h-4 w-4" style={{ color: SKY }} />}
        label="Incidents prevented"
        value={snapshot.totalIncidents.toLocaleString('en-US')}
        sub="Blocked before leaving the boundary"
      />

      {/* Monthly average */}
      <Tile
        icon={<CalendarDays className="h-4 w-4" style={{ color: SKY }} />}
        label="Monthly average"
        value={formatCompact(snapshot.monthlyAverage)}
        sub="Remediation avoided / month"
      />
    </div>
  );
}

function Tile({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-white/[0.08] p-5"
      style={{ background: TILE_GRADIENT }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
          {label}
        </span>
        {icon}
      </div>
      <div className="mt-4 font-mono text-3xl font-bold tabular-nums text-white">{value}</div>
      <div className="mt-1 text-[11px] text-slate-400">{sub}</div>
    </div>
  );
}
