import { NavV3 } from "@/components/layout/NavV3";
import { controllerDisclosure } from "@/lib/legal/entity";
import { SUB_PROCESSORS } from "@/lib/legal/subprocessors";
import { FooterV3 } from "@/components/layout/FooterV3";
import Link from "next/link";
import type { Metadata } from "next";
import { ScrollProgressBar } from "@/components/scroll-effects/ScrollProgressBarClient";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How HoundShield collects, uses, and protects your data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)]">
      <ScrollProgressBar />
      <NavV3 />
      <main className="max-w-3xl mx-auto px-6 pt-16 pb-24">
        <h1 className="text-3xl font-bold text-[var(--hs-ink)] mb-2">Privacy Policy</h1>
        <p className="text-sm text-[var(--hs-ink-tertiary)] mb-10">Last updated: March 11, 2026</p>

        <div className="prose-dark space-y-8 text-sm text-[var(--hs-ink-secondary)] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">1. Information We Collect</h2>
            <p><strong className="text-[var(--hs-ink-secondary)]">Account Information:</strong> When you create an account, we collect your name, email address, and company name. If you sign in via OAuth (Google, GitHub, Microsoft), we receive your public profile information from those providers.</p>
            <p className="mt-2"><strong className="text-[var(--hs-ink-secondary)]">Usage Data:</strong> We collect information about how you interact with the platform, including pages visited, features used, API scan counts, and assessment progress.</p>
            <p className="mt-2"><strong className="text-[var(--hs-ink-secondary)]">Compliance Data:</strong> When you use the AI compliance firewall, we process API request metadata (prompt hashes, risk classifications, detected entities). We never store raw prompt content in plaintext — quarantined items are encrypted with AES-256.</p>
            <p className="mt-2"><strong className="text-[var(--hs-ink-secondary)]">Payment Information:</strong> Payment processing is handled entirely by Stripe. We do not store credit card numbers. We retain Stripe customer IDs and subscription status.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide and maintain the HoundShield platform</li>
              <li>Process CMMC/compliance assessments and generate reports</li>
              <li>Detect and classify sensitive data in AI API traffic</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send service-related notifications (security alerts, billing)</li>
              <li>Improve the platform through anonymized analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">3. Data Security</h2>
            <p>We implement industry-standard security measures including:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>AES-256 encryption for quarantined content at rest</li>
              <li>SHA-256 cryptographic audit trail for all compliance events</li>
              <li>TLS 1.3 encryption for all data in transit</li>
              <li>Row Level Security (RLS) in our database</li>
              <li>Regular security audits and dependency scanning</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">4. Data Sharing</h2>
            <p>We do not sell your data. We share information only with the sub-processors below.
            This list is generated from the same source of truth the <Link href="/dpa" className="text-brand-700 hover:text-brand-700">DPA</Link> uses,
            so the two documents can never disagree:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              {SUB_PROCESSORS.map((s) => (
                <li key={s.name}>
                  <strong className="text-[var(--hs-ink-secondary)]">{s.name}:</strong> {s.purpose}
                </li>
              ))}
            </ul>
            <p className="mt-2">
              Full detail, including data categories and processing region, is on the{" "}
              <Link href="/subprocessors" className="text-brand-700 hover:text-brand-700">sub-processors page</Link>.
            </p>
            <p className="mt-2">We may disclose information if required by law or to protect the rights, safety, or property of HoundShield or its users.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">5. Data Retention</h2>
            <p>
              We retain your account record and compliance event metadata for as long as your
              account is open, and we delete it on request. We do <strong className="text-[var(--hs-ink-secondary)]">not</strong> currently run an
              automatic purge, and we would rather tell you that than publish a schedule we do not
              keep: this product exists to produce audit evidence, and silently shredding a
              customer&apos;s assessor-review evidence on a timer would be the wrong default.
            </p>
            <p className="mt-2">
              To request deletion, email us and we will confirm when it is done. In Mode B
              (self-hosted) the question mostly does not arise — prompt content never reaches us,
              so there is nothing on our side to delete beyond your account record.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">6. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Access, correct, or delete your personal data</li>
              <li>Export your data in a portable format</li>
              <li>Opt out of marketing communications</li>
              <li>Withdraw consent for data processing</li>
              <li>Opt out of any sale or sharing of personal information — see below</li>
            </ul>
            <p className="mt-2">
              Residents of California, Virginia, Colorado, Connecticut, Utah, Texas and other
              states with comprehensive privacy laws have these rights under their state statute.
              We extend them to every user regardless of residence rather than checking where you
              live first. Email us to exercise any of them; we will not charge you or degrade your
              service for asking.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">7. Cookies</h2>
            <p>We use essential cookies for authentication and session management. We use anonymous analytics cookies only after you opt in via our cookie consent banner. You can control cookie preferences through the banner or your browser settings.</p>
            <p className="mt-2">Every item we store in your browser — its name, who sets it, what it is for and how long it lasts — is listed in our <Link href="/cookies" className="text-brand-700 hover:text-brand-700">Cookie Policy</Link>. ePrivacy Art. 5(3) requires that detail, not just the category.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">8. California Privacy Rights (CCPA/CPRA)</h2>
            <p>If you are a California resident, the California Consumer Privacy Act (as amended by the CPRA) gives you the right to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Know what personal information we collect, use, and disclose</li>
              <li>Request access to, or deletion of, your personal information</li>
              <li>Correct inaccurate personal information</li>
              <li>Opt out of the &ldquo;sale&rdquo; or &ldquo;sharing&rdquo; of personal information</li>
              <li>Not receive discriminatory treatment for exercising these rights</li>
            </ul>
            <p className="mt-2"><strong className="text-[var(--hs-ink-secondary)]">We do not sell or share your personal information</strong> as those terms are defined under the CCPA/CPRA. To exercise any of these rights, contact us at the address below; we will verify your request and respond within the timelines required by law. You may use an authorized agent to submit a request on your behalf.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">9. We Do Not Sell or Share Your Personal Information</h2>
            <p>
              We do not sell personal information, and we do not share it for cross-context
              behavioural advertising, as those terms are defined by the CCPA/CPRA. We run no
              advertising, retargeting or data-broker integrations, so there is no opt-out to
              offer — the answer is simply no. The complete list of third parties that process
              data on our behalf, and what each one receives, is published on our{" "}
              <Link href="/subprocessors" className="text-brand-700 hover:text-brand-700">
                Sub-processors
              </Link>{" "}
              page.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">10. Children&apos;s Privacy</h2>
            <p>
              HoundShield is a business tool sold to organisations. It is not directed to children,
              and we do not knowingly collect personal information from anyone under 13 (COPPA) or
              knowingly process the data of a minor where state law sets a higher age. If you
              believe a child has provided us information, email us and we will delete it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">11. Security Incident Notification</h2>
            <p>
              If we become aware of a breach of security leading to the accidental or unlawful
              destruction, loss, alteration, or unauthorised disclosure of your personal
              information, we will notify affected customers without undue delay, with what we know
              and what we are doing about it. Where we act as a processor for a customer, we notify
              that customer so they can meet their own notification deadlines — the specifics are
              in our{" "}
              <Link href="/dpa" className="text-brand-700 hover:text-brand-700">
                Data Processing Agreement
              </Link>.
            </p>
            <p className="mt-2">
              We will not wait for certainty before telling you something happened.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">12. Contact &amp; Data Controller</h2>
            <p>
              {controllerDisclosure()}
            </p>
            <p className="mt-2">
              The operator described above is the data controller for the personal information
              described in this policy.
            </p>
            <p className="mt-2">For privacy requests or questions, contact <a href="mailto:legal@houndshield.com" className="text-brand-700 hover:text-brand-700">legal@houndshield.com</a>.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--hs-border-subtle)]">
          <Link href="/terms" className="text-sm text-brand-700 hover:text-brand-700">
            Read our Terms of Service &rarr;
          </Link>
        </div>
      </main>
      <FooterV3 />
    </div>
  );
}
