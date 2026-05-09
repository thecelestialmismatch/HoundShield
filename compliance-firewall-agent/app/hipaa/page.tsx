"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  ArrowRight,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Scan,
  FileText,
  Lock,
  Activity,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { ScrollProgressBar } from "@/components/scroll-effects";

function FadeIn({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const PHI_IDENTIFIERS = [
  "Patient names",
  "Geographic data (street, city, zip)",
  "Dates (DOB, admission, discharge)",
  "Phone & fax numbers",
  "Email addresses",
  "Social Security Numbers",
  "Medical record numbers (MRN)",
  "Health plan beneficiary IDs",
  "Account numbers",
  "Certificate/license numbers",
  "Vehicle identifiers (VIN)",
  "Device identifiers & serials",
  "URLs & IP addresses",
  "Biometric identifiers",
  "Full-face photographs",
  "Medicare/Medicaid IDs",
  "Encounter/visit IDs",
  "Any unique identifying number",
];

const FEATURES = [
  {
    icon: Scan,
    title: "Real-Time PHI Scanning",
    desc: "Intercept every AI query before it leaves your network. Detect all 18 HIPAA Safe Harbor identifiers in <50ms.",
  },
  {
    icon: Lock,
    title: "Block Before It Leaks",
    desc: "Automatically quarantine or block prompts containing PHI. AES-256 encrypted quarantine vault for review.",
  },
  {
    icon: FileText,
    title: "HIPAA Control Mapping",
    desc: "Map your AI security posture to all 18 HIPAA Security Rule controls. Generate audit-ready compliance reports.",
  },
  {
    icon: Activity,
    title: "Tamper-Proof Audit Trail",
    desc: "SHA-256 hash chain + blockchain anchoring on Base L2. Every AI interaction logged with immutable evidence.",
  },
];

export default function HIPAAPage() {
  return (
    <div className="bg-[#0a0a0a] min-h-screen relative">
      <ScrollProgressBar />
      <Navbar variant="dark" />

      {/* ── Hero ──────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center overflow-hidden pt-24 pb-20">
        <div className="absolute inset-0 bg-dot-grid opacity-[0.15] pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              HIPAA Security Rule · 45 CFR Part 164 · Healthcare AI Compliance
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-editorial text-[clamp(36px,6vw,72px)] font-bold leading-[1.05] tracking-[-1px] max-w-[900px] mx-auto mb-6 text-white"
          >
            AI Compliance Firewall for{" "}
            <span className="italic bg-gradient-to-r from-emerald-400 via-brand-400 to-emerald-400 bg-clip-text text-transparent">
              Healthcare
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[clamp(16px,2vw,20px)] text-slate-400 max-w-[640px] mx-auto mb-10 leading-relaxed"
          >
            Stop PHI from leaking into ChatGPT, Microsoft Copilot, and Claude.
            HIPAA-compliant AI monitoring starting free.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
          >
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(16,185,129,0.35)] text-base"
            >
              Scan Your AI Risk Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/[0.06] hover:bg-white/[0.10] text-white font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all hover:-translate-y-0.5 text-base"
            >
              See a Live Demo
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-8 md:gap-12"
          >
            {[
              { num: "$100–$50K", label: "fine per HIPAA violation" },
              { num: "$1.9M", label: "annual penalty cap" },
              { num: "800K+", label: "healthcare practices using AI" },
              { num: "<50ms", label: "Hound Shield intercept latency" },
            ].map(({ num, label }) => (
              <div key={label} className="text-center">
                <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-1">
                  {num}
                </div>
                <div className="text-sm text-slate-400">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Problem ───────────────────────────────── */}
      <section className="py-24 md:py-32 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-widest mb-4">
              <AlertTriangle className="w-3.5 h-3.5" />
              The Problem
            </div>
            <h2 className="text-[clamp(28px,4vw,48px)] font-editorial font-bold tracking-tight leading-[1.1] text-white mb-4">
              Your team is using AI tools.{" "}
              <span className="italic text-red-400">HIPAA doesn&apos;t care.</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-[580px] mx-auto">
              Every time a clinician pastes patient notes into ChatGPT, your organization faces a potential breach.
              HIPAA violations don&apos;t require intent — they require exposure.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                stat: "$100–$50,000",
                label: "per violation",
                detail: "Tier 1–4 penalties under the HITECH Act. Willful neglect without correction = $50K per incident.",
              },
              {
                stat: "$1.9M",
                label: "avg data breach cost",
                detail: "Average cost of a healthcare data breach in 2025. Highest of any industry for 14 consecutive years.",
              },
              {
                stat: "0",
                label: "AI compliance tools exist",
                detail: "No HIPAA-specific tool monitors AI usage in real-time. Until Hound Shield.",
              },
            ].map(({ stat, label, detail }, i) => (
              <FadeIn key={label} delay={i * 0.1}>
                <div className="glass-card rounded-xl p-7">
                  <div className="text-3xl font-extrabold text-white mb-1">{stat}</div>
                  <div className="text-sm font-semibold text-red-400 mb-3 uppercase tracking-wider">{label}</div>
                  <p className="text-sm text-slate-400 leading-relaxed">{detail}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Solution — How Hound Shield Works ─────────── */}
      <section className="py-24 md:py-32 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn className="text-center mb-16">
            <div className="inline-flex justify-center text-xs font-bold uppercase tracking-[0.2em] text-brand-400 mb-4">
              How It Works
            </div>
            <h2 className="text-[clamp(28px,4vw,48px)] font-editorial font-bold tracking-tight leading-[1.1] text-white mb-4">
              Intercept. Classify. Protect.
            </h2>
            <p className="text-lg text-slate-400 max-w-[560px] mx-auto">
              Hound Shield sits between your workforce and every AI tool — scanning for PHI in real-time before it ever leaves your environment.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.08}>
                <div className="glass-card rounded-xl p-7 flex gap-5">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-400/10 flex items-center justify-center">
                    <f.icon className="w-6 h-6 text-brand-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── 18 PHI Identifiers ─────────────────── */}
      <section className="py-24 md:py-32 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn className="text-center mb-16">
            <div className="inline-flex justify-center text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-4">
              Complete Coverage
            </div>
            <h2 className="text-[clamp(28px,4vw,48px)] font-editorial font-bold tracking-tight leading-[1.1] text-white mb-4">
              All 18 HIPAA Safe Harbor Identifiers
            </h2>
            <p className="text-lg text-slate-400 max-w-[560px] mx-auto">
              Hound Shield detects every PHI category defined in 45 CFR §164.514(b)(2) — the standard for de-identification.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PHI_IDENTIFIERS.map((id, i) => (
              <FadeIn key={id} delay={i * 0.03}>
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-slate-300">{id}</span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing CTA ────────────────────────── */}
      <section className="py-24 md:py-32 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <FadeIn>
            <Shield className="w-14 h-14 mx-auto text-emerald-400 mb-6" />
            <h2 className="text-[clamp(28px,4vw,44px)] font-editorial font-bold tracking-tight leading-[1.1] text-white mb-4">
              Start protecting PHI today
            </h2>
            <p className="text-lg text-slate-400 max-w-[480px] mx-auto mb-8">
              Free tier includes PHI scanning, basic risk assessment, and HIPAA control mapping. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(16,185,129,0.35)] text-base"
              >
                Scan Your AI Risk Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/[0.06] hover:bg-white/[0.10] text-white font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all text-base"
              >
                View Pricing
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
