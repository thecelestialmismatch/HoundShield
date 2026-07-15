import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileCheck2, Percent, Timer } from "lucide-react";
import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import { FaqAccordion } from "@/components/ui/FaqAccordion";

const TITLE = "RPO & MSP Partner Kit — Co-Branded CMMC AI Risk Assessments | HoundShield";
const DESCRIPTION =
  "Resell the CMMC AI Risk Assessment under your brand: $299 wholesale, you set the retail. The complete RPO/MSP partner kit — how it works, margins, and what your clients receive.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://houndshield.com/partners/kit" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://houndshield.com/partners/kit",
    type: "website",
  },
};

const STEPS = [
  {
    title: "Your client runs the proxy for 14 days",
    body: "Self-hosted Docker on the client's own infrastructure — their prompt content never leaves their network. Deployment is one URL change; most clients are running in under 15 minutes.",
  },
  {
    title: "The assessment engine scores every AI prompt event",
    body: "16 detection engines flag CUI, ITAR, PHI, and PII patterns; every event is risk-scored against NIST 800-171 Rev 2 controls and written to a SHA-256 hash-chained log.",
  },
  {
    title: "You deliver a co-branded, signed PDF",
    body: "The report carries your firm's branding alongside the findings: what the client's AI traffic contained, which controls it implicates, and the remediation sequence — evidence they can put in front of an assessor.",
  },
];

const FAQS = [
  {
    q: "Who can join the partner program?",
    a: "Registered Provider Organizations (RPOs), MSPs, MSSPs, and compliance consultancies that advise defense contractors, healthcare organizations, or law firms. C3PAOs are excluded by design: conflict-of-interest rules (32 CFR Part 170 / ISO 17020) bar assessment organizations from recommending products to clients they assess, and we respect that line.",
  },
  {
    q: "What does the co-branded report cost?",
    a: "$299 wholesale to partners. You set your own retail — partners typically deliver it at $499 to $999 as part of a broader readiness engagement, keeping the margin and the client relationship.",
  },
  {
    q: "Do our clients' prompts ever reach HoundShield?",
    a: "No. The proxy runs on the client's own infrastructure (self-hosted Docker), and scanning happens locally. The report is generated from the client's own event log; prompt content is never transmitted to HoundShield or to you.",
  },
  {
    q: "Why lead with a one-time report instead of a subscription?",
    a: "A one-time deliverable clears procurement fast and gives your client an immediate, tangible artifact for their SSP. Clients who want continuous monitoring afterward can move to a recurring plan — with you still in the loop.",
  },
];

