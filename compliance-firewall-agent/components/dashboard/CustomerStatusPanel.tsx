"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Wrench,
  ListChecks,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
} from "lucide-react";
import { buildLocalCustomerStatus, computeSprsInput } from "@/lib/customer/client-status";
import type { CustomerStatus, OrderSummary, StandingLevel } from "@/lib/customer/status";
import type { StatusTrend } from "@/lib/customer/snapshot";

/** Per-standing accent palette (light "Steel & Cream" shell). Colourful chips
 *  with -700 text on a soft tint so status reads at a glance on white. */
const LEVEL: Record<
  StandingLevel,
  { ring: string; chip: string; glow: string; label: string }
> = {
  excellent: { ring: "#059669", chip: "text-emerald-700 bg-emerald-500/10 border-emerald-500/30", glow: "rgba(5,150,105,0.16)", label: "Assessment-ready" },
  good: { ring: "#16a34a", chip: "text-green-700 bg-green-500/10 border-green-500/25", glow: "rgba(22,163,74,0.14)", label: "On track" },
  fair: { ring: "#d97706", chip: "text-amber-700 bg-amber-500/10 border-amber-500/25", glow: "rgba(217,119,6,0.14)", label: "Making progress" },
  poor: { ring: "#ea580c", chip: "text-orange-700 bg-orange-500/10 border-orange-500/25", glow: "rgba(234,88,12,0.14)", label: "Needs attention" },
  critical: { ring: "#dc2626", chip: "text-red-700 bg-red-500/10 border-red-500/25", glow: "rgba(220,38,38,0.16)", label: "Urgent" },
  unknown: { ring: "#5A86A8", chip: "text-slate-600 bg-slate-500/10 border-slate-500/20", glow: "rgba(90,134,168,0.12)", label: "Getting started" },
};

const SPRS_MIN = -203;
const SPRS_MAX = 110;

function ringFraction(score: number | null): number {
  if (score === null || !Number.isFinite(score)) return 0;
  return Math.min(1, Math.max(0, (score - SPRS_MIN) / (SPRS_MAX - SPRS_MIN)));
}

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Circular SPRS gauge (SVG, no deps — safe on the SSR-averse dashboard). */
function SprsRing({ score, color }: { score: number | null; color: string }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const frac = ringFraction(score);
  return (
    <div className="relative h-24 w-24 flex-shrink-0" aria-hidden>
      <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(15,30,46,0.10)" strokeWidth="7" />
        <circle
          cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - frac)}
          style={{ transition: "stroke-dashoffset 700ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-xl font-bold text-white leading-none">
          {score === null ? "—" : score}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-white/40">SPRS</span>
      </div>
    </div>
  );
}

function TrendChip({ trend }: { trend: StatusTrend }) {
  if (trend.direction === "none" || trend.sprsDelta === null) return null;
  const up = trend.direction === "up";
  const flat = trend.direction === "flat";
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
  const cls = flat
    ? "text-white/50 bg-white/5 border-white/10"
    : up
      ? "text-emerald-700 bg-emerald-500/10 border-emerald-500/30"
      : "text-orange-700 bg-orange-500/10 border-orange-500/30";
  const sign = trend.sprsDelta > 0 ? "+" : "";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {flat ? "No change" : `${sign}${trend.sprsDelta} SPRS`}
      {trend.since ? <span className="text-white/40">· since {fmtDate(trend.since)}</span> : null}
    </span>
  );
}

/**
 * After-login status panel — brighter, colourful, information-dense, mobile-first.
 * SPRS/readiness is computed client-side from local assessment data; account
 * status + first name come from /api/customer/status; a snapshot POST returns the
 * trend versus last visit (all consent-gated server-side). Greets by the user's
 * OWN name — never a sample org, never another account.
 */
