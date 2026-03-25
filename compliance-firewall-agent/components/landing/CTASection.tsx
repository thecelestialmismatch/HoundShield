"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="relative py-32 text-center overflow-hidden bg-[#07070b]">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(200,125,62,0.12) 0%, transparent 70%)" }} />

      <div className="relative z-10 max-w-3xl mx-auto px-6">
        <h2 className="text-[clamp(32px,5vw,56px)] font-editorial font-bold tracking-tight leading-[1.1] text-white max-w-[720px] mx-auto mb-5">
          Your CMMC audit is coming.
          <br />
          <span className="italic text-brand-400">Are you ready?</span>
        </h2>
        <p className="text-lg text-slate-400 max-w-[480px] mx-auto mb-10">
          Get your free SPRS score in 10 minutes. No credit card, no sales call, no consultant required.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 px-10 py-5 bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(200,125,62,0.35)] text-lg"
        >
          Start your free assessment
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </section>
  );
}
