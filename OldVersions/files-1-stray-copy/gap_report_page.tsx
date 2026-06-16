import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CMMC AI Risk Assessment Report | HoundShield — $499",
  description:
    "14-day AI prompt monitoring. SHA-256-signed PDF. Every AI prompt event risk-scored against NIST 800-171 controls. Defensible evidence for your C3PAO pre-assessment. $499 flat fee.",
};

const deliverables = [
  "14 days of AI prompt monitoring on your network (Docker, nothing leaves your boundary)",
  "SHA-256-signed PDF: every AI prompt event risk-scored against NIST 800-171 Rev 2 controls",
  "Control-level gap analysis: which of 110 controls your current AI usage puts at risk",
  "Remediation priority list: ranked by C3PAO assessment risk, not severity theater",
  "Acceptable Use Policy template pre-mapped to AT.2.056 / SC.3.177 / AU.2.041",
  "One 30-minute review call to walk through findings",
];

const faqs = [
  {
    q: "Does this require a subscription?",
    a: "No. This is a flat $499 one-time payment. No recurring charge, no MSA required for a PO at this amount.",
  },
  {
    q: "What does \"AI prompt monitoring\" mean?",
    a: "We run HoundShield in observe-only mode (no blocking) on your network for 14 days. The proxy captures metadata — which employees are using which AI tools and what categories of data are appearing in prompts. No prompt content is stored anywhere.",
  },
  {
    q: "Does the PDF count as evidence for a C3PAO assessment?",
    a: "It documents your AI usage posture and maps gaps to specific NIST 800-171 controls — the same control families a C3PAO will evaluate. It is not a C3PAO assessment itself. It is pre-assessment evidence that shows you've identified and are addressing your AI-related gaps.",
  },
  {
    q: "Do you handle our CUI during this engagement?",
    a: "No. HoundShield runs entirely on your hardware in Mode B (Docker). Prompt content never leaves your network. We receive only a scan count and a hashed license key for billing.",
  },
  {
    q: "We're a healthcare organization, not a defense contractor. Does this apply to us?",
    a: "Yes. The same AI prompt leakage problem applies under HIPAA. We map findings to HIPAA §164.312 controls as well as NIST 800-171. The $499 price and process are identical.",
  },
];

export default function GapReportPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="mb-8">
        <span className="text-xs font-mono font-semibold bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
          CMMC AI Risk Assessment
        </span>
        <h1 className="text-3xl font-semibold mt-3 mb-2">
          Know exactly what your employees are sending to ChatGPT.
        </h1>
        <p className="text-gray-500 text-lg">
          14-day monitoring. SHA-256-signed PDF. Control-level gap analysis against all 110 NIST 800-171 Rev 2
          controls. Defensible evidence before your C3PAO assessment.
        </p>
      </div>

      {/* Price CTA */}
      <div className="border-2 border-blue-200 rounded-xl p-6 mb-10 bg-blue-50/30">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-4xl font-bold">$499</span>
          <span className="text-gray-500">one-time · no subscription</span>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          No MSA required. Most organizations approve a $499 PO without a security review.
        </p>
        <a
          href="mailto:hello@houndshield.com?subject=CMMC AI Risk Report — $499"
          className="block w-full text-center bg-blue-600 text-white rounded-lg py-3 font-semibold hover:bg-blue-700 transition-colors"
        >
          Get your report — email us to start
        </a>
        <p className="text-xs text-gray-400 text-center mt-2">
          We respond within 4 hours. Monitoring starts within 24 hours of Docker setup.
        </p>
      </div>

      {/* Deliverables */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">What you get</h2>
        <ul className="space-y-3">
          {deliverables.map((d) => (
            <li key={d} className="flex gap-3 text-sm">
              <span className="text-green-500 font-bold flex-shrink-0">✓</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Timeline */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">How it works</h2>
        <ol className="space-y-4">
          {[
            { day: "Day 0", label: "Setup", desc: "You run docker pull houndshield/proxy:latest on your own infrastructure. 10 minutes. We provide a license key." },
            { day: "Days 1–14", label: "Monitoring", desc: "HoundShield captures AI prompt metadata on your network. Observe-only mode — no blocking. Nothing leaves your boundary." },
            { day: "Day 15", label: "Report delivered", desc: "SHA-256-signed PDF with full control mapping, risk ranking, and remediation list." },
            { day: "Day 16", label: "Review call", desc: "30-minute call to walk through findings and answer questions from your IT Security Manager or ISSO." },
          ].map((step) => (
            <li key={step.day} className="flex gap-4">
              <div className="flex-shrink-0 w-20 text-right">
                <span className="text-xs font-mono font-semibold text-gray-400">{step.day}</span>
              </div>
              <div className="border-l border-gray-200 pl-4 pb-4">
                <p className="font-semibold text-sm">{step.label}</p>
                <p className="text-sm text-gray-500 mt-0.5">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">Frequently asked</h2>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.q} className="border border-gray-200 rounded-lg p-4">
              <p className="font-semibold text-sm mb-1.5">{faq.q}</p>
              <p className="text-sm text-gray-600">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* For RPOs */}
      <section className="border border-gray-200 rounded-xl p-6 bg-gray-50">
        <h2 className="font-semibold mb-2">RPO / MSP partnership</h2>
        <p className="text-sm text-gray-600 mb-3">
          We offer a 40–50% revenue share for RPOs and CMMC-focused MSPs who co-brand this report
          as part of their readiness packages. White-label PDF available. Exclusive territory for
          first 10 partners.
        </p>
        <a
          href="mailto:partners@houndshield.com?subject=RPO Partnership — Gap Report"
          className="text-sm text-blue-600 underline"
        >
          Contact partners@houndshield.com →
        </a>
      </section>
    </main>
  );
}
