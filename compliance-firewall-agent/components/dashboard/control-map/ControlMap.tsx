/**
 * ControlMap — the multi-client CMMC command surface (route: /control-map).
 *
 * The dashboard an RPO/MSP partner uses to run compliance posture across every
 * client they manage — HoundShield's #1 channel view. Faithful to the design
 * the founder loves (sidebar shell · KPI ring · framework rollups · mapped
 * controls table) but rendered in HoundShield dark-steel, not the reference's
 * purple, per the design-system rules.
 *
 * The client selector is live: choosing a client re-resolves the whole
 * snapshot (KPIs, framework rollups, control posture) through the pure
 * getSnapshot() helper, so the numbers always agree with the data model.
 * SSR-safe — no Recharts, no window access at module scope.
 */
'use client';

import { useMemo, useState } from 'react';
import { Bell, ChevronDown, Check, Search } from 'lucide-react';
import {
  CLIENTS,
  getSnapshot,
  SECTOR_LABEL,
} from '@/lib/dashboard/control-map-data';
import { Sidebar } from './Sidebar';
import { StatCards } from './StatCards';
import { FrameworkPanel } from './FrameworkPanel';
import { ControlsPanel } from './ControlsPanel';

/* ── Client selector ("All Clients" dropdown) ─────────────────────────── */
function ClientSelector({
  scope,
  label,
  onSelect,
}: {
  scope: 'all' | string;
  label: string;
  onSelect: (scope: 'all' | string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-3.5 py-2 text-[13px] font-medium text-slate-200 transition-colors hover:border-white/[0.18] hover:bg-white/[0.05]"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="max-w-[160px] truncate">{label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 flex-shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <>
          {/* click-away scrim */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="listbox"
            className="absolute right-0 z-50 mt-2 max-h-[340px] w-64 overflow-y-auto rounded-2xl border border-white/[0.1] bg-[#0d0e14] p-1.5 shadow-2xl shadow-black/60"
          >
            <div className="mb-1 flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-slate-500">
              <Search className="h-3 w-3" />
              <span>{CLIENTS.length} managed clients</span>
            </div>
            <button
              type="button"
              role="option"
              aria-selected={scope === 'all'}
              onClick={() => {
                onSelect('all');
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-slate-200 transition-colors hover:bg-white/[0.05]"
            >
              <span className="flex-1 font-medium">All Clients</span>
              {scope === 'all' && <Check className="h-3.5 w-3.5 text-brand-300" />}
            </button>
            <div className="my-1 h-px bg-white/[0.06]" />
            {CLIENTS.map((c) => (
              <button
                key={c.id}
                type="button"
                role="option"
                aria-selected={scope === c.id}
                onClick={() => {
                  onSelect(c.id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-white/[0.05]"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[13px] text-slate-200">{c.name}</span>
                  <span className="text-[10px] text-slate-500">
                    {SECTOR_LABEL[c.sector]} · CMMC L{c.cmmcLevel}
                  </span>
                </span>
                {scope === c.id && <Check className="h-3.5 w-3.5 flex-shrink-0 text-brand-300" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Shell ────────────────────────────────────────────────────────────── */
export function ControlMap() {
  const [scope, setScope] = useState<'all' | string>('all');
  const snapshot = useMemo(() => getSnapshot(scope), [scope]);

  return (
    <div
      id="top"
      className="relative min-h-screen scroll-smooth bg-[#08090e] text-slate-200 font-sans"
    >
      {/* ambient steel glow — depth without flat black */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[8%] -top-[12%] h-[46%] w-[38%] rounded-full bg-brand-500/[0.10] blur-[130px]" />
        <div className="absolute -right-[6%] top-[30%] h-[42%] w-[34%] rounded-full bg-brand-700/[0.10] blur-[130px]" />
      </div>

      <div className="relative z-10 flex">
        <Sidebar activeId="dashboard" />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Topbar */}
          <header
            id="clients"
            className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-white/[0.06] bg-[#08090e]/80 px-5 backdrop-blur-xl lg:px-8"
          >
            <div className="flex min-w-0 items-center gap-3">
              <h1 className="font-editorial text-xl font-semibold text-white">Dashboard</h1>
              {scope !== 'all' && (
                <span className="hidden truncate rounded-full border border-brand-400/25 bg-brand-500/10 px-2.5 py-0.5 text-[11px] font-medium text-brand-200 sm:inline">
                  {snapshot.scopeLabel}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <ClientSelector scope={scope} label={snapshot.scopeLabel} onSelect={setScope} />
              <button
                type="button"
                className="relative rounded-xl border border-white/[0.08] bg-white/[0.03] p-2 text-slate-400 transition-colors hover:text-white"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {snapshot.atRiskControls > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-warning" />
                )}
              </button>
            </div>
          </header>

          {/* Body */}
          <main className="flex-1 space-y-5 p-5 lg:p-8">
            <StatCards snapshot={snapshot} />

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <FrameworkPanel frameworks={snapshot.frameworks} />
              </div>
              <div className="lg:col-span-2">
                <ControlsPanel controls={snapshot.controls} />
              </div>
            </div>

            <p className="pt-1 text-center text-[11px] text-slate-600">
              Sample portfolio · Posture scanned locally on customer infrastructure (Mode B).
              CUI never leaves the client boundary.
            </p>
          </main>
        </div>
      </div>
    </div>
  );
}

export default ControlMap;
