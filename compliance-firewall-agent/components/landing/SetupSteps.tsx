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
    accentColor: "text-emerald-400",
    connectorColor: "from-emerald-500/40 to-indigo-500/40",
    time: "~2 min",
    title: "Install in 1 Line",
    description:
      "Point your AI SDK to our gateway endpoint. No infrastructure changes, no config files, no agents to deploy. Works with OpenAI, Anthropic, Google, and Meta SDKs out of the box.",
    code: 'baseURL: "https://gateway.kaelus.online/v1"',
    codeColor: "text-emerald-400",
  },
  {
    num: "02",
    icon: Radar,
    iconClass: "bg-indigo-500/12 border border-indigo-500/20 text-indigo-400",
    accentColor: "text-indigo-400",
    connectorColor: "from-indigo-500/40 to-rose-500/40",
    time: "~0ms",
    title: "We Intercept Everything",
    description:
      "Every prompt passes through 16 detection engines in parallel. PII, credentials, source code, financial data — scanned in under 50ms. Zero latency felt by the end user.",
    code: "Scanned: 16 patterns · Latency: <50ms",
    codeColor: "text-indigo-400",
  },
  {
    num: "03",
    icon: ShieldCheck,
    iconClass: "bg-rose-500/12 border border-rose-500/20 text-rose-400",
    accentColor: "text-rose-400",
    connectorColor: "",
    time: "instant",
    title: "Threats Neutralised",
    description:
      "Sensitive data is blocked, quarantined with AES-256 encryption, or redacted — depending on your policy. Every event is logged in an immutable SHA-256 hash chain. Audit-ready from day one.",
    code: "BLOCKED → Quarantined → Audit Logged",
    codeColor: "text-rose-400",
  },
];

/* ── Animated progress dot on the connector line ── */
function ConnectorLine({ color }: { color: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <div
      ref={ref}
      className={`hidden md:flex items-center flex-1 mx-2 relative h-px bg-gradient-to-r ${color} opacity-40`}
      aria-hidden="true"
    >
      {/* Travelling dot */}
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/70 shadow-[0_0_8px_2px_rgba(255,255,255,0.4)]"
        initial={{ left: "0%" }}
        animate={isInView ? { left: ["0%", "100%", "0%"] } : { left: "0%" }}
        transition={{
          duration: 2.4,
          delay: 0.8,
          ease: "easeInOut",
          repeat: Infinity,
          repeatDelay: 1.2,
        }}
      />
    </div>
  );
}

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
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <h2 className="text-[clamp(28px,4vw,48px)] font-editorial font-bold tracking-tight leading-[1.1] text-white">
              Three Steps to{" "}
              <span className="italic text-brand-400">Total Security</span>
            </h2>
            {/* Timing badge */}
            <div className="flex-shrink-0 mb-1">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                Total: ~15 minutes
              </span>
            </div>
          </div>
          <p className="text-lg text-slate-400 max-w-xl mt-4">
            No complicated setup. No learning curve. If you can change a URL, you can deploy Kaelus.
          </p>
        </FadeIn>

        {/* Cards + animated connectors on desktop */}
        <div className="flex flex-col md:flex-row items-stretch gap-0">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="flex flex-col md:flex-row items-stretch flex-1 min-w-0">
                <FadeIn delay={i * 0.12} className="flex-1">
                  <div className="relative h-full p-8 rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-hidden group hover:border-brand-400/30 hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-1">
                    {/* Ghost step number */}
                    <div className="absolute top-3 right-5 text-[72px] font-black text-white/[0.03] leading-none pointer-events-none select-none">
                      {step.num}
                    </div>

                    {/* Time badge */}
                    <div className="absolute top-4 left-4">
                      <span className={`text-[10px] font-mono font-semibold uppercase tracking-widest ${step.accentColor} opacity-60`}>
                        {step.time}
                      </span>
                    </div>

                    <div className={`w-[52px] h-[52px] rounded-[14px] flex items-center justify-center mb-5 mt-4 ${step.iconClass}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-3">{step.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed mb-5">{step.description}</p>

                    {/* Code snippet */}
                    <div className="bg-[#0a0a12] border border-white/[0.06] rounded-lg px-3.5 py-2.5 font-mono text-xs">
                      <span className={step.codeColor}>→ </span>
                      <span className="text-slate-500">{step.code}</span>
                    </div>
                  </div>
                </FadeIn>

                {/* Animated connector line (between cards, not after last) */}
                {i < STEPS.length - 1 && (
                  <div className="hidden md:flex items-center px-3 flex-shrink-0 self-center">
                    <ConnectorLine color={step.connectorColor} />
                    <div className="w-16">
                      {/* visible connector dash */}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom timing strip */}
        <FadeIn delay={0.5} className="mt-10">
          <div className="flex items-center justify-center gap-8 py-6 border-t border-white/[0.05]">
            {[
              { label: "Deploy time", value: "15 min", color: "text-emerald-400" },
              { label: "Detection latency", value: "<50ms", color: "text-indigo-400" },
              { label: "Frameworks enforced", value: "3-in-1", color: "text-brand-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <div className={`text-xl font-black font-mono ${color} mb-0.5`}>{value}</div>
                <div className="text-[10px] text-slate-600 uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
