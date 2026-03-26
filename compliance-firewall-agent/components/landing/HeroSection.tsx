"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronRight, Lock, Activity, Shield } from "lucide-react";
import { TechDashboard } from "./TechDashboard";
import { HealthcareDashboard } from "./HealthcareDashboard";
import { DefenseDashboard } from "./DefenseDashboard";

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

// Technology first → Healthcare → Defense (defense of contractors last)
type Vertical = "technology" | "healthcare" | "defense";

const VERTICALS: Record<
  Vertical,
  {
    pill: string;
    icon: typeof Lock;
    badge: string;
    headline: React.ReactNode;
    sub: string;
    cta: string;
    ctaHref: string;
    trustBar: string[];
    accentColor: string;
    dashboard: React.ComponentType;
  }
> = {
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
    trustBar: ["SOC 2 Ready", "PII Detection", "IP Protection", "<10ms Latency"],
    accentColor: "brand-400",
    dashboard: TechDashboard,
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
    trustBar: ["HIPAA Compliant", "18 PHI Identifiers", "Real-time Scanning", "<10ms Latency"],
    accentColor: "emerald-400",
    dashboard: HealthcareDashboard,
  },
  defense: {
    pill: "Defense",
    icon: Shield,
    badge: "CMMC Level 2 · NIST 800-171 · 87,000+ DIB Contractors",
    headline: (
      <>
        Your team is one ChatGPT session away from a{" "}
        <span className="italic bg-gradient-to-r from-amber-400 via-brand-400 to-amber-400 bg-clip-text text-transparent">
          CMMC violation.
        </span>
      </>
    ),
    sub: "Kaelus.online intercepts every AI query before it leaves your network. Protect CUI. Pass your C3PAO assessment. Keep your DoD contracts.",
    cta: "Start Free Assessment",
    ctaHref: "/command-center/shield/onboarding",
    trustBar: ["CMMC Level 2", "NIST SP 800-171", "Real-time Protection", "<10ms Latency"],
    accentColor: "brand-400",
    dashboard: DefenseDashboard,
  },
};

export function HeroSection() {
  const [active, setActive] = useState<Vertical>("technology");
  const v = VERTICALS[active];
  const DashboardComponent = v.dashboard;

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-20 pb-16">
      {/* Layered background */}
      <div className="absolute inset-0 bg-dot-grid opacity-[0.07] pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% -5%, rgba(245,200,66,0.07) 0%, transparent 65%), radial-gradient(ellipse 45% 45% at 85% 85%, rgba(16,185,129,0.04) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── Left column: Copy ───────────────────────────────── */}
          <div>
            {/* Vanta-style tab strip */}
            <FadeIn>
              <div className="inline-flex items-center gap-1 p-1 mb-7 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                {(Object.keys(VERTICALS) as Vertical[]).map((key) => {
                  const Icon = VERTICALS[key].icon;
                  const isActive = key === active;
                  return (
                    <button
                      key={key}
                      onClick={() => setActive(key)}
                      className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-widest transition-all duration-200 ${
                        isActive
                          ? "bg-white/[0.08] text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="tab-bg"
                          className="absolute inset-0 rounded-lg bg-white/[0.08]"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                        />
                      )}
                      <Icon className={`relative w-3.5 h-3.5 ${isActive ? "text-brand-400" : ""}`} />
                      <span className="relative">{VERTICALS[key].pill}</span>
                    </button>
                  );
                })}
              </div>
            </FadeIn>

            {/* Badge */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`badge-${active}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-400/20 bg-brand-400/[0.07] text-brand-400 text-xs font-semibold uppercase tracking-widest mb-6"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {v.badge}
              </motion.div>
            </AnimatePresence>

            {/* Main headline — fixed */}
            <FadeIn delay={0.05}>
              <h1 className="font-editorial text-[clamp(36px,5vw,64px)] font-bold leading-[1.05] tracking-[-1px] mb-2 text-white">
                AI Compliance Firewall
              </h1>
            </FadeIn>

            {/* Vertical-specific subheadline */}
            <AnimatePresence mode="wait">
              <motion.h2
                key={`h2-${active}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.35, ease: [0.25, 0.4, 0.25, 1] }}
                className="font-editorial text-[clamp(20px,3vw,32px)] font-bold leading-[1.15] tracking-[-0.5px] mb-4 text-white"
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
                transition={{ duration: 0.28 }}
                className="text-[clamp(15px,1.8vw,18px)] text-slate-400 max-w-[520px] mb-8 leading-relaxed"
              >
                {v.sub}
              </motion.p>
            </AnimatePresence>

            {/* CTAs */}
            <FadeIn delay={0.25}>
              <div className="flex flex-col sm:flex-row items-start gap-3 mb-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`cta-${active}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Link
                      href={v.ctaHref}
                      className="inline-flex items-center gap-2 px-7 py-3.5 bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(200,125,62,0.4)] text-sm"
                    >
                      {v.cta}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </motion.div>
                </AnimatePresence>
                <Link
                  href="/demo"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/[0.05] hover:bg-white/[0.09] text-white font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all hover:-translate-y-0.5 text-sm"
                >
                  See a Live Demo
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </FadeIn>

            {/* Trust bar */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`trust-${active}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-wrap items-center gap-5 text-[11px] text-slate-500 uppercase tracking-widest font-semibold"
              >
                {v.trustBar.map((item, i) => (
                  <span key={item} className="flex items-center gap-2">
                    {i > 0 && <span className="w-1 h-1 rounded-full bg-white/20" />}
                    {item}
                  </span>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Right column: Live Dashboard (changes per vertical) ── */}
          <div className="hidden lg:block">
            <AnimatePresence mode="wait">
              <motion.div
                key={`dashboard-${active}`}
                initial={{ opacity: 0, x: 24, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -24, scale: 0.98 }}
                transition={{ duration: 0.45, ease: [0.25, 0.4, 0.25, 1] }}
              >
                <DashboardComponent />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile: dashboard below copy */}
        <div className="mt-10 lg:hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={`mobile-dashboard-${active}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <DashboardComponent />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
