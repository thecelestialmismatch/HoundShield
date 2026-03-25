"use client";

import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

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

const LAYERS = [
  {
    num: "LAYER 1",
    icon: "🌐",
    iconClass: "bg-indigo-500/12 border-indigo-500/25",
    title: "The Employees (Client Layer)",
    subtitle: "Your team doing their normal work. They don't even know we're there.",
    subtitleColor: "text-brand-400",
    description:
      "Employees hit Send on a prompt containing a secret. The traffic is intercepted at the DNS or proxy level and routed to Kaelus before it ever reaches the AI provider.",
    tags: [
      { label: "ChatGPT.com", color: "text-brand-400" },
      { label: "Cursor / VS Code", color: "text-brand-400" },
      { label: "Internal Apps", color: "text-brand-400" },
      { label: "Slack Bots", color: "text-brand-400" },
    ],
  },
  {
    num: "LAYER 2",
    icon: "🛡️",
    iconClass: "bg-emerald-500/12 border-emerald-500/25",
    title: "The Security Guard (Firewall Engine)",
    subtitle: "The split-second check of the backpack before it leaves the building.",
    subtitleColor: "text-emerald-400",
    description:
      "Our lightning-fast regex and pattern-matching engine scans the payload. If it's clean, it passes immediately. If it has PII, it triggers an alert. All in under 50ms.",
    tags: [
      { label: "Pattern Scanner (16 types)", color: "text-emerald-400" },
      { label: "Decodes Base64/Hex", color: "text-emerald-400" },
      { label: "Threat Classifier", color: "text-emerald-400" },
      { label: "<50ms Latency", color: "text-emerald-400" },
    ],
  },
  {
    num: "LAYER 3",
    icon: "🧠",
    iconClass: "bg-purple-500/12 border-purple-500/25",
    title: "The Detective (Agentic AI)",
    subtitle: "If the guard is confused, the detective investigates the context to be sure.",
    subtitleColor: "text-purple-400",
    description:
      "Sometimes apple is a fruit, sometimes it's the company. Our autonomous agents analyze borderline cases using LLM reasoning to prevent false positives — 0.01% false positive rate.",
    tags: [
      { label: "ReAct Agent Loop", color: "text-purple-400" },
      { label: "13 AI Models", color: "text-purple-400" },
      { label: "8 Diagnostic Tools", color: "text-purple-400" },
      { label: "Context Verification", color: "text-purple-400" },
    ],
  },
  {
    num: "LAYER 4",
    icon: "🔒",
    iconClass: "bg-amber-500/12 border-amber-500/25",
    title: "The Safe (Security Vault)",
    subtitle: "Instead of going to ChatGPT, the secret gets locked in a box only you can open.",
    subtitleColor: "text-amber-400",
    description:
      "The request is blocked. The secret data is encrypted and saved to a quarantine queue where an admin can review it. An immutable audit log is generated, export-ready for your C3PAO.",
    tags: [
      { label: "AES-256 Quarantine", color: "text-amber-400" },
      { label: "SHA-256 Hash Chain", color: "text-amber-400" },
      { label: "CFO-Ready Reports", color: "text-amber-400" },
      { label: "Human Review Queue", color: "text-amber-400" },
    ],
  },
];

export function ArchitectureAccordion() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="py-24 md:py-32 bg-[#0d0d14]">
      <div className="max-w-4xl mx-auto px-6">
        <FadeIn className="text-center mb-14">
          <div className="inline-flex justify-center text-xs font-bold uppercase tracking-[0.2em] text-brand-400 mb-4">
            Under the Hood
          </div>
          <h2 className="text-[clamp(28px,4vw,48px)] font-editorial font-bold tracking-tight leading-[1.1] text-white mb-4">
            4-Layer <span className="italic text-brand-400">Security Architecture</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-[560px] mx-auto">
            From employee prompt to blocked threat — here's how every request travels through the Kaelus security stack.
          </p>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="flex flex-col gap-4">
            {LAYERS.map((layer, i) => {
              const isOpen = openIndex === i;
              return (
                <div key={i}>
                  <div
                    className={`rounded-2xl overflow-hidden border transition-all duration-300 ${
                      isOpen
                        ? "bg-white/[0.06] border-brand-400/30"
                        : "bg-white/[0.04] border-white/[0.08]"
                    }`}
                  >
                    <button
                      onClick={() => setOpenIndex(isOpen ? -1 : i)}
                      className="w-full flex items-center justify-between gap-4 p-6 text-left hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl flex-shrink-0 transition-transform duration-300 ${layer.iconClass} ${isOpen ? "scale-110" : ""}`}
                        >
                          {layer.icon}
                        </div>
                        <div className="text-left">
                          <div className="text-[11px] font-bold font-mono text-slate-500 tracking-wider mb-1">
                            {layer.num}
                          </div>
                          <h3 className="text-[17px] font-bold text-white mb-1">{layer.title}</h3>
                          <p className={`text-[13px] ${layer.subtitleColor}`}>{layer.subtitle}</p>
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6">
                            <div className="pt-4 border-t border-white/[0.08]">
                              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                                {layer.description}
                              </p>
                              <div className="grid grid-cols-2 gap-2.5">
                                {layer.tags.map((tag) => (
                                  <div
                                    key={tag.label}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm"
                                  >
                                    <span className={`font-bold ${tag.color}`}>✓</span>
                                    <span className="text-slate-300">{tag.label}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {i < LAYERS.length - 1 && (
                    <div className="flex justify-center py-1 text-white/20 text-lg">▾</div>
                  )}
                </div>
              );
            })}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
