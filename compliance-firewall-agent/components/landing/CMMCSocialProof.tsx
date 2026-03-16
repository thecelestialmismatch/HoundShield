"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, UserCheck, Shield, LayoutDashboard, Globe } from "lucide-react";

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

const LEAKS = [
  {
    label: "Contract numbers and CAGE codes",
    detail: "Pasted into ChatGPT for proposal drafts",
  },
  {
    label: "DD-250 form data and technical specs",
    detail: "Summarized by AI assistants daily",
  },
  {
    label: "Personnel records and security clearance info",
    detail: "Shared with AI tools during HR workflows",
  },
];

const HOW_IT_WORKS = [
  {
    icon: UserCheck,
    step: "01",
    title: "Your team uses AI as normal",
    body: "No behavior change required. Employees use ChatGPT, Copilot, Claude — whatever they already use.",
  },
  {
    icon: Shield,
    step: "02",
    title: "Every query passes through Kaelus in <50ms",
    body: "CUI, CAGE codes, contract numbers, and clearance data are detected and flagged before they leave your perimeter.",
  },
  {
    icon: LayoutDashboard,
    step: "03",
    title: "You see everything",
    body: "Every threat. Every action. Every audit trail — ready for your C3PAO reviewer the moment they ask.",
  },
];

export function CMMCSocialProof() {
  return (
    <>
      {/* ── Social proof: 3 things contractors leak ── */}
      <section className="relative py-24 px-6 bg-[#07070b] overflow-hidden">
        {/* Subtle red glow — signals danger */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(220,38,38,0.06) 0%, transparent 70%)" }} />

        <div className="relative z-10 max-w-4xl mx-auto">
          <FadeIn>
            <p className="text-center text-xs uppercase tracking-widest text-slate-600 font-semibold mb-3">
              The Hidden Risk
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center mb-4 leading-tight">
              3 things defense contractors leak to{" "}
              <span className="text-red-400">ChatGPT</span> every day
            </h2>
            <p className="text-center text-slate-500 mb-14 max-w-xl mx-auto">
              These aren&apos;t hypotheticals. These are patterns Kaelus detects across real enterprise deployments.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-5">
            {LEAKS.map((item, i) => (
              <FadeIn key={item.label} delay={i * 0.1}>
                <div className="border border-red-500/15 bg-red-500/[0.04] rounded-2xl p-6 hover:border-red-500/25 transition-colors">
                  <div className="text-2xl font-black text-red-500/40 mb-3">0{i + 1}</div>
                  <p className="text-white font-semibold mb-2 leading-snug">{item.label}</p>
                  <p className="text-sm text-slate-500">{item.detail}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.35}>
            <p className="text-center text-slate-300 font-semibold mt-12 text-lg">
              Kaelus catches all of it.{" "}
              <span className="text-emerald-400">Before it&apos;s too late.</span>
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="setup" className="relative py-24 px-6 bg-[#07070b]">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <p className="text-center text-xs uppercase tracking-widest text-slate-600 font-semibold mb-3">
              How It Works
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center mb-16 leading-tight">
              Deploy in 15 minutes.{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                Audit-ready forever.
              </span>
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map(({ icon: Icon, step, title, body }, i) => (
              <FadeIn key={step} delay={i * 0.12}>
                <div className="relative glass-card p-7 h-full">
                  <div className="absolute top-5 right-6 text-5xl font-black text-white/[0.04] select-none">
                    {step}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5 text-brand-400" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 leading-snug">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Australia / Five Eyes section ── */}
      <section className="relative py-20 px-6 bg-[#07070b]">
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            <div className="border border-white/[0.07] rounded-2xl p-10 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.04] to-transparent pointer-events-none" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">
                  <Globe className="w-3.5 h-3.5" />
                  Five Eyes Supply Chain
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-4">
                  Australian Defence Contractors
                </h2>
                <p className="text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed">
                  Kaelus maps to DISP and ASD Essential Eight requirements.
                  Built for the Five Eyes supply chain — CMMC, AUKUS, and beyond.
                </p>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] hover:border-white/[0.2] rounded-xl text-white text-sm font-semibold transition-all"
                >
                  Start your DISP assessment
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
