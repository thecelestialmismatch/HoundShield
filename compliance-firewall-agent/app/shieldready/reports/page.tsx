'use client';

import Link from 'next/link';
import {
  FileBarChart,
  ClipboardCheck,
  Download,
  FileText,
  Printer,
} from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Reports
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Generate and export SPRS score sheets, POA&amp;M documents, and assessment summaries
        </p>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            title: 'SPRS Score Sheet',
            desc: 'Official DoD SPRS score breakdown by control family.',
            icon: FileBarChart,
          },
          {
            title: 'POA&M Document',
            desc: 'Plan of Action & Milestones for unmet controls.',
            icon: FileText,
          },
          {
            title: 'Full Assessment Report',
            desc: 'Complete assessment with responses, evidence, and scores.',
            icon: Printer,
          },
        ].map(({ title, desc, icon: Icon }) => (
          <div
            key={title}
            className="rounded-xl border border-white/[0.06] bg-[#14141a]/70 p-5 backdrop-blur-xl"
          >
            <Icon className="h-5 w-5 text-emerald-400" />
            <h3 className="mt-3 text-sm font-medium text-white">{title}</h3>
            <p className="mt-1 text-xs text-white/40">{desc}</p>
            <button
              disabled
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/30 cursor-not-allowed"
            >
              <Download className="h-3 w-3" />
              Export
            </button>
          </div>
        ))}
      </div>

      {/* Empty State */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#14141a]/70 p-10 backdrop-blur-xl">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-2xl bg-emerald-500/10 p-4">
            <FileBarChart className="h-10 w-10 text-emerald-400" />
          </div>

          <h2 className="mt-6 text-xl font-semibold text-white">
            No Reports Available
          </h2>
          <p className="mt-2 max-w-md text-sm text-white/40">
            Complete an assessment to generate reports. Your SPRS score sheet,
            POA&amp;M, and full assessment report will be available for download
            here.
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
