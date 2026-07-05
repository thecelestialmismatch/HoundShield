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

const LEVEL_ACCENT: Record<string, string> = {
  excellent: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10",
  good: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10",
  fair: "text-brand-300 border-brand-400/30 bg-brand-400/10",
  poor: "text-orange-300 border-orange-400/30 bg-orange-400/10",
  critical: "text-red-300 border-red-400/30 bg-red-400/10",
  unknown: "text-white/60 border-white/15 bg-white/[0.04]",
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
      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 text-sm text-white/60">
        <Loader2 className="h-4 w-4 animate-spin text-brand-400" aria-hidden />
        Assessing where you stand…
      </div>
    );
  }
  if (!status) return null;

  const accent = LEVEL_ACCENT[status.standingLevel] ?? LEVEL_ACCENT.unknown;

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
      {/* Standing header */}
      <div className="border-b border-white/[0.06] p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.18em] text-white/50">
            <Compass className="h-3.5 w-3.5 text-brand-400" aria-hidden />
            Where you stand
          </span>
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${accent}`}>
            {status.stageLabel}
          </span>
        </div>
        <p className="text-lg font-semibold text-white">{status.standing}</p>

        {/* Metric row */}
        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          {status.sprsScore !== null && (
            <div>
              <span className="text-white/45">SPRS </span>
              <span className="font-mono font-semibold text-white">{status.sprsScore}</span>
              <span className="text-white/45"> · {status.sprsLabel}</span>
            </div>
          )}
          {status.completionPercent !== null && (
            <div>
              <span className="text-white/45">Assessed </span>
              <span className="font-mono font-semibold text-white">{status.completionPercent}%</span>
            </div>
          )}
          {status.gapCount !== null && (
            <div>
              <span className="text-white/45">Open gaps </span>
              <span className="font-mono font-semibold text-white">{status.gapCount}</span>
            </div>
          )}
          {status.order && (
            <div>
              <span className="text-white/45">Report </span>
              <span className="font-mono font-semibold text-white">{status.order.reference}</span>
            </div>
          )}
        </div>
      </div>

      {/* Next step */}
      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-brand-300">
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            Your next step
          </p>
          <p className="font-semibold text-white">{status.nextStep.title}</p>
          <p className="mt-0.5 text-sm text-white/60">{status.nextStep.detail}</p>
        </div>
        {status.nextStep.action && (
          <Link
            href={status.nextStep.action.href}
            className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            {status.nextStep.action.label}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </div>

      {/* How to fix (top gaps) */}
      {status.topGaps.length > 0 && (
        <div className="border-t border-white/[0.06] p-6">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-white/50">
            <Wrench className="h-3.5 w-3.5" aria-hidden />
            Where to focus — highest-impact gaps
          </p>
          <ul className="space-y-2">
            {status.topGaps.slice(0, 3).map((gap) => (
              <li
                key={gap.controlId}
                className="flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
              >
                <span className="font-mono text-sm font-semibold text-brand-300">{gap.controlId}</span>
                <span className="text-sm text-white/80">{gap.title}</span>
                <span className="w-full text-xs text-white/50">
                  {gap.fix} · ~{gap.hours}h · −{Math.abs(gap.deduction)} SPRS
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Still needed */}
      {status.needed.length > 0 && (
        <div className="border-t border-white/[0.06] p-6">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-white/50">
            <ListChecks className="h-3.5 w-3.5" aria-hidden />
            Still needed
          </p>
          <ul className="space-y-1.5">
            {status.needed.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-white/70">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-white/40" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
