"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, UserCheck, Shield, LayoutDashboard, Globe, Lock, HeartPulse } from "lucide-react";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const VERTICALS = [
  {
    icon: Lock,
    color: "indigo",
    label: "Technology",
    framework: "SOC 2",
    leaks: [
      { text: "GitHub token in AI code-review prompt", detail: "Pasted by engineers into Copilot daily" },
      { text: "Proprietary algorithms & trade secrets", detail: "Sent to ChatGPT for documentation help" },
      { text: "PII from production database queries", detail: "Shared with AI for debugging assistance" },
    ],
  },
  {
    icon: HeartPulse,
    color: "emerald",
    label: "Healthcare",
    framework: "HIPAA",
    leaks: [
      { text: "Patient name, DOB, and SSN in notes", detail: "Pasted into AI for clinical documentation" },
      { text: "Discharge summaries with full PHI", detail: "Sent to ChatGPT for coding & billing help" },
      { text: "Insurance claim details and diagnoses", detail: "Shared with AI for prior auth letters" },
    ],
  },
  {
    icon: Shield,
    color: "amber",
    label: "Defense",
    framework: "CMMC L2",
    leaks: [
      { text: "Contract numbers and CAGE codes", detail: "Pasted into ChatGPT for proposal drafts" },
      { text: "DD-250 form data and technical specs", detail: "Summarized by AI assistants daily" },
      { text: "Personnel records & clearance info", detail: "Shared with AI during HR workflows" },
    ],
  },
];

const COLOR_MAP: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  indigo: {
    border: "border-indigo-500/20",
    bg: "bg-indigo-500/[0.05]",
    text: "text-indigo-400",
    badge: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
  },
  emerald: {
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/[0.05]",
    text: "text-emerald-400",
    badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  },
  amber: {
    border: "border-amber-500/20",
    bg: "bg-amber-500/[0.05]",
    text: "text-amber-400",
    badge: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  },
};

const HOW_IT_WORKS = [
  {
    icon: UserCheck,
    step: "01",
    title: "Your team uses AI as normal",
    body: "No behavior change required. Employees use ChatGPT, Copilot, Claude — whatever they already use, across every department.",
  },
  {
    icon: Shield,
    step: "02",
    title: "Every query passes through Kaelus in <10ms",
    body: "PHI, CUI, IP, API keys, SSNs, CAGE codes — 16 detection categories flagged before they leave your perimeter. SOC 2, HIPAA, and CMMC simultaneously.",
  },
  {
    icon: LayoutDashboard,
    step: "03",
    title: "You see everything. Across all frameworks.",
    body: "One dashboard. Every threat, every blocked query, every audit trail — ready for your SOC 2 auditor, HIPAA officer, or C3PAO reviewer the moment they ask.",
  },
];

export function CMMCSocialProof() {
  return (
    <>
      {/* ── Multi-framework risk section ── */}
      <section className="relative py-24 px-6 bg-[#07070b] overflow-hidden">
        <div className="relative z-10 max-w-6xl mx-auto">
          <FadeIn>
            <p className="text-center text-xs uppercase tracking-widest text-brand-400 font-semibold mb-3">
              The Hidden Risk — Across Every Industry
            </p>
            <h2 className="text-3xl md:text-4xl font-editorial font-bold text-white text-center mb-4 leading-tight">
              What your team is leaking to{" "}
              <span className="text-red-400">AI tools</span> right now
            </h2>
            <p className="text-center text-slate-400 mb-14 max-w-xl mx-auto">
              These aren&apos;t hypotheticals. Kaelus detects these patterns across real enterprise deployments — in technology, healthcare, and defense — every single day.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {VERTICALS.map(({ icon: Icon, color, label, framework, leaks }, vi) => {
              const c = COLOR_MAP[color];
              return (
                <FadeIn key={label} delay={vi * 0.1}>
                  <div className={`${c.border} ${c.bg} border rounded-2xl p-6 h-full`}>
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.bg} border ${c.border}`}>
                        <Icon className={`w-4 h-4 ${c.text}`} />
                      </div>
                      <div>
                        <div className="text-white font-bold text-sm">{label}</div>
                        <div className={`text-[10px] font-mono font-semibold uppercase tracking-wider ${c.text}`}>{framework}</div>
                      </div>
                    </div>
                    {/* Leaks */}
                    <div className="space-y-3">
                      {leaks.map(({ text, detail }, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <span className={`text-xs font-black mt-0.5 flex-shrink-0 ${c.text}`}>0{i + 1}</span>
                          <div>
                            <p className="text-white text-sm font-semibold leading-snug mb-0.5">{text}</p>
                            <p className="text-[11px] text-slate-500">{detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>

          <FadeIn delay={0.35}>
            <p className="text-center text-slate-300 font-semibold mt-12 text-lg">
              One platform. Every framework. Kaelus catches all of it.{" "}
              <span className="text-emerald-400">Before it&apos;s too late.</span>
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="setup" className="relative py-24 px-6 bg-[#0d0d14]">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <p className="text-center text-xs uppercase tracking-widest text-brand-400 font-semibold mb-3">
              How It Works
            </p>
            <h2 className="text-3xl md:text-4xl font-editorial font-bold text-white text-center mb-16 leading-tight">
              Deploy in 15 minutes.{" "}
              <span className="italic text-brand-400">Audit-ready forever.</span>
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map(({ icon: Icon, step, title, body }, i) => (
              <FadeIn key={step} delay={i * 0.12}>
                <div className="relative bg-white/[0.04] border border-white/[0.08] rounded-2xl p-7 h-full hover:border-brand-400/30 hover:bg-white/[0.06] hover:-translate-y-1 transition-all duration-300">
                  <div className="absolute top-5 right-6 text-5xl font-black text-white/[0.04] select-none">
                    {step}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-brand-400/[0.1] border border-brand-400/20 flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5 text-brand-400" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 leading-snug">{title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Five Eyes / Global compliance ── */}
      <section className="relative py-20 px-6 bg-[#07070b]">
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            <div className="border border-white/[0.08] rounded-2xl p-10 text-center relative overflow-hidden bg-white/[0.04]">
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-400/[0.08] border border-brand-400/20 text-xs font-semibold text-brand-400 uppercase tracking-widest mb-6">
                  <Globe className="w-3.5 h-3.5" />
                  Global Compliance Coverage
                </div>
                <h2 className="text-2xl md:text-3xl font-editorial font-bold text-white mb-4">
                  One deployment. Every jurisdiction.
                </h2>
                <p className="text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed">
                  From US DoD contractors (CMMC) to Australian defence suppliers (DISP / ASD Essential Eight) to healthcare systems (HIPAA / GDPR) — Kaelus speaks every compliance language.
                </p>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-dark rounded-xl text-white text-sm font-semibold transition-all"
                >
                  Start your assessment — all frameworks included
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
