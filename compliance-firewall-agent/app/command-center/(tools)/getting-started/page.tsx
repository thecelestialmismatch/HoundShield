"use client";

/**
 * Getting Started — the first thing a new customer sees after signing in.
 *
 * It does not duplicate the deep guides; it sequences them. Each step links to
 * the real page that already does the work (SDK integration, the Shield
 * onboarding wizard, the Docker quickstart, reports, the audit log), so a new
 * user always has a clear "what do I do next" path from prompt-leak risk to
 * C3PAO-ready evidence.
 *
 * Dark dashboard conventions only: bg-[#0a0a0a], brand-400/500 accents,
 * white/[0.0x] glass cards, template-literal class strings, no new colors.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Rocket,
  Link2,
  Container,
  Radar,
  ScrollText,
  FileBarChart,
  ClipboardCheck,
  FileCheck2,
  ArrowRight,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

type Step = {
  n: number;
  icon: typeof Rocket;
  title: string;
  body: string;
  href: string;
  cta: string;
};

const STEPS: Step[] = [
  {
    n: 1,
    icon: Link2,
    title: "Point your AI tools at HoundShield",
    body: "Change one URL. Swap api.openai.com for your HoundShield gateway endpoint in any OpenAI-compatible client — ChatGPT, Copilot, Claude, Gemini. No agents, no per-machine install. Every prompt is then scanned locally in under 10ms before it leaves.",
    href: "/command-center/sdk",
    cta: "Open the integration guide",
  },
  {
    n: 2,
    icon: Container,
    title: "Deploy Mode B (Docker) for CUI workloads",
    body: "The hosted trial is for non-CUI evaluation only — it runs on Vercel, which is not FedRAMP-authorized. For anything touching CUI, run the Docker image on your own infrastructure so prompt content never leaves your network. That is the only CUI-safe mode.",
    href: "/docs/quickstart",
    cta: "Docker quickstart",
  },
  {
    n: 3,
    icon: ClipboardCheck,
    title: "Set your CMMC baseline",
    body: "Run the ShieldReady onboarding wizard to record your organization, connect your AI tools, and set your CMMC Level. It seeds your SPRS score across all 110 NIST 800-171 controls so every blocked prompt maps to a control you can show an assessor.",
    href: "/command-center/shield/onboarding",
    cta: "Start the onboarding wizard",
  },
  {
    n: 4,
    icon: Radar,
    title: "Run the 14-day scan window",
    body: "Let real AI traffic flow through the gateway. HoundShield classifies every prompt (CUI, PHI, PII, IP, ITAR) and blocks or quarantines violations while clean prompts pass through untouched. Watch it happen live in the real-time feed.",
    href: "/command-center/realtime",
    cta: "Open the real-time feed",
  },
  {
    n: 5,
    icon: ScrollText,
    title: "Review the tamper-evident audit log",
    body: "Every decision writes an immutable, SHA-256 hash-chained log entry. Review what was blocked, why, and against which NIST control — the evidence trail an auditor actually asks for.",
    href: "/command-center/events",
    cta: "View the audit log",
  },
  {
    n: 6,
    icon: FileBarChart,
    title: "Generate the C3PAO-ready PDF",
    body: "One click turns your scan window into a formatted, SHA-256-signed PDF mapped to NIST 800-171 Rev 2 — the deliverable your C3PAO assessor can accept the day of the visit.",
    href: "/command-center/shield/reports",
    cta: "Generate a report",
  },
];

function StepCard({ step, index }: { step: Step; index: number }) {
  const Icon = step.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className="relative flex gap-4 p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-brand-400/20 transition-colors"
    >
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-brand-400" />
        </div>
        <span className="mt-2 text-[10px] font-mono uppercase tracking-widest text-white/30">
          Step {step.n}
        </span>
      </div>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-white mb-1.5">{step.title}</h2>
        <p className="text-sm text-white/50 leading-relaxed mb-3">{step.body}</p>
        <Link
          href={step.href}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors"
        >
          {step.cta} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}

export default function GettingStartedPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-brand-500/20 flex items-center justify-center">
            <Rocket className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Getting Started</h1>
            <p className="text-sm text-white/40">
              From an AI prompt-leak risk to C3PAO-ready evidence — in six steps.
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-start gap-2 p-3.5 rounded-xl bg-brand-500/10 border border-brand-400/20">
          <ShieldAlert className="w-4 h-4 text-brand-300 mt-0.5 shrink-0" />
          <p className="text-sm text-brand-200">
            <span className="font-semibold">CUI-safe means Mode B.</span> The hosted trial is for
            non-CUI evaluation only. For any CUI workload, deploy the Docker image on your own
            infrastructure (Step 2).
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {STEPS.map((step, i) => (
          <StepCard key={step.n} step={step} index={i} />
        ))}
      </div>

      {/* $499 report CTA */}
      <div className="mt-8 p-5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <div className="flex items-center gap-2 mb-2">
          <FileCheck2 className="w-4 h-4 text-brand-400" />
          <span className="text-sm font-medium text-white">
            Want the evidence without a subscription?
          </span>
        </div>
        <p className="text-sm text-white/50 leading-relaxed mb-3">
          The <span className="text-white/80 font-medium">$499 one-time CMMC AI Risk Assessment
          Report</span> runs the proxy for 14 days in your own environment and returns a
          SHA-256-signed PDF risk-scoring every AI prompt event against NIST 800-171. No subscription,
          no MSA.
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors"
        >
          See the report <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Help footer */}
      <div className="mt-6 flex items-center gap-2 text-sm text-white/40">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        Stuck on a step? Ask Compliance AI from the{" "}
        <Link href="/command-center/chat" className="text-brand-400 hover:text-brand-300">
          Response section
        </Link>
        .
      </div>
    </div>
  );
}
