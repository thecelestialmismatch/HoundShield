"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
        {/* Urgency badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-500/20 bg-red-500/[0.08] text-red-400 text-xs font-semibold uppercase tracking-widest mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          CMMC Enforcement: November 2026
        </div>

        <h2 className="text-[clamp(32px,5vw,56px)] font-editorial font-bold tracking-tight leading-[1.1] text-white max-w-[720px] mx-auto mb-5">
          Your compliance audit is coming.
          <br />
          <span className="italic text-brand-400">Are you ready?</span>
        </h2>
        <p className="text-lg text-slate-400 max-w-[500px] mx-auto mb-10">
          Get your free SPRS score in 10 minutes. No credit card, no sales call, no consultant required.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-10 py-4.5 bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(200,125,62,0.35)] text-lg"
          >
            Start your free assessment
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
          Free forever plan available \u00b7 No credit card required \u00b7 SOC 2 compliant infrastructure
        </p>
      </div>
    </section>
  );
}
