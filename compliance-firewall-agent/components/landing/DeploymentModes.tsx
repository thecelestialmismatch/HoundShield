"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Cloud, Server, Shield, AlertTriangle, CheckCircle } from "lucide-react";

const ease = [0.25, 0.4, 0.25, 1] as const;

const MODES = [
  {
    icon: Cloud,
    iconColor: "text-slate-400",
    iconBg: "bg-slate-500/10 border-slate-500/20",
    title: "Hosted Trial",
    setup: "60 seconds — change one env var",
    cuiSafe: false,
    cuiLabel: "Non-CUI only",
    detail: "Fastest way to evaluate Hound Shield. Traffic routes through our hosted proxy. Use with synthetic data, internal docs, and non-sensitive prompts.",
    code: "OPENAI_BASE_URL=https://proxy.houndshield.com",
    codeNote: "Evaluation only",
  },
  {
    icon: Server,
    iconColor: "text-brand-400",
    iconBg: "bg-brand-500/10 border-brand-500/20",
    title: "Self-Hosted Docker",
    setup: "3 commands — runs on your infrastructure",
    cuiSafe: true,
    cuiLabel: "DFARS 7012 compliant",
    detail: "The only mode approved for CUI environments. Container runs entirely on your own hardware or private cloud. Zero data leaves your boundary.",
    code: "docker run -p 8080:8080 houndshield/proxy:latest",
    codeNote: "Required for CMMC Level 2",
    highlight: true,
  },
  {
    icon: Shield,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    title: "Air-Gapped",
    setup: "Contact Enterprise — no internet required",
    cuiSafe: true,
    cuiLabel: "IL-5 ready",
    detail: "Fully offline deployment for classified and air-gapped networks. Includes offline pattern updates via signed bundles. DISA IL-4/IL-5 compatible.",
    code: null,
    codeNote: null,
  },
];

function ModeCard({ mode, delay }: { mode: typeof MODES[0]; delay: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const Icon = mode.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease }}
      className={`relative flex flex-col rounded-2xl p-6 h-full ${
        mode.highlight
          ? "border border-brand-400/30 bg-brand-400/[0.03]"
          : "border border-white/[0.07] bg-white/[0.03]"
      }`}
    >
      {mode.highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand-500 text-white text-[10px] font-bold uppercase tracking-wider">
          Recommended for CMMC
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${mode.iconBg}`}>
          <Icon className={`w-5 h-5 ${mode.iconColor}`} />
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
          mode.cuiSafe
            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
            : "bg-red-500/10 border border-red-500/20 text-red-400"
        }`}>
          {mode.cuiSafe
            ? <CheckCircle className="w-3 h-3" />
            : <AlertTriangle className="w-3 h-3" />}
          {mode.cuiLabel}
        </div>
      </div>

      <h3 className="text-base font-bold text-white mb-1">{mode.title}</h3>
      <p className="text-[11px] font-mono text-brand-400 mb-3">{mode.setup}</p>
      <p className="text-sm text-slate-400 leading-relaxed flex-1">{mode.detail}</p>

      {mode.code && (
        <div className="mt-4">
          <code className="block text-[11px] font-mono bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-brand-400 break-all">
            {mode.code}
          </code>
          {mode.codeNote && (
            <p className="text-[10px] text-slate-600 mt-1 font-mono">{mode.codeNote}</p>
          )}
        </div>
      )}
    </motion.div>
  );
}

export function DeploymentModes() {
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-40px" });

  return (
    <section className="py-16 px-6 bg-[#07070b]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 16 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease }}
          className="text-center mb-10"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-brand-500 font-semibold mb-3">
            Deployment
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
            Three modes. One firewall.
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            CUI environments must use <span className="text-brand-400 font-medium">self-hosted Docker</span> — prompt content never reaches houndshield.com servers. The hosted trial is for evaluation with non-sensitive data only.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-5">
          {MODES.map((mode, i) => (
            <ModeCard key={mode.title} mode={mode} delay={i * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
}