export default function PartnerKitPage() {
  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)] text-[var(--hs-ink)]">
      <NavV3 />
      <main className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <p className="text-xs font-semibold tracking-[0.14em] uppercase text-[var(--hs-steel-dark)] font-[var(--font-mono)]">
          Partner Program · RPOs, MSPs &amp; Compliance Consultancies
        </p>
        <h1 className="mt-4 font-[var(--font-display)] text-3xl md:text-4xl font-semibold leading-tight text-[var(--hs-ink)]">
          The co-branded CMMC AI Risk Assessment your clients are already asking for
        </h1>
        <p className="answer-lead mt-6 rounded-2xl border border-[var(--hs-border)] bg-[var(--hs-surface-2)] p-6 text-lg leading-relaxed text-[var(--hs-ink)]">
          Your clients&rsquo; employees are pasting sensitive data into ChatGPT today, and their next
          assessment will ask about it. The partner kit lets you answer with a deliverable: a
          14-day, locally run AI risk assessment producing a signed PDF mapped to NIST 800-171 —
          under your brand, at $299 wholesale, retailing wherever you position it.
        </p>

        {/* Economics strip */}
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--hs-border)] bg-[var(--hs-surface-1)] p-5">
            <Percent className="h-5 w-5 text-[var(--hs-steel-dark)]" />
            <p className="mt-2 text-2xl font-bold text-[var(--hs-ink)]">$299</p>
            <p className="text-sm text-[var(--hs-ink-secondary)]">wholesale per report — you set the retail</p>
          </div>
          <div className="rounded-2xl border border-[var(--hs-border)] bg-[var(--hs-surface-1)] p-5">
            <Timer className="h-5 w-5 text-[var(--hs-steel-dark)]" />
            <p className="mt-2 text-2xl font-bold text-[var(--hs-ink)]">14 days</p>
            <p className="text-sm text-[var(--hs-ink-secondary)]">from deployment to signed PDF in the client&rsquo;s hands</p>
          </div>
          <div className="rounded-2xl border border-[var(--hs-border)] bg-[var(--hs-surface-1)] p-5">
            <FileCheck2 className="h-5 w-5 text-[var(--hs-steel-dark)]" />
            <p className="mt-2 text-2xl font-bold text-[var(--hs-ink)]">110</p>
            <p className="text-sm text-[var(--hs-ink-secondary)]">NIST 800-171 Rev 2 controls in the mapping engine</p>
          </div>
        </div>

        {/* How it works */}
        <section className="mt-12">
          <h2 className="font-[var(--font-display)] text-xl font-semibold text-[var(--hs-ink)]">
            How a partner engagement runs
          </h2>
          <ol className="mt-5 space-y-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-[var(--hs-border)] bg-[var(--hs-surface-1)] p-5">
                <p className="text-sm font-semibold text-[var(--hs-steel-dark)] font-[var(--font-mono)]">
                  Step {i + 1}
                </p>
                <p className="mt-1 font-semibold text-[var(--hs-ink)]">{s.title}</p>
                <p className="mt-2 text-sm text-[var(--hs-ink-secondary)] leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* What's in the kit */}
        <section className="mt-12">
          <h2 className="font-[var(--font-display)] text-xl font-semibold text-[var(--hs-ink)]">
            What&rsquo;s in the kit
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-[var(--hs-ink-secondary)] leading-relaxed">
            <li>Co-branded report template — your logo and firm name on the deliverable</li>
            <li>Client-facing one-pager explaining the assessment (editable)</li>
            <li>Deployment runbook your technicians follow — one URL change, Docker on client infra</li>
            <li>The <Link href="/blog/cmmc-ai-use-policy-template" className="font-semibold text-[var(--hs-steel-dark)] hover:underline">control-mapped AI use policy template</Link> to deliver alongside the report</li>
            <li>Referral agreement with published wholesale terms — no exclusivity demanded</li>
          </ul>
        </section>

        {/* Compliance note — the legal line, stated plainly */}
        <section className="mt-10 rounded-2xl border border-[var(--hs-border)] bg-[var(--hs-surface-1)] p-6">
          <h2 className="font-[var(--font-display)] text-lg font-semibold text-[var(--hs-ink)]">
            A note on who this program is for
          </h2>
          <p className="mt-2 text-sm text-[var(--hs-ink-secondary)] leading-relaxed">
            This program is built for advisory-side organizations: RPOs, MSPs, MSSPs, and
            consultancies. Assessment organizations are not eligible — conflict-of-interest rules
            bar assessors from recommending products to the organizations they assess, and a
            partner program that ignored that would put your accreditation and our credibility at
            risk. The report your clients receive is designed to be handed <em>to</em> their
            assessor as evidence; the assessor stays independent.
          </p>
        </section>

        {/* FAQ — shared accordion, matches the FAQPage JSON-LD */}
        <h2 className="mt-12 font-[var(--font-display)] text-2xl font-semibold text-[var(--hs-ink)]">
          Partner questions
        </h2>
        <div className="mt-5">
          <FaqAccordion
            items={FAQS.map((f) => ({ question: f.q, answer: f.a }))}
          />
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-3xl border border-[var(--hs-border)] bg-[var(--hs-surface-2)] p-8 text-center">
          <h2 className="font-[var(--font-display)] text-2xl font-semibold text-[var(--hs-ink)]">
            Add an AI-risk deliverable to your practice this month
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-[var(--hs-ink-secondary)]">
            Tell us about your firm and client base — we&rsquo;ll send the kit, the wholesale
            agreement, and a sample report the same week.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--hs-steel-dark)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--hs-steel)]"
            >
              Request the partner kit <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/partners"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--hs-border)] px-6 py-3 text-sm font-semibold text-[var(--hs-ink)] transition hover:border-[var(--hs-steel)]"
            >
              Partner program overview
            </Link>
          </div>
        </div>
      </main>
      <FooterV3 />
    </div>
  );
}
