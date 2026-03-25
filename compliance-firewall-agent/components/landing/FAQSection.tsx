"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "What exactly does Kaelus do?",
    a: "Kaelus is an AI compliance firewall. It sits between your employees and AI providers (OpenAI, Anthropic, Google, Meta). Every prompt is scanned for sensitive data — SSNs, API keys, source code, financial data, medical records — and blocked or quarantined before it ever reaches the AI provider. Think of it as a security guard for your AI traffic.",
  },
  {
    q: "How long does it take to set up?",
    a: "Under 15 minutes. You change a single line in your AI SDK configuration to point to our gateway URL — that's it. No agents to install, no infrastructure changes, no configuration files. We're API-compatible with OpenAI, Anthropic, Google, and Meta SDKs.",
  },
  {
    q: "Will it slow down my AI requests?",
    a: "No. Our P99 latency is under 50ms. We use zero-copy stream scanning and parallel pattern matching across all 16 detection engines simultaneously. In real-world usage, users don't notice any difference.",
  },
  {
    q: "How is Kaelus different from traditional DLP tools?",
    a: "Traditional DLP tools are regex-based — they flag the word Apple even when the prompt is about a pie recipe. Kaelus uses 13 AI agents running a ReAct reasoning loop to understand context. We have a 99.9% detection rate with only 0.01% false positives. We don't just scan. We think.",
  },
  {
    q: "What compliance standards does Kaelus support?",
    a: "Kaelus is designed for CMMC Level 2, NIST 800-171, SOC 2 Type II, GDPR, EU AI Act, HIPAA, and ISO 27001 compliance. Every scan event is logged in an immutable SHA-256 hash chain, giving you tamper-proof audit trails. You can generate board-ready compliance reports with a single click.",
  },
  {
    q: "What happens when sensitive data is detected?",
    a: "Depending on your configured policy, the data is either: (1) Blocked — the request is stopped and the user is notified with a safe alternative, (2) Quarantined — the prompt is encrypted with AES-256 and queued for human review in the HITL portal, or (3) Redacted — the sensitive portion is masked and the clean request is forwarded.",
  },
  {
    q: "Is there a free tier?",
    a: "Yes. Our free tier includes up to 1,000 scans per month, 8 detection patterns, and basic audit logging. No credit card required, and the free tier is available forever. Pro plans unlock all 16 patterns, unlimited scans, HITL review, compliance reports, and 24/7 monitoring.",
  },
  {
    q: "Can I self-host Kaelus?",
    a: "Yes. We offer a Docker-based self-hosted option for enterprises that require on-premise deployment. The self-hosted version includes the full gateway, all detection engines, the audit trail, and the dashboard. Contact our sales team for pricing.",
  },
];

function FAQItem({ q, a, defaultOpen = false }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`rounded-[14px] overflow-hidden border transition-colors duration-200 ${
        open ? "bg-brand-400/[0.05] border-brand-400/30" : "bg-white/[0.03] border-white/[0.08]"
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-white/[0.04] transition-colors"
      >
        <span className="text-sm font-semibold text-white">{q}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5">
              <div className="pt-3.5 border-t border-white/[0.06]">
                <p className="text-sm text-slate-400 leading-[1.75]">{a}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="faq" className="py-24 md:py-32 bg-[#0d0d14]">
      <div className="max-w-3xl mx-auto px-6">
        <div ref={ref} className="text-center mb-14">
          <div className="inline-flex justify-center text-xs font-bold uppercase tracking-[0.2em] text-brand-400 mb-4">
            Common Questions
          </div>
          <h2 className="text-[clamp(28px,4vw,48px)] font-editorial font-bold tracking-tight leading-[1.1] text-white mb-4">
            Frequently Asked{" "}
            <span className="italic text-brand-400">Questions</span>
          </h2>
          <p className="text-lg text-slate-400">Everything you need to know about Kaelus.</p>
        </div>

        <div className="flex flex-col gap-3">
          {FAQS.map((faq, i) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} defaultOpen={i === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}
