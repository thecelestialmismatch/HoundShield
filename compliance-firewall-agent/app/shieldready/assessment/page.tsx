'use client';

import Link from 'next/link';
import { ClipboardCheck, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AssessmentPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Assessment Engine
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Evaluate your organization against all 110 NIST SP 800-171 Rev 2 controls
        </p>
      </div>

      {/* Coming Soon Card */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#14141a]/70 p-10 backdrop-blur-xl">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-2xl bg-emerald-500/10 p-4">
            <ClipboardCheck className="h-10 w-10 text-emerald-400" />
          </div>

          <h2 className="mt-6 text-xl font-semibold text-white">
            Assessment Engine &mdash; Coming Soon
          </h2>
          <p className="mt-2 max-w-md text-sm text-white/40">
            Walk through each control with plain-English questions, get
            AI-powered remediation guidance, and calculate your SPRS score in
            real time.
          </p>

          <div className="mt-8 flex gap-3">
            <button
              disabled
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 px-5 py-2.5 text-sm font-medium text-emerald-300 opacity-60 cursor-not-allowed"
            >
              <ShieldCheck className="h-4 w-4" />
              Start New Assessment
            </button>
            <Link
              href="/shieldready"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] px-5 py-2.5 text-sm font-medium text-white/50 transition-colors hover:border-white/[0.15] hover:text-white/70"
            >
              Back to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Preview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            title: 'Plain-English Questions',
            desc: 'No legalese. Each control is translated into a simple yes/no/partial question.',
          },
          {
            title: 'AI Remediation',
            desc: 'Get step-by-step fix guidance with affordable tool recommendations.',
          },
          {
            title: 'Live SPRS Score',
            desc: 'Watch your score update in real time as you answer each control.',
          },
        ].map(({ title, desc }) => (
          <div
            key={title}
            className="rounded-xl border border-white/[0.06] bg-[#14141a]/70 p-5 backdrop-blur-xl"
          >
            <h3 className="text-sm font-medium text-white">{title}</h3>
            <p className="mt-2 text-xs text-white/40">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
