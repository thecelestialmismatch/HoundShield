import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import { ModeBNotice } from "@/components/ModeBNotice";
import { OrderConfirmation } from "@/components/reports/OrderConfirmation";
import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, ArrowRight, Server, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Order confirmed — CMMC AI Risk Assessment Report | HoundShield",
  description:
    "Your $499 CMMC AI Risk Assessment Report is confirmed. Deploy the proxy in your own environment and receive a SHA-256-signed PDF mapped to NIST 800-171 in 14 days.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://houndshield.com/report/thank-you" },
};

const STEPS = [
  {
    icon: Server,
    title: "Deploy the proxy (Mode B / Docker)",
    body: "Run HoundShield in your own infrastructure — about 15 minutes. It scans locally; prompt content never leaves your network.",
  },
  {
    icon: FileText,
    title: "Point your AI tools at it",
    body: "Change one base URL. Works with any OpenAI-compatible SDK — ChatGPT, Copilot, Claude, Gemini. The proxy observes for 14 days.",
  },
  {
    icon: CheckCircle2,
    title: "Receive your signed PDF",
    body: "On day 14 you get a SHA-256-signed report risk-scoring every AI prompt event against NIST 800-171 Rev 2 — the evidence a C3PAO assessor expects.",
  },
];

export default async function ReportThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)]">
      <NavV3 />
      <main className="max-w-3xl mx-auto px-6 pt-16 pb-24">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-[rgba(5,150,105,0.1)] border border-[rgba(5,150,105,0.2)] flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-[var(--hs-success)]" />
          </div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--hs-success)]">
            Payment confirmed
          </p>
        </div>

        <h1 className="text-4xl font-bold text-[var(--hs-ink)] mb-4">
          Your CMMC AI Risk Assessment Report is on the way.
        </h1>
        <p className="max-w-2xl text-base text-[var(--hs-ink-secondary)] leading-relaxed mb-10">
          A confirmation with deployment instructions is in your inbox. Here&apos;s the 14-day path
          from policy violation to C3PAO-ready evidence.
        </p>

        <OrderConfirmation sessionId={session_id} />

        <div className="grid grid-cols-1 gap-4 mb-12">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="flex items-start gap-4 rounded-2xl border border-[var(--hs-border)] bg-white p-6 shadow-sm"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-sm font-bold text-brand-600">
                {i + 1}
              </div>
              <div>
                <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-[var(--hs-ink)]">
                  <step.icon className="h-4 w-4 text-[var(--hs-steel-dark)]" aria-hidden />
                  {step.title}
                </h2>
                <p className="text-sm leading-relaxed text-[var(--hs-ink-secondary)]">{step.body}</p>
              </div>
            </div>
          ))}
        </div>

        <ModeBNotice variant="inline" className="mb-10" />

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/docs/quickstart" className="btn-primary px-7 py-3">
            Deploy the proxy now <ArrowRight className="w-4 h-4" />
          </Link>
          <a href="mailto:support@houndshield.com" className="btn-ghost px-7 py-3">
            Get deployment help
          </a>
        </div>
      </main>
      <FooterV3 />
    </div>
  );
}
