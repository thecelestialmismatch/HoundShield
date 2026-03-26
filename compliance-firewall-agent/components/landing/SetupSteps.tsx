"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Terminal, Radar, ShieldCheck } from "lucide-react";

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
  const isInView = useInView(ref, { once: true, margin: "-80px" });
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

const STEPS = [
  {
    num: "01",
    icon: Terminal,
    iconClass: "bg-emerald-500/12 border border-emerald-500/20 text-emerald-400",
    title: "Install in 1 Line",
    description:
      "Point your AI SDK to our gateway endpoint. No infrastructure changes, no config files, no agents to deploy. Works with OpenAI, Anthropic, Google, and Meta SDKs out of the box.",
    code: { prefix: "\u2192", color: "text-emerald-400", content: 'baseURL: "https://gateway.kaelus.online/v1"' },
  },
  {
    num: "02",
    icon: Radar,
    iconClass: "bg-indigo-500/12 border border-indigo-500/20 text-indigo-400",
    title: "We Intercept Everything",
    description:
      "Every prompt passes through 16 detection engines in parallel. PII, credentials, source code, financial data \u2014 scanned in under 50ms. Zero latency felt by the end user.",
    code: { prefix: "\u2192", color: "text-indigo-400", content: "Scanned: 16 patterns | Latency: <50ms" },
  },
  {
    num: "03",
    icon: ShieldCheck,
    iconClass: "bg-rose-500/12 border border-rose-500/20 text-rose-400",
    title: "Threats Neutralised",
    description:
      "Sensitive data is blocked, quarantined with AES-256 encryption, or redacted \u2014 depending on your policy. Every event is logged in an immutable SHA-256 hash chain. Audit-ready from day one.",
    code: { prefix: "\u2192", color: "text-rose-400", content: "BLOCKED \u2192 Quarantined \u2192 Audit Logged" },
  },
];

export function SetupSteps() {
  return (
    <section id="setup" className="relative py-24 md:py-32 overflow-hidden">
      {/* Subtle gradient mesh */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 20% 50%, rgba(16,185,129,0.04) 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 80% 30%, rgba(99,102,241,0.03) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <FadeIn className="mb-14">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-brand-400 mb-4">
            Dead Simple Setup
          </div>
          <h2 className="text-[clamp(28px,4vw,48px)] font-editorial font-bold tracking-tight leading-[1.1] text-white mb-4">
            Three Steps to{" "}
            <span className="italic text-brand-400">Total Security</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-xl">
            No complicated setup. No learning curve. If you can change a URL, you can deploy Kaelus.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <FadeIn key={step.num} delay={i * 0.12}>
                <div className="relative p-8 rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-hidden group hover:border-brand-400/30 hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-1">
                  <div className="absolute top-3 right-5 text-[72px] font-black text-white/[0.03] leading-none pointer-events-none select-none">
                    {step.num}
                  </div>
                  <div className={`w-[52px] h-[52px] rounded-[14px] flex items-center justify-center mb-5 ${step.iconClass}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-5">{step.description}</p>
                  <div className="bg-[#0a0a12] border border-white/[0.06] rounded-lg px-3.5 py-2.5 font-mono text-xs text-slate-500">
                    <span className={step.code.color}>{step.code.prefix} </span>
                    {step.code.content}
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
