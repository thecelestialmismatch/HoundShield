"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ScrollProgressBar } from "@/components/scroll-effects";
import {
  Shield,
  HeartPulse,
  Lock,
  ArrowRight,
  Terminal,
  FileCheck,
  Eye,
  Zap,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { TextLogo } from "@/components/TextLogo";
import { HeroSection } from "@/components/landing/HeroSection";

/* ── Fade-in wrapper (same as features/about pages) ─────── */
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
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Data ─────────────────────────────────────────────────── */
const steps = [
  {
    number: "01",
    title: "Change one URL",
    desc: "Replace api.openai.com with proxy.houndshield.com in your environment config. Works with ChatGPT, Copilot, Claude, Gemini — any OpenAI-compatible tool. No code changes, no agents to install.",
    code: "OPENAI_BASE_URL=https://proxy.houndshield.com",
    icon: Terminal,
  },
  {
    number: "02",
    title: "Hound Shield scans every prompt",
    desc: "16 detection engines check each request against CMMC, HIPAA, and SOC 2 patterns in under 10ms. Your team doesn't notice anything different. The models don't know.",
    icon: Eye,
  },
  {
    number: "03",
    title: "You get a compliance log",
    desc: "Every scan is recorded with a timestamp, matched pattern, and the framework it triggered. Tamper-proof SHA-256 signed logs. Exportable for your C3PAO or auditor on demand.",
    icon: FileCheck,
  },
];

const proofCards = [
  {
    badge: "CMMC Level 2",
    stat: "SPRS: −203 to 110",
    icon: Shield,
    color: "text-brand-400",
    bg: "bg-brand-500/10 border-brand-500/20",
    title: "Know your SPRS score before your assessor does.",
    body: "We map all 110 NIST SP 800-171 Rev 2 controls to your actual AI usage. Every blocked prompt records which control it affects. Your SPRS score updates in real time.",
  },
  {
    badge: "HIPAA",
    stat: "18 PHI identifiers",
    icon: HeartPulse,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    title: "Every patient identifier blocked before it reaches the model.",
    body: "Names, SSNs, MRNs, dates of birth, device IDs, IP addresses, and 12 more. If a prompt contains PHI, Hound Shield quarantines it and logs the event. You set the policy; Hound Shield enforces it.",
  },
  {
    badge: "SOC 2 Type II",
    stat: "SHA-256 signed",
    icon: Lock,
    color: "text-brand-400",
    bg: "bg-brand-500/10 border-brand-500/20",
    title: "An audit trail that holds up in court.",
    body: "Every AI prompt stored in an append-only log with a SHA-256 integrity hash. Your auditors get read-only access. No manual exports, no spreadsheets, no guessing what your team sent.",
  },
];

const featureStrip = [
  { icon: Eye,       color: "text-brand-400",  bg: "bg-brand-500/10 border-brand-500/20",   label: "AI Prompt Interception", desc: "Every LLM request inspected before it leaves the network" },
  { icon: Zap,       color: "text-brand-400",  bg: "bg-brand-500/10 border-brand-500/20",    label: "16 Detection Engines",   desc: "CUI, PII, IP, PHI, secrets, CAGE codes, clearances — all matched" },
  { icon: FileCheck, color: "text-emerald-400",bg: "bg-emerald-500/10 border-emerald-500/20",label: "Immutable Audit Trail",  desc: "SHA-256 tamper-evident logs ready for any compliance audit" },
  { icon: Terminal,  color: "text-brand-400", bg: "bg-brand-500/10 border-brand-500/20",  label: "One Proxy URL Deploy",   desc: "Works with ChatGPT, Copilot, Claude, Gemini — all simultaneously" },
];

/* ── Page ─────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
      <ScrollProgressBar />
      <Navbar variant="dark" />

      {/* ── Hero — 2-col with live dashboard ───────────────── */}
      <HeroSection />

      {/* ── How it works ───────────────────────────────────── */}
      <section className="py-20 px-6 bg-[#0a0a12]">
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.2em] text-brand-500 font-semibold mb-3">
              Setup
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Set up in five minutes.
            </h2>
            <p className="text-slate-400 mt-3 max-w-lg mx-auto">
              Point your AI tools at a proxy URL. That&apos;s the whole installation. No firewall
              rules, no network changes, no IT ticket required.
            </p>
          </FadeIn>
          <div className="grid sm:grid-cols-3 gap-5">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <FadeIn key={s.number} delay={i * 0.08}>
                  <div className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl p-6 h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xs font-mono font-bold text-brand-500">{s.number}</span>
                      <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-brand-500" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed mb-3">{s.desc}</p>
                    {s.code && (
                      <code className="block text-xs font-mono bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-brand-500 break-all">
                        {s.code}
                      </code>
                    )}
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Compliance proof ───────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.2em] text-brand-500 font-semibold mb-3">
              Compliance
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Real numbers, not marketing claims.
            </h2>
          </FadeIn>
          <div className="grid sm:grid-cols-3 gap-6">
            {proofCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <FadeIn key={card.badge} delay={i * 0.08}>
                  <div className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl p-7 h-full">
                    <div className="flex items-center justify-between mb-5">
                      <div className={`w-10 h-10 rounded-xl ${card.bg} border flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${card.color}`} />
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-400 bg-white/10 px-2.5 py-1 rounded-md">
                        {card.stat}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest mb-2">
                      {card.badge}
                    </p>
                    <h3 className="text-base font-semibold text-white mb-3 leading-[1.3]">
                      {card.title}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{card.body}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
          <FadeIn delay={0.2} className="text-center mt-8">
            <Link
              href="/features"
              className="inline-flex items-center gap-2 text-sm text-brand-500 hover:text-brand-400 transition-colors cursor-pointer"
            >
              See all 16 detection patterns <ArrowRight className="w-4 h-4" />
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── Feature strip ──────────────────────────────────── */}
      <section className="py-16 px-6 bg-[#0a0a12]">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featureStrip.map((f, i) => {
              const Icon = f.icon;
              return (
                <FadeIn key={f.label} delay={i * 0.06}>
                  <div className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl p-5 h-full hover:border-brand-400/20 hover:bg-white/[0.08] transition-all duration-200 group cursor-pointer">
                    <div className={`w-10 h-10 rounded-xl ${f.bg} border flex items-center justify-center mb-4`}>
                      <Icon className={`w-5 h-5 ${f.color}`} />
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-brand-400 transition-colors">
                      {f.label}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <FadeIn>
          <div className="max-w-3xl mx-auto text-center border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl p-10 md:p-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Start your free CMMC assessment today
            </h2>
            <p className="text-slate-400 mb-8 max-w-lg mx-auto">
              Defense contractors who start now have 6–8 months to close gaps before assessments.
              The average SPRS score for an unprepared contractor is −68.
              Hound Shield shows you exactly where you stand — for free.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-[#EA580C] hover:bg-[#e8b830] text-[#0a0a0a] font-semibold px-8 py-3.5 rounded-xl transition-colors duration-200 cursor-pointer"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <TextLogo variant="dark" />
          </Link>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="/about" className="hover:text-white transition-colors cursor-pointer">About</Link>
            <Link href="/features" className="hover:text-white transition-colors cursor-pointer">Features</Link>
            <Link href="/pricing" className="hover:text-white transition-colors cursor-pointer">Pricing</Link>
            <Link href="/contact" className="hover:text-white transition-colors cursor-pointer">Contact</Link>
            <Link href="/docs" className="hover:text-white transition-colors cursor-pointer">Docs</Link>
          </div>
        </div>
        <div className="mt-8 text-center text-xs text-slate-600">
          &copy; {new Date().getFullYear()} Hound Shield — All rights reserved.
        </div>
      </footer>
    </div>
  );
}
