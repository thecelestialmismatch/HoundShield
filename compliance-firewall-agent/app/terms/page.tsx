import { NavV3 } from "@/components/layout/NavV3";
import { controllerDisclosure } from "@/lib/legal/entity";
import { REFUND_WINDOW_DAYS } from "@/lib/legal/refund-policy";
import { RISK_REPORT, formatUSD } from "@/lib/pricing/plans";
import { FooterV3 } from "@/components/layout/FooterV3";
import Link from "next/link";
import type { Metadata } from "next";
import { ScrollProgressBar } from "@/components/scroll-effects/ScrollProgressBarClient";

export const metadata: Metadata = {
  title: "Terms of Service | HoundShield",
  description: "Terms and conditions for using the HoundShield compliance platform.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)]">
      <ScrollProgressBar />
      <NavV3 />
      <main className="max-w-3xl mx-auto px-6 pt-16 pb-24">
        <h1 className="text-3xl font-bold text-[var(--hs-ink)] mb-2">Terms of Service</h1>
        <p className="text-sm text-[var(--hs-ink-tertiary)] mb-10">Last updated: March 11, 2026</p>

        <div className="prose-dark space-y-8 text-sm text-[var(--hs-ink-secondary)] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using HoundShield (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you are using the Service on behalf of an organization, you represent that you have authority to bind that organization to these terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">2. Description of Service</h2>
            <p>HoundShield provides an AI compliance firewall and CMMC readiness platform that helps organizations monitor, classify, and secure their AI API traffic. The Service includes compliance assessments, SPRS scoring, AI-powered remediation guidance, and document generation.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">3. Account Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You must provide accurate and current information during registration</li>
              <li>You are responsible for all activity that occurs under your account</li>
              <li>You must notify us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">4. Billing and Refunds</h2>
            <p>
              HoundShield sells the {RISK_REPORT.name} as a{" "}
              <strong className="text-[var(--hs-ink-secondary)]">one-time purchase</strong> of{" "}
              {formatUSD(RISK_REPORT.oneTimePrice)}, charged once through Stripe. There is no
              subscription, no seat count and no minimum term, so there is nothing to cancel and
              nothing that renews.
            </p>
            <p className="mt-2">
              A full refund is available within {REFUND_WINDOW_DAYS} days of purchase, including
              after the report has been delivered. The complete terms — how to claim one, how long
              it takes, and what happens to your data — are on our{" "}
              <Link href="/refund" className="text-brand-700 hover:text-brand-700">
                Refund Policy
              </Link>{" "}
              page.
            </p>
            <p className="mt-2">We reserve the right to change pricing at any time. A price change never affects an order already placed.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to reverse engineer, decompile, or disassemble the Service</li>
              <li>Exceed your plan&apos;s usage limits through automated means</li>
              <li>Share your account credentials with unauthorized users</li>
              <li>Interfere with or disrupt the Service or its infrastructure</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">6. Compliance Disclaimer</h2>
            <p><strong className="text-[var(--hs-ink-secondary)]">Important:</strong> HoundShield is a compliance readiness tool, not a certification authority. Our CMMC assessments, SPRS scores, and generated documents are for self-assessment and preparation purposes only. They do not constitute legal advice or guarantee certification by a C3PAO (CMMC Third-Party Assessor Organization). You should consult with qualified compliance professionals for official certification guidance.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">7. Data Ownership</h2>
            <p>You retain all rights to your data. HoundShield does not claim ownership of your content, assessment responses, or compliance documents. You grant us a limited license to process your data solely for providing the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">8. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, HoundShield shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising from your use of the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">9. Termination</h2>
            <p>We may terminate or suspend your account at any time for violation of these terms. Upon termination, your right to use the Service ceases immediately. We will make your data available for export for 30 days following termination.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">10. Changes to Terms</h2>
            <p>We may update these Terms from time to time. We will notify you of material changes via email or through the Service. Continued use after changes take effect constitutes acceptance of the new terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">11. Governing Law &amp; Disputes</h2>
            <p>
              These Terms are governed by the laws of the State of Delaware, United States,
              without regard to its conflict-of-laws rules. The state and federal courts located
              in Delaware have exclusive jurisdiction over any dispute arising out of these Terms
              or the Service, and both parties consent to that venue.
            </p>
            <p className="mt-2">
              HoundShield is offered to customers in the United States. We do not currently market
              or sell the Service in the European Union or the United Kingdom, and nothing here is
              intended to displace a protection you cannot waive under the law of your place of
              residence.
            </p>
            <p className="mt-2">
              Either party may bring an individual claim in small-claims court where it qualifies.
              Nothing in these Terms prevents either party from seeking injunctive relief to
              protect its intellectual property or confidential information.
            </p>
            <p className="mt-2">
              If any provision of these Terms is held unenforceable, that provision is limited or
              severed to the minimum extent necessary and the remaining provisions stay in force.
              A failure to enforce a provision is not a waiver of it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">12. Company &amp; Contact</h2>
            {/*
              Rendered bare, exactly as /privacy does. It used to be wrapped in
              "HoundShield is operated by …" plus an empty <strong> and a
              trailing comma, which shipped to production reading:

                "HoundShield is operated by HoundShield is operated by an
                 independent sole proprietor. … regardless of entity status., ."

              controllerDisclosure() already returns a complete sentence — it
              names the party or explains why it cannot yet — so the wrapper both
              duplicated the clause and left a dangling ", .". On the section of
              a contract that identifies who the customer is contracting with,
              in a document sold to DoD subcontractors.
            */}
            <p>{controllerDisclosure()}</p>
            <p className="mt-2">Questions about these terms? Contact us at <a href="mailto:legal@houndshield.com" className="text-brand-700 hover:text-brand-700">legal@houndshield.com</a>.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--hs-border-subtle)]">
          <Link href="/privacy" className="text-sm text-brand-700 hover:text-brand-700">
            Read our Privacy Policy &rarr;
          </Link>
        </div>
      </main>
      <FooterV3 />
    </div>
  );
}
