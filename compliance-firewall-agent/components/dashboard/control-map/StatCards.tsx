/**
 * StatCards — the five KPI tiles across the top of the Control Map.
 *
 * Every number is read from the resolved DashboardSnapshot (no hardcoded
 * figures): Overall Progress ring, CMMC Level target shield, active Clients,
 * Assessments in progress, and At-Risk controls. Colour accents let status
 * read before a single digit does.
 */
'use client';

import { Users, ClipboardCheck, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { DashboardSnapshot } from '@/lib/dashboard/control-map-data';
import { ProgressRing } from './ProgressRing';

function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset] ${className}`}
    >
      {children}
    </div>
  );
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
      {children}
    </span>
  );
}

export function StatCards({ snapshot }: { snapshot: DashboardSnapshot }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {/* Overall Progress */}
      <Card className="col-span-2 flex flex-col items-center justify-center gap-2 lg:col-span-1">
        <CardLabel>Overall Progress</CardLabel>
        <ProgressRing value={snapshot.overallProgress} label="Overall Progress" />
      </Card>

      {/* CMMC Level target */}
      <Card className="flex flex-col items-center justify-center gap-3 text-center">
        <CardLabel>CMMC Level</CardLabel>
        <div className="relative flex items-center justify-center">
          <ShieldCheck className="h-16 w-16 text-brand-400/30" strokeWidth={1.25} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[8px] font-mono uppercase tracking-widest text-slate-400">Level</span>
            <span className="font-editorial text-2xl font-bold text-white leading-none">
              {snapshot.cmmcLevelTarget}
            </span>
          </div>
        </div>
        <span className="text-[11px] font-medium text-slate-400">Target</span>
      </Card>

      {/* Clients */}
      <Card className="flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <CardLabel>Clients</CardLabel>
          <Users className="h-4 w-4 text-brand-400" />
        </div>
        <div>
          <div className="font-mono text-3xl font-bold tabular-nums text-white">
            {snapshot.activeClients}
          </div>
          <span className="text-[11px] text-slate-400">
            {snapshot.activeClients === 1 ? 'In scope' : 'Active clients'}
          </span>
        </div>
      </Card>

      {/* Assessments */}
      <Card className="flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <CardLabel>Assessments</CardLabel>
          <ClipboardCheck className="h-4 w-4 text-brand-400" />
        </div>
        <div>
          <div className="font-mono text-3xl font-bold tabular-nums text-white">
            {snapshot.assessmentsInProgress}
          </div>
          <span className="text-[11px] text-slate-400">In progress</span>
        </div>
      </Card>

      {/* At Risk */}
      <Card className="flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <CardLabel>At Risk</CardLabel>
          <AlertTriangle className="h-4 w-4 text-warning" />
        </div>
        <div>
          <div className="font-mono text-3xl font-bold tabular-nums text-warning">
            {snapshot.atRiskControls}
          </div>
          <span className="text-[11px] text-slate-400">
            {snapshot.atRiskControls === 1 ? 'Control' : 'Controls'}
          </span>
        </div>
      </Card>
    </div>
  );
}
