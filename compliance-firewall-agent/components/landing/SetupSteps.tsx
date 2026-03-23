"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

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
    icon: "🖥️",
    iconClass: "bg-emerald-500/12 border border-emerald-500/20",
    title: "Install in 1 Line",
    description:
      "Point your AI SDK to our gateway endpoint. No infrastructure changes, no config files, no agents to deploy. Works with OpenAI, Anthropic, Google, and Meta SDKs out of the box.",
    code: { prefix: "→", color: "text-emerald-400", content: 'baseURL: "https://gateway.kaelus.online/v1"' },
  },
  {
    num: "02",
    icon: "🛡️",
    iconClass: "bg-indigo-500/12 border border-indigo-500/20",
    title: "We Intercept Everything",
    description:
      "Every prompt passes through 16 detection engines in parallel. PII, credentials, source code, financial data — scanned in under 50ms. Zero latency felt by the end user.",
    code: { prefix: "→", color: "text-indigo-400", content: "Scanned: 16 patterns | Latency: <50ms" },
  },
  {
    num: "03",
    icon: "🔒",
    iconClass: "bg-rose-500/12 border border-rose-500/20",
    title: "Threats Neutralised",
    description:
      "Sensitive data is blocked, quarantined with AES-256 encryption, or redacted — depending on your policy. Every event is logged in an immutable SHA-256 hash chain. Audit-ready from day one.",
    code: { prefix: "→", color: "text-rose-400", content: "BLOCKED → Quarantined → Audit Logged" },
  },
];

export function SetupSteps() {
  return (
    <section id="setup" className="py-24 md:py-32 bg-[#F7F5F0]">
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn className="mb-14">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 mb-4">
            Dead Simple Setup
          </div>
          <h2 className="text-[clamp(28px,4vw,48px)] font-extrabold tracking-tight leading-[1.1] text-gray-900 mb-4">
            Three Steps to{" "}
            <span className="bg-gradient-to-r from-emerald-600 via-indigo-600 to-rose-600 bg-clip-text text-transparent">
              Total Security
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-xl">
            No complicated setup. No learning curve. If you can change a URL, you can deploy Kaelus.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {STEPS.map((step, i) => (
            <FadeIn key={step.num} delay={i * 0.12}>
              <div className="relative p-8 rounded-2xl bg-white border border-gray-200 overflow-hidden group hover:border-indigo-200 hover:shadow-sm transition-all duration-300 hover:-translate-y-1">
                <div className="absolute top-3 right-5 text-[72px] font-black text-gray-100 leading-none pointer-events-none select-none">
                  {step.num}
                </div>
                <div className={`w-[52px] h-[52px] rounded-[14px] flex items-center justify-center text-[22px] mb-5 ${step.iconClass}`}>
                  {step.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-5">{step.description}</p>
                <div className="bg-gray-900 border border-gray-800 rounded-lg px-3.5 py-2.5 font-mono text-xs text-gray-400">
                  <span className={step.code.color}>{step.code.prefix} </span>
                  {step.code.content}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
