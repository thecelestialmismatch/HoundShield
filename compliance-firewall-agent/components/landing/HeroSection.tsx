"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronRight, Shield, Activity, Lock } from "lucide-react";

function FadeIn({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

type Vertical = "defense" | "healthcare" | "technology";

const VERTICALS: Record<
  Vertical,
  {
    pill: string;
    icon: typeof Shield;
    badge: string;
    headline: React.ReactNode;
    sub: string;
    cta: string;
    ctaHref: string;
    trustBar: string[];
    stats: { num: string; label: string }[];
  }
> = {
  defense: {
    pill: "Defense",
    icon: Shield,
    badge: "CMMC Level 2 · NIST 800-171 · 87,000+ DIB Contractors",
    headline: (
      <>
        Your team is one ChatGPT session away from a{" "}
        <span className="italic bg-gradient-to-r from-brand-400 via-accent to-emerald-400 bg-clip-text text-transparent">
          CMMC violation.
        </span>
      </>
    ),
    sub: "Kaelus.online intercepts every AI query before it leaves your network. Protect CUI. Pass your C3PAO assessment. Keep your DoD contracts.",
    cta: "Start Free Assessment",
    ctaHref: "/command-center/shield/onboarding",
    trustBar: ["CMMC Level 2", "NIST SP 800-171", "Real-time Protection", "<50ms Latency"],
    stats: [
      { num: "80,000+", label: "DIB contractors must certify" },
      { num: "0.5%", label: "certified today" },
      { num: "$76K", label: "avg C3PAO assessment cost" },
      { num: "<50ms", label: "Kaelus intercept latency" },
    ],
  },
  healthcare: {
    pill: "Healthcare",
    icon: Activity,
    badge: "HIPAA Security Rule · 45 CFR Part 164 · PHI Protection",
    headline: (
      <>
        Your clinicians are pasting PHI into{" "}
        <span className="italic bg-gradient-to-r from-emerald-400 via-brand-400 to-emerald-400 bg-clip-text text-transparent">
          ChatGPT right now.
        </span>
      </>
    ),
    sub: "Kaelus.online intercepts every AI query before it leaves your network. Block PHI leaks. Pass HIPAA audits. Avoid $1.9M penalties.",
    cta: "Scan Your AI Risk Free",
    ctaHref: "/hipaa",
    trustBar: ["HIPAA Compliant", "18 PHI Identifiers", "Real-time Scanning", "<50ms Latency"],
    stats: [
      { num: "$1.9M", label: "avg healthcare breach cost" },
      { num: "800K+", label: "practices using AI" },
      { num: "$50K", label: "per HIPAA violation" },
      { num: "<50ms", label: "Kaelus intercept latency" },
    ],
  },
  technology: {
    pill: "Technology",
    icon: Lock,
    badge: "SOC 2 · AI Governance · IP & Source Code Protection",
    headline: (
      <>
        Your engineers are leaking{" "}
        <span className="italic bg-gradient-to-r from-brand-400 via-emerald-400 to-brand-400 bg-clip-text text-transparent">
          source code to AI.
        </span>
      </>
    ),
    sub: "Kaelus.online intercepts every AI query before it leaves your network. Protect IP, API keys, and proprietary code. Stay SOC 2 compliant.",
    cta: "Start Free Assessment",
    ctaHref: "/signup",
    trustBar: ["SOC 2 Ready", "PII Detection", "IP Protection", "<50ms Latency"],
    stats: [
      { num: "$4.5M", label: "avg data breach cost" },
      { num: "92%", label: "of devs use AI tools daily" },
      { num: "40%", label: "paste proprietary code" },
      { num: "<50ms", label: "Kaelus intercept latency" },
    ],
  },
};

export function HeroSection() {
  const [active, setActive] = useState<Vertical>("defense");
  const v = VERTICALS[active];

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden pt-24 pb-20">
      {/* Background effects */}
      <div className="absolute inset-0 bg-dot-grid opacity-[0.15] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        {/* Vertical selector pills */}
        <FadeIn>
          <div className="flex items-center justify-center gap-2 mb-8">
            {(Object.keys(VERTICALS) as Vertical[]).map((key) => {
              const Icon = VERTICALS[key].icon;
              const isActive = key === active;
              return (
                <button
                  key={key}
                  onClick={() => setActive(key)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-widest transition-all ${
                    isActive
                      ? "bg-brand-400/20 text-brand-400 border border-brand-400/30"
                      : "bg-white/[0.04] text-slate-500 border border-white/[0.06] hover:text-slate-300 hover:bg-white/[0.08]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {VERTICALS[key].pill}
                </button>
              );
            })}
          </div>
        </FadeIn>

        {/* Badge */}
        <FadeIn delay={0.05}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-400/20 bg-brand-400/[0.08] text-brand-400 text-xs font-semibold uppercase tracking-widest mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {v.badge}
          </div>
        </FadeIn>

        {/* Main headline — AI Compliance Firewall */}
        <FadeIn delay={0.1}>
          <h1 className="font-editorial text-[clamp(40px,6.5vw,82px)] font-bold leading-[1.05] tracking-[-1px] max-w-[900px] mx-auto mb-3 text-white">
            AI Compliance Firewall
          </h1>
        </FadeIn>

        {/* Vertical-specific subheadline */}
        <AnimatePresence mode="wait">
          <motion.h2
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="font-editorial text-[clamp(22px,3.5vw,40px)] font-bold leading-[1.15] tracking-[-0.5px] max-w-[800px] mx-auto mb-6 text-white"
          >
            {v.headline}
          </motion.h2>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.p
            key={`sub-${active}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-[clamp(16px,2vw,20px)] text-slate-400 max-w-[620px] mx-auto mb-10 leading-relaxed"
          >
            {v.sub}
          </motion.p>
        </AnimatePresence>

        <FadeIn delay={0.3}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href={v.ctaHref}
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(200,125,62,0.35)] text-base"
            >
              {v.cta}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/[0.06] hover:bg-white/[0.10] text-white font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all hover:-translate-y-0.5 text-base"
            >
              See a Live Demo
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </FadeIn>

        {/* Trust bar */}
        <FadeIn delay={0.38}>
          <div className="flex flex-wrap items-center justify-center gap-6 mb-14 text-xs text-slate-500 uppercase tracking-widest font-semibold">
            {v.trustBar.map((item, i) => (
              <span key={item} className="flex items-center gap-2">
                {i > 0 && <span className="w-1 h-1 rounded-full bg-white/20" />}
                {item}
              </span>
            ))}
          </div>
        </FadeIn>

        {/* Stats */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`stats-${active}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-8 md:gap-12"
          >
            {v.stats.map(({ num, label }) => (
              <div key={label} className="text-center">
                <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-1">
                  {num}
                </div>
                <div className="text-sm text-slate-400">{label}</div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
