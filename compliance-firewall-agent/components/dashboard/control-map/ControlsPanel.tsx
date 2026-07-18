/**
 * ControlsPanel — the "Controls Mapped" table.
 *
 * Renders the mapped CMMC L2 practices with status pill, animated progress bar,
 * and evidence count — the exact columns from the reference (Control ·
 * Description · Status · Progress · Evidence). Rows carrying atRisk get a subtle
 * amber left-edge so risk reads at a glance. Defaults to the top five (the
 * canonical preview) with a toggle to expand the full set.
 */
'use client';

import { useState } from 'react';
import { FileText, ArrowRight, AlertTriangle } from 'lucide-react';
import {
  type MappedControl,
  STATUS_LABEL,
} from '@/lib/dashboard/control-map-data';
import { MiniBar } from './MiniBar';
import { STATUS_STYLES, progressHex } from './tokens';

const PREVIEW_COUNT = 5;

function StatusPill({ control }: { control: MappedControl }) {
  const s = STATUS_STYLES[control.status];
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-[10px] font-semibold ${s.text} ${s.bg} ${s.border}`}
    >
      {STATUS_LABEL[control.status]}
    </span>
  );
}

function ControlRow({ control }: { control: MappedControl }) {
  return (
    <tr className="group border-t border-white/[0.05] transition-colors hover:bg-white/[0.02]">
      <td className="py-3 pl-1 pr-3 align-middle">
        <div className="flex items-center gap-2">
          {control.atRisk && (
            <AlertTriangle className="h-3 w-3 flex-shrink-0 text-warning" aria-label="At risk" />
          )}
          <span className="font-mono text-[12px] font-semibold text-brand-200">{control.id}</span>
        </div>
      </td>
      <td className="hidden py-3 pr-3 align-middle text-[12px] text-slate-300 sm:table-cell">
        {control.description}
      </td>
      <td className="py-3 pr-3 align-middle">
        <StatusPill control={control} />
      </td>
      <td className="py-3 pr-3 align-middle">
        <div className="flex items-center gap-2">
          <div className="w-16 sm:w-24">
            <MiniBar value={control.progress} color={progressHex(control.status)} height={5} />
          </div>
          <span className="w-9 text-right font-mono text-[11px] tabular-nums text-slate-400">
            {control.progress}%
          </span>
        </div>
      </td>
      <td className="py-3 pr-1 align-middle">
        <div className="flex items-center justify-end gap-1.5 sm:justify-start">
          <FileText className="h-3.5 w-3.5 text-slate-500" />
          <span className="font-mono text-[12px] tabular-nums text-slate-300">
            {control.evidenceCount}
          </span>
        </div>
      </td>
    </tr>
  );
}

export function ControlsPanel({ controls }: { controls: MappedControl[] }) {
  const [expanded, setExpanded] = useState(false);
  const rows = expanded ? controls : controls.slice(0, PREVIEW_COUNT);
  const hasMore = controls.length > PREVIEW_COUNT;

  return (
    <section
      id="controls"
      className="flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5"
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-editorial text-base font-semibold text-white">Controls Mapped</h2>
        <span className="font-mono text-[11px] text-slate-500">
          {controls.length} practices
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="pb-2 pl-1 pr-3 font-medium">Control</th>
              <th className="hidden pb-2 pr-3 font-medium sm:table-cell">Description</th>
              <th className="pb-2 pr-3 font-medium">Status</th>
              <th className="pb-2 pr-3 font-medium">Progress</th>
              <th className="pb-2 pr-1 font-medium">Evidence</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <ControlRow key={c.id} control={c} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        {hasMore ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-brand-300 transition-colors hover:text-brand-200"
          >
            {expanded ? 'Show top 5' : 'View all controls'}
            <ArrowRight
              className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`}
            />
          </button>
        ) : (
          <span />
        )}
      </div>
    </section>
  );
}
