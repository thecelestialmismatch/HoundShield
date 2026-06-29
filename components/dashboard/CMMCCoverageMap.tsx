'use client';

/**
 * CMMCCoverageMap
 *
 * Interactive grid showing HoundShield's coverage across all 110 NIST 800-171
 * Rev 2 practice requirements. Grouped by family, filterable by status,
 * searchable by control ID or title.
 *
 * Design: dark-mode glass-card, brand-400 accents. Never use amber-, yellow-, or indigo- classes.
 */

import { useState, useMemo } from 'react';
import type { EnrichedControlCoverage, CoverageSummary, FamilyCoverageSummary } from '@/lib/cmmc-coverage/index';
import { STATUS_LABELS, STATUS_COLORS, getStatusBadgeClass } from '@/lib/cmmc-coverage/index';
import type { CoverageStatus } from '@/lib/cmmc-coverage/coverage-data';

// ─── Props ────────────────────────────────────────────────────────────────────

interface CMMCCoverageMapProps {
  controls: EnrichedControlCoverage[];
  summary: CoverageSummary;
}

// ─── Status filter pill ───────────────────────────────────────────────────────

const ALL_STATUSES: (CoverageStatus | 'ALL')[] = [
  'ALL',
  'ENFORCED',
  'MONITORED',
  'PARTIAL',
  'OUT_OF_SCOPE',
];

function FilterPill({
  label,
  count,
  active,
  color,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
        active
          ? 'bg-[var(--brand-400)] border-[var(--brand-400)] text-black'
          : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
      }`}
    >
      {label !== 'ALL' && (
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: active ? 'currentColor' : color }}
        />
      )}
      {label}
      <span
        className={`px-1.5 py-0.5 rounded text-[10px] ${
          active ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-400'
        }`}
      >
        {count}
      </span>
    </button>
  );
}

// ─── Control card ─────────────────────────────────────────────────────────────

function ControlCard({
  coverage,
  onClick,
  selected,
}: {
  coverage: EnrichedControlCoverage;
  onClick: () => void;
  selected: boolean;
}) {
  const statusClasses: Record<CoverageStatus, string> = {
    ENFORCED: 'border-green-500/40 bg-green-500/5 hover:bg-green-500/10',
    MONITORED: 'border-blue-500/40 bg-blue-500/5 hover:bg-blue-500/10',
    PARTIAL: 'border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10',
    OUT_OF_SCOPE: 'border-white/5 bg-white/[0.02] hover:bg-white/5',
  };

  const dotColor: Record<CoverageStatus, string> = {
    ENFORCED: 'bg-green-500',
    MONITORED: 'bg-blue-500',
    PARTIAL: 'bg-amber-500',
    OUT_OF_SCOPE: 'bg-gray-600',
  };

  return (
    <button
      onClick={onClick}
      className={`relative p-2 rounded border text-left transition-all cursor-pointer ${
        statusClasses[coverage.status]
      } ${selected ? 'ring-1 ring-[var(--brand-400)]' : ''}`}
    >
      <span
        className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${dotColor[coverage.status]}`}
      />
      <p className="text-[10px] font-mono text-gray-400 leading-none">{coverage.controlId}</p>
      <p className="mt-1 text-[10px] text-gray-500 leading-tight line-clamp-2">
        {coverage.control.title}
      </p>
    </button>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function ControlDetail({ coverage }: { coverage: EnrichedControlCoverage }) {
  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-mono text-gray-400">{coverage.controlId}</p>
          <h3 className="mt-1 text-base font-medium text-white">{coverage.control.title}</h3>
          <p className="mt-0.5 text-xs text-gray-500">{coverage.control.familyName}</p>
        </div>
        <span
          className={`flex-shrink-0 px-2 py-1 rounded border text-xs font-medium ${getStatusBadgeClass(coverage.status)}`}
        >
          {STATUS_LABELS[coverage.status]}
        </span>
      </div>

      {coverage.status !== 'OUT_OF_SCOPE' && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            HoundShield Coverage
          </p>
          <p className="text-sm text-gray-300 leading-relaxed">{coverage.description}</p>
        </div>
      )}

      <div className="flex items-center gap-4 pt-2 border-t border-white/5">
        <div>
          <p className="text-xs text-gray-500">SPRS Protected</p>
          <p className="text-sm font-mono font-medium text-[var(--brand-400)]">
            {coverage.sprsProtected > 0 ? `+${coverage.sprsProtected} pts` : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Max Deduction</p>
          <p className="text-sm font-mono font-medium text-red-400">
            {coverage.control.sprsDeduction} pts
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">CMMC Level</p>
          <p className="text-sm font-mono font-medium text-white">
            L{coverage.control.cmmcLevel}
          </p>
        </div>
      </div>

      {coverage.status === 'OUT_OF_SCOPE' && (
        <p className="text-xs text-gray-500 italic">
          This control is outside HoundShield&apos;s proxy domain (physical security, traditional
          IAM, maintenance, media). Use complementary tools for full coverage.
        </p>
      )}
    </div>
  );
}

// ─── Family progress bar ──────────────────────────────────────────────────────

