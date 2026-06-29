/**
 * /command-center/shield/coverage
 *
 * In-app CMMC control coverage map. Shows Jordan exactly which of the 110
 * NIST 800-171 Rev 2 controls HoundShield enforces, monitors, or partially
 * addresses — and which SPRS points are protected.
 *
 * Rendered as a Server Component; the interactive grid is a 'use client'
 * component imported below.
 */

import { getAllCoverage, getCoverageSummary } from '@/lib/cmmc-coverage/index';
import CMMCCoverageMap from '@/components/dashboard/CMMCCoverageMap';

export const metadata = {
  title: 'CMMC Coverage Map — HoundShield',
  description:
    'See exactly which NIST 800-171 Rev 2 controls HoundShield enforces, monitors, and partially covers across your AI tooling.',
};

export default function CoveragePage() {
  const controls = getAllCoverage();
  const summary = getCoverageSummary();

  const coveredPct = summary.coveragePercent;
  const outOfScopePct = Math.round((summary.outOfScope / summary.totalControls) * 100);

  return (
    <div className="space-y-6 p-6">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-editorial text-white">CMMC Coverage Map</h1>
          <p className="mt-1 text-sm text-gray-400">
            110 NIST SP 800-171 Rev 2 controls ·{' '}
            <span className="text-[var(--brand-400)] font-medium">
              {coveredPct}% covered by HoundShield
            </span>
          </p>
        </div>

        {/* SPRS impact callout */}
        <div className="glass-card px-4 py-3 flex items-center gap-3 text-sm self-start sm:self-auto">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">HoundShield protects</span>
            <span className="text-xl font-mono font-bold text-[var(--brand-400)]">
              +{summary.totalSprsProtected} SPRS pts
            </span>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="flex flex-col text-xs text-gray-500">
            <span>{outOfScopePct}% out of scope</span>
            <span>(physical, personnel, IAM)</span>
          </div>
        </div>
      </div>

      {/* ── Coverage legend callout ───────────────────────────────────────── */}
      <div className="glass-card p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        {(
          [
            {
              status: 'ENFORCED',
              color: 'text-green-400',
              dot: 'bg-green-500',
              label: 'Enforced',
              desc: 'HoundShield IS the technical control. Claim MET.',
            },
            {
              status: 'MONITORED',
              color: 'text-blue-400',
              dot: 'bg-blue-500',
              label: 'Monitored',
              desc: 'HoundShield generates the required evidence and audit trail.',
            },
            {
              status: 'PARTIAL',
              color: 'text-amber-400',
              dot: 'bg-amber-500',
              label: 'Partial',
              desc: 'Covers the AI channel. Additional controls needed for full credit.',
            },
            {
              status: 'OUT_OF_SCOPE',
              color: 'text-gray-500',
              dot: 'bg-gray-600',
              label: 'Out of Scope',
              desc: 'Physical, personnel, traditional IAM — outside proxy domain.',
            },
          ] as const
        ).map(({ color, dot, label, desc }) => (
          <div key={label} className="flex items-start gap-2">
            <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${dot}`} />
            <div>
              <p className={`font-medium ${color}`}>{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Interactive coverage map ──────────────────────────────────────── */}
      <CMMCCoverageMap controls={controls} summary={summary} />

      {/* ── Footer note ──────────────────────────────────────────────────── */}
      <p className="text-xs text-gray-600 text-center pb-4">
        Coverage classifications reflect HoundShield&apos;s proxy-based DLP capabilities against
        NIST SP 800-171 Rev 2 (June 2015, DoD Memo Feb 2021). Consult a C3PAO assessor for final
        CMMC Level 2 certification determination.
      </p>
    </div>
  );
}
