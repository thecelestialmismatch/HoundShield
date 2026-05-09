"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { ScrollProgressBar } from "@/components/scroll-effects";
import {
  Shield, Cpu, CreditCard, LayoutDashboard, KeyRound, Blocks,
  Sparkles, Zap, Wrench, Calendar, Rocket, FolderSearch,
  Users, ClipboardCheck, Smartphone, ArrowRight,
} from "lucide-react";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </motion.div>
  );
}

const badgeStyles = {
  Feature: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  Improvement: "bg-brand-500/15 text-brand-400 border-brand-500/25",
  Fix: "bg-brand-500/15 text-brand-400 border-brand-500/25",
};

type Item = { tag: keyof typeof badgeStyles; text: string };
type Release = { version: string; date: string; title: string; icon: typeof Shield; items: Item[] };

const releases: Release[] = [
  {
    version: "2.5.0", date: "March 2026", title: "CMMC Level 2 Full Mapping", icon: Shield,
    items: [
      { tag: "Feature", text: "Complete 110-control CMMC Level 2 mapping with practice-level detail" },
      { tag: "Feature", text: "SPRS score calculator with real-time gap weighting" },
      { tag: "Feature", text: "C3PAO-ready report export (PDF + JSON)" },
      { tag: "Improvement", text: "Hound Shield assessment engine refactored for sub-200ms scoring" },
    ],
  },
  {
    version: "2.4.0", date: "February 2026", title: "AI Agent Workspace", icon: Cpu,
    items: [
      { tag: "Feature", text: "ReAct reasoning loop with chain-of-thought tracing" },
      { tag: "Feature", text: "12 integrated tools for compliance automation" },
      { tag: "Feature", text: "13 AI model support via OpenRouter gateway" },
      { tag: "Improvement", text: "Agent templates for common compliance workflows" },
    ],
  },
  {
    version: "2.3.0", date: "January 2026", title: "Stripe Integration & Pricing", icon: CreditCard,
    items: [
      { tag: "Feature", text: "4-tier pricing: Free, Pro, Business, Enterprise" },
      { tag: "Feature", text: "14-day trial with automatic downgrade" },
      { tag: "Feature", text: "Promo code engine with usage-based metering" },
      { tag: "Fix", text: "Webhook idempotency for duplicate Stripe events" },
    ],
  },
  {
    version: "2.2.0", date: "December 2025", title: "Command Center V2", icon: LayoutDashboard,
    items: [
      { tag: "Feature", text: "Unified dashboard with real-time threat feed" },
      { tag: "Feature", text: "Compliance metrics panel with trend sparklines" },
      { tag: "Improvement", text: "Pipeline view for scan lifecycle tracking" },
      { tag: "Fix", text: "WebSocket reconnection reliability on flaky networks" },
    ],
  },
  {
    version: "2.1.0", date: "November 2025", title: "OAuth & Multi-Provider Auth", icon: KeyRound,
    items: [
      { tag: "Feature", text: "Google, GitHub, and Microsoft SSO providers" },
      { tag: "Feature", text: "Magic link passwordless authentication" },
      { tag: "Improvement", text: "Session management with secure HTTP-only cookies" },
    ],
  },
  {
    version: "2.0.0", date: "October 2025", title: "Complete Platform Rebuild", icon: Blocks,
    items: [
      { tag: "Feature", text: "Full rewrite on Next.js 15, React 19, Tailwind CSS" },
      { tag: "Feature", text: "Dark-mode-first design system" },
      { tag: "Feature", text: "Zero-copy stream scanning engine" },
      { tag: "Improvement", text: "Sub-50ms P99 scan latency" },
    ],
  },
];

