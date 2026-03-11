'use client';

import Link from 'next/link';
import {
  ShieldCheck,
  Building2,
  Users,
  FileCheck,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

const STEPS = [
  {
    number: 1,
    title: 'Organization Profile',
    description: 'Tell us about your company size, contract types, and CUI handling.',
    icon: Building2,
  },
  {
    number: 2,
    title: 'Team Setup',
    description: 'Invite team members who will participate in the assessment.',
    icon: Users,
  },
  {
    number: 3,
    title: 'CMMC Level Selection',
    description: 'Choose Level 1 (17 controls) or Level 2 (110 controls) based on your contracts.',
    icon: FileCheck,
  },
  {
    number: 4,
    title: 'First Assessment',
    description: 'Walk through your controls and get your initial SPRS score.',
    icon: CheckCircle2,
  },
];

export default function OnboardingPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
            <ShieldCheck className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Welcome to ShieldReady
          </h1>
          <p className="mt-2 text-sm text-white/50">
            Get CMMC 2.0 compliant in weeks, not months. Let&apos;s set up your
            organization in a few quick steps.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {STEPS.map(({ number, title, description, icon: Icon }) => (
            <div
              key={number}
              className="flex items-start gap-4 rounded-xl border border-white/[0.06] bg-[#14141a]/70 p-5 backdrop-blur-xl"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-sm font-semibold text-emerald-400">
                {number}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-white/40" />
                  <h3 className="text-sm font-medium text-white">{title}</h3>
                </div>
                <p className="mt-1 text-xs text-white/40">{description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-3">
          <button
            disabled
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-medium text-white opacity-60 cursor-not-allowed"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </button>
          <Link
            href="/shieldready"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] px-6 py-3 text-sm font-medium text-white/50 transition-colors hover:border-white/[0.15] hover:text-white/70"
          >
            Skip for Now
          </Link>
        </div>
      </div>
    </div>
  );
}
