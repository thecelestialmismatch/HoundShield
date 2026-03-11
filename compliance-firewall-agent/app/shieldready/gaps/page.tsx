'use client';

import Link from 'next/link';
import { SearchX, ClipboardCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function GapAnalysisPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Gap Analysis
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Identify unmet and partially met controls with prioritized remediation plans
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Unmet Controls', value: '--', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Partial Controls', value: '--', icon: SearchX, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Met Controls', value: '--', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="rounded-xl border border-white/[0.06] bg-[#14141a]/70 p-5 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <span className="text-sm text-white/50">{label}</span>
            </div>
            <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Empty State */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#14141a]/70 p-10 backdrop-blur-xl">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-2xl bg-amber-500/10 p-4">
            <SearchX className="h-10 w-10 text-amber-400" />
          </div>

          <h2 className="mt-6 text-xl font-semibold text-white">
            No Assessment Data Yet
          </h2>
          <p className="mt-2 max-w-md text-sm text-white/40">
            Complete an assessment first to generate your gap analysis. Each unmet
            control will appear here with its SPRS impact, risk priority, and
            step-by-step remediation plan.
          </p>

          <Link
            href="/shieldready/assessment"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 px-5 py-2.5 text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-500/30"
          >
            <ClipboardCheck className="h-4 w-4" />
            Start Assessment
          </Link>
        </div>
      </div>
    </div>
  );
}