function FamilyBar({ family }: { family: FamilyCoverageSummary }) {
  const covered = family.enforced + family.monitored + family.partial;
  const pct = Math.round((covered / family.totalControls) * 100);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono text-gray-300">{family.family}</span>
        <span className="text-gray-500">
          {covered}/{family.totalControls}
        </span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden flex">
        <div
          className="h-full bg-green-500 transition-all"
          style={{ width: `${(family.enforced / family.totalControls) * 100}%` }}
        />
        <div
          className="h-full bg-blue-500 transition-all"
          style={{ width: `${(family.monitored / family.totalControls) * 100}%` }}
        />
        <div
          className="h-full bg-amber-500 transition-all"
          style={{ width: `${(family.partial / family.totalControls) * 100}%` }}
        />
      </div>
      <p className="text-[10px] text-gray-600">{pct}% covered</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CMMCCoverageMap({ controls, summary }: CMMCCoverageMapProps) {
  const [activeStatus, setActiveStatus] = useState<CoverageStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filtered controls
  const filtered = useMemo(() => {
    return controls.filter((c) => {
      const statusOk = activeStatus === 'ALL' || c.status === activeStatus;
      const q = search.toLowerCase();
      const searchOk =
        !q ||
        c.controlId.toLowerCase().includes(q) ||
        c.control.title.toLowerCase().includes(q) ||
        c.control.family.toLowerCase().includes(q);
      return statusOk && searchOk;
    });
  }, [controls, activeStatus, search]);

  // Group by family (preserving order)
  const byFamily = useMemo(() => {
    const map = new Map<string, { name: string; items: EnrichedControlCoverage[] }>();
    for (const c of filtered) {
      const key = c.control.family;
      if (!map.has(key)) map.set(key, { name: c.control.familyName, items: [] });
      map.get(key)!.items.push(c);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const selectedControl = selectedId
    ? controls.find((c) => c.controlId === selectedId) ?? null
    : null;

  const filterCounts = useMemo(
    () => ({
      ALL: controls.length,
      ENFORCED: summary.enforced,
      MONITORED: summary.monitored,
      PARTIAL: summary.partial,
      OUT_OF_SCOPE: summary.outOfScope,
    }),
    [controls.length, summary],
  );

  return (
    <div className="space-y-6">
      {/* ── Summary bar ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(
          [
            { key: 'ENFORCED', label: 'Enforced', val: summary.enforced, color: '#22c55e' },
            { key: 'MONITORED', label: 'Monitored', val: summary.monitored, color: '#3b82f6' },
            { key: 'PARTIAL', label: 'Partial', val: summary.partial, color: '#f59e0b' },
            {
              key: 'SPRS',
              label: 'SPRS Protected',
              val: `+${summary.totalSprsProtected}`,
              color: 'var(--brand-400)',
            },
          ] as const
        ).map(({ key, label, val, color }) => (
          <div key={key} className="glass-card p-4 text-center">
            <p className="text-2xl font-mono font-bold" style={{ color }}>
              {val}
            </p>
            <p className="mt-1 text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        {/* ── Left: grid + filters ─────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Filters + search */}
          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="text"
              placeholder="Search controls…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 px-3 rounded bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[var(--brand-400)] w-44"
            />
            <div className="flex flex-wrap gap-1.5">
              {ALL_STATUSES.map((s) => (
                <FilterPill
                  key={s}
                  label={s === 'ALL' ? 'All' : STATUS_LABELS[s as CoverageStatus]}
                  count={filterCounts[s as keyof typeof filterCounts]}
                  active={activeStatus === s}
                  color={s !== 'ALL' ? STATUS_COLORS[s as CoverageStatus] : ''}
                  onClick={() => {
                    setActiveStatus(s as CoverageStatus | 'ALL');
                    setSelectedId(null);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Control grid, grouped by family */}
          {byFamily.length === 0 ? (
            <div className="glass-card p-8 text-center text-gray-500 text-sm">
              No controls match your filter.
            </div>
          ) : (
            <div className="space-y-5">
              {byFamily.map(([family, { name, items }]) => (
                <div key={family}>
                  <p className="text-xs font-medium text-gray-400 mb-2">
                    <span className="font-mono text-white">{family}</span>
                    <span className="ml-2 text-gray-600">— {name}</span>
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1.5">
                    {items.map((c) => (
                      <ControlCard
                        key={c.controlId}
                        coverage={c}
                        selected={selectedId === c.controlId}
                        onClick={() =>
                          setSelectedId(selectedId === c.controlId ? null : c.controlId)
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: detail + family bars ──────────────────────────────── */}
        <div className="space-y-4">
          {selectedControl ? (
            <ControlDetail coverage={selectedControl} />
          ) : (
            <div className="glass-card p-5 text-center text-gray-500 text-sm">
              <p className="text-2xl mb-2">🛡️</p>
              <p>Click any control to see</p>
              <p>HoundShield coverage details.</p>
            </div>
          )}

          {/* Family coverage bars */}
          <div className="glass-card p-5 space-y-3">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Coverage by Family
            </p>
            <div className="space-y-3">
              {summary.byFamily.map((f) => (
                <FamilyBar key={f.family} family={f} />
              ))}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-3 pt-2 border-t border-white/5">
              {(['ENFORCED', 'MONITORED', 'PARTIAL'] as const).map((s) => (
                <div key={s} className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[s] }}
                  />
                  <span className="text-[10px] text-gray-500">{STATUS_LABELS[s]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