const roadmap = [
  { q: "Q2 2026", title: "Evidence Collection Automation", desc: "Auto-gather artifacts and screenshots mapped to CMMC controls.", icon: FolderSearch },
  { q: "Q2 2026", title: "Multi-Organization Support", desc: "Manage multiple subsidiaries under a single parent account.", icon: Users },
  { q: "Q3 2026", title: "C3PAO Assessment Prep Wizard", desc: "Guided walkthrough to prepare for third-party CMMC assessments.", icon: ClipboardCheck },
  { q: "Q3 2026", title: "Mobile App (iOS / Android)", desc: "Review alerts, approve quarantine actions, and track compliance on the go.", icon: Smartphone },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <ScrollProgressBar />
      <Navbar variant="dark" />

      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-500/[0.07] via-transparent to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <FadeIn>
            <p className="text-xs uppercase tracking-[0.25em] text-brand-400 font-semibold mb-4">Changelog</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5">
              What&apos;s new in <span className="bg-gradient-to-r from-brand-400 to-emerald-400 bg-clip-text text-transparent">Hound Shield</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-xl mx-auto">Every improvement, shipped fast.</p>
          </FadeIn>
        </div>
      </section>

      {/* Timeline */}
      <section className="relative py-16 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Vertical line */}
          <div className="absolute left-[calc(50%-1.5rem)] sm:left-[2.35rem] md:left-[calc(50%-22.5rem)] top-0 bottom-0 w-px bg-white/[0.06] hidden sm:block" />

          <div className="space-y-10">
            {releases.map((r, i) => {
              const Icon = r.icon;
              return (
                <FadeIn key={r.version} delay={i * 0.08}>
                  <div className="relative flex items-start gap-6">
                    {/* Dot on line */}
                    <div className="hidden sm:flex flex-col items-center shrink-0">
                      <div className={`w-10 h-10 rounded-full border flex items-center justify-center ${i === 0 ? "border-emerald-500/40 bg-emerald-500/10" : "border-white/10 bg-white/[0.03]"}`}>
                        <Icon className={`w-4 h-4 ${i === 0 ? "text-emerald-400" : "text-slate-400"}`} />
                      </div>
                    </div>

                    {/* Card */}
                    <div className="flex-1 border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl p-6 sm:p-8">
                      <div className="flex flex-wrap items-center gap-3 mb-5">
                        <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${i === 0 ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" : "bg-white/[0.05] text-slate-400 border-white/10"}`}>
                          v{r.version}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />{r.date}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-4">{r.title}</h3>
                      <ul className="space-y-2.5">
                        {r.items.map((item, j) => (
                          <li key={j} className="flex items-start gap-3 text-sm text-slate-400">
                            <span className={`shrink-0 mt-0.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeStyles[item.tag]}`}>
                              {item.tag}
                            </span>
                            <span>{item.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <FadeIn className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/20 bg-brand-500/10 mb-4">
              <Rocket className="w-4 h-4 text-brand-400" />
              <span className="text-xs font-semibold text-brand-300 uppercase tracking-wider">Roadmap</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Coming next</h2>
          </FadeIn>
          <div className="grid sm:grid-cols-2 gap-6">
            {roadmap.map((item, i) => {
              const Icon = item.icon;
              return (
                <FadeIn key={item.title} delay={i * 0.08}>
                  <div className="group border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl p-6 h-full cursor-pointer hover:border-brand-500/20 hover:bg-brand-500/[0.03] transition-colors duration-300">
                    <div className="flex items-center gap-3 mb-3">
                      <Icon className="w-5 h-5 text-brand-400" />
                      <span className="text-[10px] uppercase tracking-wider text-brand-400 font-bold">{item.q}</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24 px-6">
        <FadeIn>
          <div className="max-w-3xl mx-auto text-center border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl py-14 px-8">
            <Sparkles className="w-6 h-6 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-3">Ship with confidence</h3>
            <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">Start protecting your AI pipeline today. Free tier available with no credit card required.</p>
            <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-600 hover:bg-brand-500 text-sm font-semibold transition-colors cursor-pointer">
              Get started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 px-6">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <Link href="/" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer">Hound Shield</Link>
          <p className="text-xs text-slate-500">&copy; 2026 Hound Shield. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
