'use client';

import Link from 'next/link';
import {
  ShieldCheck,
  ClipboardCheck,
  SearchX,
  FileBarChart,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';

// ─── Placeholder Stats ───────────────────────────────────────────────────────

const STATS = [
  {
    label: 'Controls Assessed',
    value: '0 / 110',
    icon: ClipboardCheck,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    label: 'Completion',
    value: '0%',
    icon: TrendingUp,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    label: 'Controls Met',
    value: '0',
    icon: CheckCircle2,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
  },
  {
    label: 'Open Gaps',
    value: '--',
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
];

const QUICK_ACTIONS = [
  {
    label: 'Start Assessment',
    href: '/shieldready/assessment',
    icon: ClipboardCheck,
    description: 'Begin evaluating your NIST 800-171 controls',
  },
  {
    label: 'View Gaps',
    href: '/shieldready/gaps',
    icon: SearchX,
    description: 'Identify unmet controls and remediation steps',
  },
  {
    label: 'Generate Report',
    href: '/shieldready/reports',
    icon: FileBarChart,
    description: 'Export your SPRS score and assessment details',
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function ShieldReadyDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-white/50">
          CMMC 2.0 / NIST SP 800-171 compliance at a glance
        </p>
      </div>

      {/* SPRS Score Gauge */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#14141a]/70 p-8 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-emerald-400" />
          <h2 className="text-lg font-medium text-white">SPRS Score</h2>
        </div>
        <div className="mt-6 flex items-end gap-4">
          <div className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-white/[0.08] bg-[#0c0c10]">
            <div className="text-center">
              <span className="text-4xl font-bold text-white/30">--</span>
              <p className="mt-0.5 text-xs text-white/30">/ 110</p>
            </div>
          </div>
          <div className="space-y-2 pb-4">
            <p className="text-sm text-white/40">
              Complete your first assessment to calculate your SPRS score.
            </p>
            <p className="text-xs text-white/25">
              Range: -203 (worst) to +110 (perfect)
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map(({ label, value, icon: Icon, color, bg }) => (
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

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-medium text-white">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {QUICK_ACTIONS.map(({ label, href, icon: Icon, description }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-xl border border-white/[0.06] bg-[#14141a]/70 p-5 backdrop-blur-xl transition-colors hover:border-emerald-500/20 hover:bg-emerald-500/[0.04]"
            >
              <Icon className="h-5 w-5 text-emerald-400" />
              <h3 className="mt-3 text-sm font-medium text-white group-hover:text-emerald-300">
                {label}
              </h3>
              <p className="mt-1 text-xs text-white/40">{description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-white/[0.06] bg-[#14141a]/70 p-6 backdrop-blur-xl">
        <h2 className="text-lg font-medium text-white">Recent Activity</h2>
        <div className="mt-6 flex flex-col items-center justify-center py-8 text-center">
          <Clock className="h-8 w-8 text-white/15" />
          <p className="mt-3 text-sm text-white/30">No activity yet</p>
          <p className="mt-1 text-xs text-white/20">
            Start an assessment to see your progress here.
          </p>
        </div>
      </div>
    </div>
  );
}
