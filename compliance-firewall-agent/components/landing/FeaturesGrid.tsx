"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const FEATURES = [
  {
    icon: "🛡️",
    iconBg: "bg-indigo-500/15",
    title: "Real-Time AI Firewall",
    desc: "Intercept and scan every AI API call before it leaves your network. Blocks CUI, PII, SSN, credentials, source code, and 12 other data categories in milliseconds.",
  },
  {
    icon: "📊",
    iconBg: "bg-emerald-500/15",
    title: "CMMC Self-Assessment",
    desc: "Walk through all 110 NIST 800-171 controls with guided questions. Get your real SPRS score and know exactly which controls you're failing — and how to fix them.",
  },
  {
    icon: "🔗",
    iconBg: "bg-amber-500/15",
    title: "Cryptographic Audit Trail",
    desc: "Every compliance event is logged with a SHA-256 hash chain. Tamper-evident, export-ready. Give your C3PAO assessor exactly what they need.",
  },
  {
    icon: "🤖",
    iconBg: "bg-indigo-500/15",
    title: "AI Compliance Assistant",
    desc: 'Ask "What are my top 5 risks?" and get answers based on your actual assessment data. Powered by multiple AI models through OpenRouter.',
  },
  {
    icon: "📄",
    iconBg: "bg-emerald-500/15",
    title: "PDF Compliance Reports",
    desc: "One-click export of your full compliance posture — SPRS score, control family breakdown, gap analysis, and remediation roadmap. Share with primes and assessors.",
  },
  {
    icon: "⚡",
    iconBg: "bg-amber-500/15",
    title: "AES-256 Quarantine",
    desc: "Flagged content is encrypted and quarantined, never forwarded. Your team gets blocked with context. You get the audit log. The AI never sees the sensitive data.",
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="py-24 md:py-32 bg-[#07070b]">
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn className="text-center mb-14">
          <div className="inline-flex justify-center text-xs font-bold uppercase tracking-[0.2em] text-brand-400 mb-4">
            Features
          </div>
          <h2 className="text-[clamp(28px,4vw,48px)] font-editorial font-bold tracking-tight leading-[1.1] text-white">
            Everything you need.
            <br />
            <span className="italic text-brand-400">Nothing you don&apos;t.</span>
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <FadeIn key={feature.title} delay={i * 0.09}>
              <div className="p-7 bg-white/[0.04] border border-white/[0.08] rounded-2xl hover:border-brand-400/30 hover:bg-white/[0.06] hover:-translate-y-1 transition-all duration-300">
                <div className={`w-11 h-11 rounded-[10px] flex items-center justify-center text-xl mb-4 ${feature.iconBg}`}>
                  {feature.icon}
                </div>
                <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