export function CustomerStatusPanel() {
  const [status, setStatus] = useState<CustomerStatus | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [trend, setTrend] = useState<StatusTrend | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await fetch("/api/customer/status");
        const data = res.ok ? await res.json() : { status: null, firstName: null };
        if (!active) return;
        setFirstName(data?.firstName ?? null);
        const account = {
          tier: data?.status?.tier ?? "free",
          latestOrder: (data?.status?.order as OrderSummary | null) ?? null,
        };
        setStatus(buildLocalCustomerStatus(account));
      } catch {
        if (active) setStatus(buildLocalCustomerStatus({ tier: "free", latestOrder: null }));
      } finally {
        if (active) setLoaded(true);
      }

      // Record a snapshot (server enforces consent) and surface the trend.
      try {
        const snap = await fetch("/api/customer/status/snapshot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sprs: computeSprsInput() }),
        });
        if (snap.ok && active) {
          const sd = await snap.json();
          if (sd?.trend) setTrend(sd.trend as StatusTrend);
        }
      } catch {
        /* trend is a bonus — never block the panel */
      }
    })();

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

  const lvl = LEVEL[status.standingLevel] ?? LEVEL.unknown;
  const greeting = firstName ? `Welcome back, ${firstName}` : "Welcome back";
  const pct = status.completionPercent ?? 0;

  const tiles = [
    { label: "SPRS score", value: status.sprsScore === null ? "—" : String(status.sprsScore), sub: status.sprsLabel },
    { label: "Assessed", value: status.completionPercent === null ? "—" : `${status.completionPercent}%`, sub: "of 110 controls" },
    { label: "Open gaps", value: status.gapCount === null ? "—" : String(status.gapCount), sub: "to remediate" },
    { label: "Plan", value: status.tier.charAt(0).toUpperCase() + status.tier.slice(1), sub: status.order ? status.order.reference : "no report yet" },
  ];

  return (
    <section
      className="mb-6 overflow-hidden rounded-2xl border border-[var(--hs-border-ink)] bg-gradient-to-br from-white to-[#EDF3F9]"
      style={{ boxShadow: `0 10px 40px -24px ${lvl.glow}` }}
    >
      {/* Header: greeting + ring + standing */}
      <div className="flex flex-col gap-5 border-b border-white/[0.06] p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
        <SprsRing score={status.sprsScore} color={lvl.ring} />
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h2 className="flex items-center gap-2 text-lg font-bold text-white sm:text-xl">
              <Sparkles className="h-4 w-4 text-brand-400" aria-hidden />
              {greeting}
            </h2>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${lvl.chip}`}>
              {status.stageLabel}
            </span>
            {trend ? <TrendChip trend={trend} /> : null}
          </div>
          <p className="text-sm leading-relaxed text-white/70 sm:text-base">{status.standing}</p>
          {/* Completion progress bar */}
          {status.completionPercent !== null && (
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-[11px] text-white/40">
                <span>Assessment progress</span>
                <span className="font-mono">{pct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${lvl.ring}, #f59e0b)`, transition: "width 700ms ease" }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stat tiles — 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 gap-px bg-[var(--hs-border-ink)] sm:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="bg-white p-4">
            <p className="text-[11px] uppercase tracking-wide text-white/40">{t.label}</p>
            <p className="mt-1 font-mono text-xl font-bold text-white">{t.value}</p>
            <p className="truncate text-[11px] text-white/40">{t.sub}</p>
          </div>
        ))}
      </div>

      {/* Next step — the hero CTA */}
      <div className="flex flex-col gap-4 border-t border-white/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            Your next step
          </p>
          <p className="font-semibold text-white">{status.nextStep.title}</p>
          <p className="mt-0.5 text-sm text-white/60">{status.nextStep.detail}</p>
        </div>
        {status.nextStep.action && (
          <Link
            href={status.nextStep.action.href}
            className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-transform hover:scale-[1.02] active:scale-95"
          >
            {status.nextStep.action.label}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </div>

      {/* How to fix — top gaps */}
      {status.topGaps.length > 0 && (
        <div className="border-t border-white/[0.06] p-5 sm:p-6">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/50">
            <Wrench className="h-3.5 w-3.5 text-amber-400" aria-hidden />
            Where to focus — highest-impact gaps
          </p>
          <ul className="space-y-2">
            {status.topGaps.slice(0, 3).map((gap) => (
              <li key={gap.controlId} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-mono text-sm font-bold text-brand-700">{gap.controlId}</span>
                  <span className="text-sm text-white/85">{gap.title}</span>
                  <span className="ml-auto rounded-md bg-red-500/10 px-2 py-0.5 font-mono text-[11px] text-red-600">
                    −{Math.abs(gap.deduction)} SPRS
                  </span>
                </div>
                <p className="mt-1 text-xs text-white/50">{gap.fix} · ~{gap.hours}h</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Still needed */}
      {status.needed.length > 0 && (
        <div className="border-t border-white/[0.06] p-5 sm:p-6">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/50">
            <ListChecks className="h-3.5 w-3.5 text-brand-400" aria-hidden />
            Still needed
          </p>
          <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {status.needed.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-white/70">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-400" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
