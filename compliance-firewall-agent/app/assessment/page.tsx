import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import Link from "next/link";
import type { Metadata } from "next";
import { ScrollProgressBar } from "@/components/scroll-effects/ScrollProgressBarClient";
import { ReportCheckoutButton } from "@/components/ReportCheckoutButton";
import { Check, ShieldCheck, FileText, Server, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "CMMC AI Risk Assessment Report — $499 | HoundShield",
  description:
    "A $499 one-time CMMC AI Risk Assessment Report. We scan your AI usage locally, map findings to NIST 800-171, and deliver a tamper-evident PDF your assessor accepts. Data never leaves your network.",
  alternates: { canonical: "https://houndshield.com/assessment" },
};

const INCLUDES = [
  "Local scan of your AI prompt traffic across 16 detection engines (CUI / PHI / PII / IP / ITAR)",
  "Findings mapped to NIST 800-171 Rev 2 controls with your SPRS impact",
  "Tamper-evident, SHA-256 hash-chained audit trail",
  "5-page PDF an assessor can drop into your evidence package",
  "Mode B (Docker) deployment — prompt content never leaves your network",
  "A 30-minute readout of the findings and recommended next steps",
];

const STEPS = [
  { icon: FileText, title: "1. Order & intake", body: "Pay the flat $499. We send a 5-minute intake: which AI tools, how many seats, your environment." },
  { icon: Server, title: "2. Local scan (Mode B)", body: "Run the Docker proxy on your own infrastructure. It scans every prompt locally — nothing leaves your boundary." },
  { icon: ShieldCheck, title: "3. Your evidence PDF", body: "You receive the assessment report mapped to NIST 800-171, ready for your C3PAO or HIPAA auditor." },
];

export default function AssessmentPage() {
  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)]">
      <ScrollProgressBar />
      <NavV3 />
      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        {/* Hero */}
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--hs-steel-dark)] mb-3">
          The fastest CMMC / HIPAA AI evidence
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-[var(--hs-ink)] mb-4 leading-tight">
          CMMC AI Risk Assessment Report
        </h1>
        <p className="max-w-2xl text-lg text-[var(--hs-ink-secondary)] leading-relaxed mb-6">
          Your staff are pasting sensitive data into ChatGPT and Copilot right now — with no audit
          trail. For <strong className="text-[var(--hs-ink)]">$499, one time</strong>, we scan your AI
          usage locally and hand you the evidence an assessor asks for. No subscription, no procurement
          cycle, no data leaving your network.
        </p>

        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 mb-8">
          <span className="font-mono text-5xl font-bold text-[var(--hs-ink)]">$499</span>
          <span className="text-[var(--hs-ink-tertiary)]">one-time · per organization · delivered in days</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-4">
          <ReportCheckoutButton />
          <Link
            href="/contact?topic=assessment-report"
            className="inline-flex items-center rounded-xl border border-[var(--hs-border)] px-6 py-3.5 text-base font-medium text-[var(--hs-ink-secondary)] transition-colors hover:bg-[var(--hs-surface-1)]"
          >
            Talk to us first
          </Link>
        </div>
        <p className="flex items-center gap-1.5 text-sm text-[var(--hs-ink-tertiary)]">
          <Clock className="h-4 w-4" aria-hidden /> Most reports delivered within days of intake.
        </p>

        {/* What's included */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-[var(--hs-ink)] mb-6">What you get</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {INCLUDES.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                <span className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* How it works */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-[var(--hs-ink)] mb-6">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {STEPS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-[var(--hs-border)] bg-white p-6 shadow-sm">
                <Icon className="h-6 w-6 text-[var(--hs-steel)] mb-3" aria-hidden />
                <h3 className="text-base font-semibold text-[var(--hs-ink)] mb-2">{title}</h3>
                <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* The moat */}
        <section className="mt-16 rounded-2xl border border-[var(--hs-border)] bg-[var(--hs-surface-1)] p-8">
          <h2 className="text-2xl font-bold text-[var(--hs-ink)] mb-3">Why local-only matters</h2>
          <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed mb-4">
            Every cloud-based AI DLP tool sends your sensitive data to its servers to scan it — itself a
            potential HIPAA or DFARS 7012 exposure. HoundShield scans on your own infrastructure
            (Mode B, Docker) in under 10ms. The data that matters never leaves your network. A cloud
            competitor structurally cannot match that boundary.
          </p>
          <p className="text-sm text-[var(--hs-ink-tertiary)]">
            Read the full <Link href="/security" className="text-brand-700 hover:text-brand-700">Security &amp; Trust</Link> page,
            or our <Link href="/dpa" className="text-brand-700 hover:text-brand-700">Data Processing Agreement</Link>.
          </p>
        </section>

        {/* Final CTA */}
        <section className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-[var(--hs-ink)] mb-4">Get your evidence in days, not months</h2>
          <div className="flex justify-center">
            <ReportCheckoutButton label="Order the $499 report" />
          </div>
          <p className="mt-4 text-sm text-[var(--hs-ink-tertiary)]">
            Are you an RPO or MSP? <Link href="/partners" className="text-brand-700 hover:text-brand-700">See the partner program →</Link>
          </p>
        </section>
      </main>
      <FooterV3 />
    </div>
  );
}
