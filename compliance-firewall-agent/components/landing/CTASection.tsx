"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const DEADLINES = [
  { label: "CMMC", deadline: "Nov 2026", color: "text-amber-400" },
  { label: "HIPAA", deadline: "Active now", color: "text-emerald-400" },
  { label: "SOC 2", deadline: "Active now", color: "text-indigo-400" },
];

export function CTASection() {
  return (
    <section className="relative py-32 text-center overflow-hidden">
      {/* Multi-layer gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 30% 70%, rgba(200,125,62,0.06) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 70% 30%, rgba(16,185,129,0.04) 0%, transparent 50%)",
        }}
      />

      {/* Grid overlay for texture */}
      <div className="absolute inset-0 bg-dot-grid opacity-[0.04] pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-6">
        {/* Framework deadline badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {DEADLINES.map(({ label, deadline, color }) => (
            <div
              key={label}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-xs font-semibold uppercase tracking-wider"
            >
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${color.replace("text-", "bg-")}`} />
              <span className="text-slate-400">{label}</span>
              <span className={`font-bold ${color}`}>{deadline}</span>
            </div>
          ))}
        </div>

        <h2 className="text-[clamp(32px,5vw,56px)] font-editorial font-bold tracking-tight leading-[1.1] text-white max-w-[720px] mx-auto mb-5">
          Your compliance audit is coming.
          <br />
          <span className="italic text-brand-400">All frameworks. One platform.</span>
        </h2>
        <p className="text-lg text-slate-400 max-w-[540px] mx-auto mb-10">
          Get protected across SOC 2, HIPAA, and CMMC Level 2 in one 15-minute deployment. No consultant required. No switching between tools.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-10 py-4 bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(200,125,62,0.35)] text-lg"
          >
            Start free — all frameworks included
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white/[0.06] hover:bg-white/[0.10] text-white font-medium rounded-xl border border-white/10 hover:border-white/20 transition-all text-base"
          >
            Watch demo
          </Link>
        </div>

        {/* Trust line */}
        <p className="mt-8 text-sm text-slate-600">
          Free forever plan available · No credit card required · SOC 2 + HIPAA + CMMC in one deployment
        </p>
      </div>
    </section>
  );
}
