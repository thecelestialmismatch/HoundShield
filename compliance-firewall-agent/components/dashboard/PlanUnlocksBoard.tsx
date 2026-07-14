'use client';

import Link from 'next/link';
import {
  Lock,
  Check,
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Crown,
} from 'lucide-react';
import { buildConsoleSections } from '@/lib/billing/console-sections';

export interface PlanUnlocksBoardProps {
  /** Raw tier slug from the signed-in profile (free|pro|growth|enterprise|agency). */
  tier?: string | null;
  /** Founder account — everything unlocked, no payment path shown. */
  founder?: boolean;
}

/**
 * Plan & Unlocks — the paywall view behind its own SIDEBAR button (per founder
 * direction it no longer sits above the dashboard). Opening it shows, per
 * capability, exactly what the current plan includes and what is restricted:
 * every locked tile carries a truthful "Available on <tier> — $<price>/mo" and
 * one Upgrade CTA to /pricing (which leads with the $499 report).
 *
 * All gating is derived from `buildConsoleSections`, which projects the single
 * source-of-truth entitlements grid — this board invents no rules of its own.
 * Founder accounts (already resolved to the top tier upstream) additionally
 * get an explicit "no payment required" banner instead of any upgrade copy.
 */
export function PlanUnlocksBoard({ tier, founder = false }: PlanUnlocksBoardProps) {
  const sections = buildConsoleSections(tier);

  return (
    <section className="space-y-4">
      {/* ── Plan header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            {founder ? (
              <Crown className="h-4 w-4 text-brand-400" aria-hidden />
            ) : (
              <ShieldCheck className="h-4 w-4 text-brand-400" aria-hidden />
            )}
            <span className="rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
              {founder ? 'Founder' : sections.planName} plan
            </span>
          </div>
          <p className="text-sm text-white/70">
            {founder
              ? 'Founder access — every capability is unlocked. No payment required on this account.'
              : sections.isPaid
                ? 'Full access — every capability on your plan is unlocked below.'
                : 'Restricted plan. The capabilities below marked with a lock require a paid plan — each one shows exactly what it costs to unlock.'}
          </p>
        </div>
        {!founder && !sections.isPaid && (
          <Link
            href={sections.upgradeHref}
            className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-transform hover:scale-[1.02] active:scale-95"
          >
            See plans &amp; the $499 report
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
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

      {/* ── Locked capabilities — the restriction, priced truthfully ── */}
      {sections.locked.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-white/50">
            <Lock className="h-3.5 w-3.5 text-amber-500" aria-hidden />
            Locked — upgrade to unlock
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
                  {tile.availableOnPriceMonthly !== null
                    ? ` — $${tile.availableOnPriceMonthly}/mo`
                    : ''}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
