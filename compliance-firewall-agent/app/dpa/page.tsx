import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import Link from "next/link";
import type { Metadata } from "next";
import { ScrollProgressBar } from "@/components/scroll-effects/ScrollProgressBarClient";

export const metadata: Metadata = {
  title: "Data Processing Agreement | HoundShield",
  description:
    "HoundShield's Data Processing Agreement (DPA) for GDPR, HIPAA, and DFARS-regulated customers. Local-only architecture means prompt content never leaves your network.",
  alternates: { canonical: "https://houndshield.com/dpa" },
};

export default function DpaPage() {
  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)]">
      <ScrollProgressBar />
      <NavV3 />
      <main className="max-w-3xl mx-auto px-6 pt-16 pb-24">
        <h1 className="text-3xl font-bold text-[var(--hs-ink)] mb-2">Data Processing Agreement</h1>
        <p className="text-sm text-[var(--hs-ink-tertiary)] mb-10">Last updated: June 21, 2026</p>

        <div className="space-y-8 text-sm text-[var(--hs-ink-secondary)] leading-relaxed">
          <section>
            <p>
              This Data Processing Agreement (&ldquo;DPA&rdquo;) forms part of the
              <Link href="/terms" className="text-brand-700 hover:text-brand-700"> Terms of Service</Link>{" "}
              between the customer (&ldquo;Controller&rdquo;) and{" "}
              <strong className="text-[var(--hs-ink-secondary)]">[COMPANY LEGAL NAME]</strong>, operator of HoundShield
              (&ldquo;Processor&rdquo;),
              and governs the processing of Personal Data and Covered Defense Information. It is offered to
              satisfy GDPR Art. 28, the HIPAA Business Associate requirements, and DFARS 252.204-7012 flow-down
              obligations. For a countersigned copy, email{" "}
              <a href="mailto:legal@houndshield.com" className="text-brand-700 hover:text-brand-700">legal@houndshield.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">1. Roles &amp; Scope</h2>
            <p>
              The Controller determines the purposes and means of processing. The Processor processes data
              only on documented instructions from the Controller and solely to provide the HoundShield
              service. This DPA applies to all Personal Data, Controlled Unclassified Information (CUI), and
              Protected Health Information (PHI) processed on the Controller&rsquo;s behalf.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">2. The Local-Only Boundary</h2>
            <p>
              HoundShield&rsquo;s scanning engine runs inside the Controller&rsquo;s own network. Prompt content,
              CUI, PHI, and PII are inspected on-premise and{" "}
              <strong className="text-[var(--hs-ink)]">never transmitted to HoundShield&rsquo;s servers</strong>.
              The Processor receives only metadata — prompt hashes, risk classifications, detected entity types,
              and timestamps — which contains no raw sensitive content. This architecture means the largest
              category of regulated data is structurally outside the scope of any sub-processing relationship.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">3. Sub-processors</h2>
            <p>The Processor engages the following sub-processors for the cloud control plane (account, billing, metadata):</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong className="text-[var(--hs-ink-secondary)]">Supabase</strong> — authentication &amp; metadata database (US region)</li>
              <li><strong className="text-[var(--hs-ink-secondary)]">Vercel</strong> — application hosting / edge network</li>
              <li><strong className="text-[var(--hs-ink-secondary)]">Stripe</strong> — payment processing</li>
              <li><strong className="text-[var(--hs-ink-secondary)]">Resend</strong> — transactional email</li>
            </ul>
            <p className="mt-2">
              The Processor will give 30 days&rsquo; notice of any new sub-processor and the Controller may object
              on reasonable data-protection grounds.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">4. Security Measures</h2>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>AES-256 encryption for any quarantined content at rest</li>
              <li>TLS 1.3 for all data in transit</li>
              <li>SHA-256 append-only cryptographic audit trail</li>
              <li>Row-Level Security (RLS) isolating each tenant&rsquo;s metadata</li>
              <li>Principle of least privilege for all internal access</li>
            </ul>
            <p className="mt-2">
              See the full <Link href="/security" className="text-brand-700 hover:text-brand-700">Security &amp; Trust</Link> page.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">5. Data Subject Rights &amp; Assistance</h2>
            <p>
              The Processor will assist the Controller in responding to data-subject requests (access, correction,
              deletion, portability) and in meeting breach-notification obligations. Because content stays local,
              most data-subject requests can be fulfilled by the Controller without involving the Processor.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">6. Breach Notification</h2>
            <p>
              The Processor will notify the Controller without undue delay, and in any case within 72 hours, after
              becoming aware of a Personal Data breach affecting the control plane, including the nature of the
              breach and the measures taken to mitigate it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">7. Return &amp; Deletion</h2>
            <p>
              On termination, the Processor will delete or return all Controller metadata within 30 days, except
              where retention is required by law. Local prompt content is already under the Controller&rsquo;s sole
              custody and is unaffected.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">8. International Transfers</h2>
            <p>
              Where EU/UK Personal Data is processed, the parties incorporate the EU Standard Contractual Clauses
              (2021/914) and the UK International Data Transfer Addendum by reference.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">9. Contact</h2>
            <p>
              Data-protection inquiries:{" "}
              <a href="mailto:legal@houndshield.com" className="text-brand-700 hover:text-brand-700">legal@houndshield.com</a>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--hs-border-subtle)] flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/privacy" className="text-sm text-brand-700 hover:text-brand-700">Privacy Policy &rarr;</Link>
          <Link href="/terms" className="text-sm text-brand-700 hover:text-brand-700">Terms of Service &rarr;</Link>
          <Link href="/security" className="text-sm text-brand-700 hover:text-brand-700">Security &amp; Trust &rarr;</Link>
        </div>
      </main>
      <FooterV3 />
    </div>
  );
}
