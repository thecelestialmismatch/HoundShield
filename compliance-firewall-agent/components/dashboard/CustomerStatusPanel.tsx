"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Compass,
  ArrowRight,
  Wrench,
  ListChecks,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { buildLocalCustomerStatus } from "@/lib/customer/client-status";
import type { CustomerStatus, OrderSummary } from "@/lib/customer/status";

/**
 * Standing-badge colours, tuned for the LIGHT /console surface (steel & cream).
 * The panel used to be dark-themed (text-white on translucent white) and mounted
 * on the light dashboard — rendering white-on-white and effectively invisible.
 * These are readable light-mode tokens with an accessible contrast on white.
 */
const LEVEL_ACCENT: Record<string, string> = {
  excellent: "text-emerald-700 border-emerald-500/30 bg-emerald-500/10",
  good: "text-emerald-700 border-emerald-500/30 bg-emerald-500/10",
  fair: "text-[var(--hs-steel-dark,#3A6EA5)] border-[var(--hs-steel,#81A6C6)]/40 bg-[var(--hs-steel,#81A6C6)]/12",
  poor: "text-orange-700 border-orange-500/30 bg-orange-500/10",
  critical: "text-red-700 border-red-500/30 bg-red-500/10",
  unknown: "text-[var(--hs-ink-tertiary,#6B8299)] border-black/10 bg-black/[0.03]",
};

/**
 * After-login "where you stand / what's next / how to fix" panel.
 *
 * SPRS/readiness is computed client-side from local assessment data (it never
 * leaves the browser); account status (tier + latest $499 report order) comes
 * from /api/customer/status (own-data, RLS-scoped). The two merge through the
 * shared status engine so the guidance is identical to what Brain AI gives.
 */
export function CustomerStatusPanel() {
  const [status, setStatus] = useState<CustomerStatus | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/customer/status")
      .then((res) => (res.ok ? res.json() : { status: null }))
      .then((data: { status?: CustomerStatus }) => {
        if (!active) return;
        const account = {
          tier: data?.status?.tier ?? "free",
          latestOrder: (data?.status?.order as OrderSummary | null) ?? null,
        };
        // Merge the server account slice with the local SPRS slice.
        setStatus(buildLocalCustomerStatus(account));
      })
      .catch(() => {
        if (active) setStatus(buildLocalCustomerStatus({ tier: "free", latestOrder: null }));
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!loaded) {
    return (
      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-black/[0.08] bg-white p-6 text-sm text-[var(--hs-ink-secondary,#3D5166)] shadow-[0_1px_2px_rgba(15,30,46,0.04),0_4px_16px_rgba(15,30,46,0.05)]">
        <Loader2 className="h-4 w-4 animate-spin text-[var(--hs-steel-dark,#3A6EA5)]" aria-hidden />
        Assessing where you stand…
      </div>
    );
  }
  if (!status) return null;

  const accent = LEVEL_ACCENT[status.standingLevel] ?? LEVEL_ACCENT.unknown;
  const ink = "text-[var(--hs-ink,#0F1E2E)]";
  const inkMut = "text-[var(--hs-ink-secondary,#3D5166)]";
  const inkFaint = "text-[var(--hs-ink-tertiary,#6B8299)]";
  const steel = "text-[var(--hs-steel-dark,#3A6EA5)]";

  return (
    <section className="mb-5 overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_1px_2px_rgba(15,30,46,0.04),0_10px_30px_rgba(30,58,90,0.07)]">
      {/* Standing header */}
      <div className="relative border-b border-black/[0.06] bg-gradient-to-r from-[var(--hs-steel,#81A6C6)]/[0.06] to-transparent p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.18em] ${inkFaint}`}>
            <Compass className={`h-3.5 w-3.5 ${steel}`} aria-hidden />
            Where you stand
          </span>
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${accent}`}>
            {status.stageLabel}
          </span>
        </div>
        <p className={`text-lg font-semibold ${ink}`}>{status.standing}</p>

        {/* Metric row */}
        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          {status.sprsScore !== null && (
            <div>
              <span className={inkFaint}>SPRS </span>
              <span className={`font-mono font-semibold ${ink}`}>{status.sprsScore}</span>
              <span className={inkFaint}> · {status.sprsLabel}</span>
            </div>
          )}
          {status.completionPercent !== null && (
            <div>
              <span className={inkFaint}>Assessed </span>
              <span className={`font-mono font-semibold ${ink}`}>{status.completionPercent}%</span>
            </div>
          )}
          {status.gapCount !== null && (
            <div>
              <span className={inkFaint}>Open gaps </span>
              <span className={`font-mono font-semibold ${ink}`}>{status.gapCount}</span>
            </div>
          )}
          {status.order && (
            <div>
              <span className={inkFaint}>Report </span>
              <span className={`font-mono font-semibold ${ink}`}>{status.order.reference}</span>
            </div>
          )}
        </div>
      </div>

      {/* Next step */}
      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className={`mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${steel}`}>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            Your next step
          </p>
          <p className={`font-semibold ${ink}`}>{status.nextStep.title}</p>
          <p className={`mt-0.5 text-sm ${inkMut}`}>{status.nextStep.detail}</p>
        </div>
        {status.nextStep.action && (
          <Link
            href={status.nextStep.action.href}
            className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-gradient-to-br from-[var(--hs-steel-dark,#5A86A8)] to-[var(--hs-steel,#81A6C6)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(90,134,168,0.34)] transition-all hover:-translate-y-0.5 hover:brightness-105"
          >
            {status.nextStep.action.label}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </div>

      {/* How to fix (top gaps) */}
      {status.topGaps.length > 0 && (
        <div className="border-t border-black/[0.06] p-6">
          <p className={`mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${inkFaint}`}>
            <Wrench className="h-3.5 w-3.5" aria-hidden />
            Where to focus — highest-impact gaps
          </p>
          <ul className="space-y-2">
            {status.topGaps.slice(0, 3).map((gap) => (
              <li
                key={gap.controlId}
                className="flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-xl border border-black/[0.06] bg-[var(--hs-surface-1,#F1F6FB)] px-4 py-3"
              >
                <span className={`font-mono text-sm font-semibold ${steel}`}>{gap.controlId}</span>
                <span className={`text-sm ${ink}`}>{gap.title}</span>
                <span className={`w-full text-xs ${inkFaint}`}>
                  {gap.fix} · ~{gap.hours}h · −{Math.abs(gap.deduction)} SPRS
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Still needed */}
      {status.needed.length > 0 && (
        <div className="border-t border-black/[0.06] p-6">
          <p className={`mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${inkFaint}`}>
            <ListChecks className="h-3.5 w-3.5" aria-hidden />
            Still needed
          </p>
          <ul className="space-y-1.5">
            {status.needed.map((item) => (
              <li key={item} className={`flex items-start gap-2 text-sm ${inkMut}`}>
                <ShieldCheck className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${steel}`} aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
