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
    subtitleColor: "text-indigo-600",
    description:
      "Employees hit Send on a prompt containing a secret. The traffic is intercepted at the DNS or proxy level and routed to Kaelus before it ever reaches the AI provider.",
    tags: [
      { label: "ChatGPT.com", color: "text-indigo-600" },
      { label: "Cursor / VS Code", color: "text-indigo-600" },
      { label: "Internal Apps", color: "text-indigo-600" },
      { label: "Slack Bots", color: "text-indigo-600" },
    ],
  },
  {
    num: "LAYER 2",
    icon: "🛡️",
    iconClass: "bg-emerald-500/12 border-emerald-500/25",
    title: "The Security Guard (Firewall Engine)",
    subtitle: "The split-second check of the backpack before it leaves the building.",
    subtitleColor: "text-emerald-600",
    description:
      "Our lightning-fast regex and pattern-matching engine scans the payload. If it's clean, it passes immediately. If it has PII, it triggers an alert. All in under 50ms.",
    tags: [
      { label: "Pattern Scanner (16 types)", color: "text-emerald-600" },
      { label: "Decodes Base64/Hex", color: "text-emerald-600" },
      { label: "Threat Classifier", color: "text-emerald-600" },
      { label: "<50ms Latency", color: "text-emerald-600" },
    ],
  },
  {
    num: "LAYER 3",
    icon: "🧠",
    iconClass: "bg-purple-500/12 border-purple-500/25",
    title: "The Detective (Agentic AI)",
    subtitle: "If the guard is confused, the detective investigates the context to be sure.",
    subtitleColor: "text-purple-600",
    description:
      "Sometimes apple is a fruit, sometimes it's the company. Our autonomous agents analyze borderline cases using LLM reasoning to prevent false positives — 0.01% false positive rate.",
    tags: [
      { label: "ReAct Agent Loop", color: "text-purple-600" },
      { label: "13 AI Models", color: "text-purple-600" },
      { label: "8 Diagnostic Tools", color: "text-purple-600" },
      { label: "Context Verification", color: "text-purple-600" },
    ],
  },
  {
    num: "LAYER 4",
    icon: "🔒",
    iconClass: "bg-amber-500/12 border-amber-500/25",
    title: "The Safe (Security Vault)",
    subtitle: "Instead of going to ChatGPT, the secret gets locked in a box only you can open.",
    subtitleColor: "text-amber-600",
    description:
      "The request is blocked. The secret data is encrypted and saved to a quarantine queue where an admin can review it. An immutable audit log is generated, export-ready for your C3PAO.",
    tags: [
      { label: "AES-256 Quarantine", color: "text-amber-600" },
      { label: "SHA-256 Hash Chain", color: "text-amber-600" },
      { label: "CFO-Ready Reports", color: "text-amber-600" },
      { label: "Human Review Queue", color: "text-amber-600" },
    ],
  },
];

export function ArchitectureAccordion() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <FadeIn className="text-center mb-14">
          <div className="inline-flex justify-center text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 mb-4">
            Under the Hood
          </div>
          <h2 className="text-[clamp(28px,4vw,48px)] font-extrabold tracking-tight leading-[1.1] text-gray-900 mb-4">
            4-Layer Security Architecture
          </h2>
          <p className="text-lg text-gray-600 max-w-[560px] mx-auto">
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
                        ? "bg-indigo-50 border-indigo-200"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <button
                      onClick={() => setOpenIndex(isOpen ? -1 : i)}
                      className="w-full flex items-center justify-between gap-4 p-6 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl flex-shrink-0 transition-transform duration-300 ${layer.iconClass} ${isOpen ? "scale-110" : ""}`}
                        >
                          {layer.icon}
                        </div>
                        <div className="text-left">
                          <div className="text-[11px] font-bold font-mono text-gray-400 tracking-wider mb-1">
                            {layer.num}
                          </div>
                          <h3 className="text-[17px] font-bold text-gray-900 mb-1">{layer.title}</h3>
                          <p className={`text-[13px] ${layer.subtitleColor}`}>{layer.subtitle}</p>
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
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
                            <div className="pt-4 border-t border-gray-200">
                              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                                {layer.description}
                              </p>
                              <div className="grid grid-cols-2 gap-2.5">
                                {layer.tags.map((tag) => (
                                  <div
                                    key={tag.label}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 border border-gray-200 text-sm"
                                  >
                                    <span className={`font-bold ${tag.color}`}>✓</span>
                                    <span className="text-gray-700">{tag.label}</span>
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
                    <div className="flex justify-center py-1 text-gray-300 text-lg">▾</div>
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
