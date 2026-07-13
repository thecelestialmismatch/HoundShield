'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Lock,
  Check,
  ArrowRight,
  ArrowUpRight,
  ClipboardCheck,
  ShieldCheck,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { buildConsoleSections } from '@/lib/billing/console-sections';

/**
 * The 110-control assessment is heavy (Framer Motion + every control). Load it
 * lazily and only when the user actually begins — the console stays light.
 */
const AssessmentBoard = dynamic(() => import('@/components/dashboard/AssessmentBoard'), {
  ssr: false,
  loading: () => (
    <div className="p-8 text-center text-sm text-white/50">Loading your assessment…</div>
  ),
});

export interface ConsoleDashboardProps {
  /** Raw tier slug from the signed-in profile (free|pro|growth|enterprise|agency). */
  tier?: string | null;
}

/**
 * Tier-gated after-login dashboard.
 *
 * Free → a RESTRICTED board: the CMMC self-assessment is the unlocked hero
 * (begins inline, right here — no bounce to a separate link), and every paid
 * capability shows locked with a truthful "Available on <tier>" + one Upgrade
 * CTA to /pricing (which leads with the $499 report).
 *
 * Paid → the FULL board: every capability the plan includes is unlocked and
 * links straight into the command center.
 *
 * All gating is derived from `buildConsoleSections`, which projects the single
 * source-of-truth entitlements grid — the dashboard invents no rules of its own.
 */
export function ConsoleDashboard({ tier }: ConsoleDashboardProps) {
  const sections = buildConsoleSections(tier);
  const [assessOpen, setAssessOpen] = useState(false);

  // Open the inline assessment when navigated to via `#assessment` (e.g. the
  // status panel's "Begin assessment" CTA scrolls here instead of leaving).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const openIfHash = () => {
      if (window.location.hash === '#assessment') {
        setAssessOpen(true);
        requestAnimationFrame(() =>
          document.getElementById('assessment')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        );
      }
    };
    openIfHash();
    window.addEventListener('hashchange', openIfHash);
    return () => window.removeEventListener('hashchange', openIfHash);
  }, []);

  return (
    <section className="mb-6 space-y-4">
      {/* ── Plan header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand-400" aria-hidden />
            <span className="rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
              {sections.planName} plan
            </span>
          </div>
          <p className="text-sm text-white/70">
            {sections.isPaid
              ? 'Full access — every capability on your plan is unlocked below.'
              : 'Restricted dashboard. Your CMMC self-assessment is free — unlock the AI gateway, audit exports and C3PAO-ready PDF reports when you upgrade.'}
          </p>
        </div>
        {!sections.isPaid && (
          <Link
            href={sections.upgradeHref}
            className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-transform hover:scale-[1.02] active:scale-95"
          >
            See plans &amp; the $499 report
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </div>

      {/* ── Assessment hero (unlocked for every tier — the free lead magnet) ── */}
      <div
        id="assessment"
        className="overflow-hidden rounded-2xl border border-brand-500/25 bg-gradient-to-br from-white to-[#EDF3F9]"
      >
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="min-w-0">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Free · included on every plan
            </p>
            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
              <ClipboardCheck className="h-5 w-5 text-brand-500" aria-hidden />
              CMMC self-assessment
            </h3>
            <p className="mt-1 text-sm text-white/70">
              Answer the 110 NIST 800-171 Rev 2 controls to get your live SPRS score — right here on
              your dashboard, no separate page.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAssessOpen((v) => !v)}
            aria-expanded={assessOpen}
            aria-controls="assessment-board"
            className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-transform hover:scale-[1.02] active:scale-95"
          >
            {assessOpen ? 'Hide assessment' : 'Begin assessment'}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${assessOpen ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>
        </div>

        {assessOpen && (
          <div
            id="assessment-board"
            className="border-t border-white/[0.08] bg-white/[0.02]"
          >
            <AssessmentBoard embedded />
          </div>
        )}
      </div>

      {/* ── Unlocked capabilities ───────────────────────────────────── */}
      {sections.unlocked.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-white/50">
            <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
            Included on your plan
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sections.unlocked.map((tile) => (
              <Link
                key={tile.key}
                href={tile.href}
                className="group flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 transition-colors hover:border-brand-500/40"
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
                    <Check className="h-4 w-4 flex-shrink-0 text-emerald-500" aria-hidden />
                    {tile.label}
                  </span>
                  <ArrowRight
                    className="h-4 w-4 flex-shrink-0 text-white/30 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-400"
                    aria-hidden
                  />
                </div>
                <p className="text-xs leading-relaxed text-white/55">{tile.description}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Locked capabilities (the "restricted" half) ─────────────── */}
      {sections.locked.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-white/50">
            <Lock className="h-3.5 w-3.5 text-amber-500" aria-hidden />
            Unlock with an upgrade
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sections.locked.map((tile) => (
              <Link
                key={tile.key}
                href={tile.upgradeHref}
                className="group relative flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 transition-colors hover:border-amber-500/40"
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-white/80">
                    <Lock className="h-4 w-4 flex-shrink-0 text-amber-500" aria-hidden />
                    {tile.label}
                  </span>
                  <ArrowUpRight
                    className="h-4 w-4 flex-shrink-0 text-white/30 transition-transform group-hover:-translate-y-0.5 group-hover:text-amber-500"
                    aria-hidden
                  />
                </div>
                <p className="mb-2.5 text-xs leading-relaxed text-white/45">{tile.description}</p>
                <span className="mt-auto inline-flex w-fit items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                  Available on {tile.availableOnName}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
