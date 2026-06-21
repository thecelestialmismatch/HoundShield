import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import Link from "next/link";
import type { Metadata } from "next";
import { ScrollProgressBar } from "@/components/scroll-effects/ScrollProgressBarClient";

export const metadata: Metadata = {
  title: "Acceptable Use Policy | HoundShield",
  description:
    "The rules governing acceptable use of the HoundShield AI compliance firewall and related services.",
  alternates: { canonical: "https://houndshield.com/acceptable-use" },
};

export default function AcceptableUsePage() {
  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)]">
      <ScrollProgressBar />
      <NavV3 />
      <main className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <h1 className="text-3xl font-bold text-[var(--hs-ink)] mb-2">Acceptable Use Policy</h1>
        <p className="text-sm text-[var(--hs-ink-tertiary)] mb-10">Last updated: June 21, 2026</p>

        <div className="space-y-8 text-sm text-[var(--hs-ink-secondary)] leading-relaxed">
          <section>
            <p>
              This Acceptable Use Policy (&ldquo;AUP&rdquo;) governs your use of HoundShield and is incorporated
              into the <Link href="/terms" className="text-brand-700 hover:text-brand-700">Terms of Service</Link>.
              We may suspend or terminate access for violations. We keep this policy short and specific.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">1. Permitted Use</h2>
            <p>
              HoundShield is licensed for lawful compliance, data-loss-prevention, and security monitoring of
              your own organization&rsquo;s AI usage. You may deploy the proxy and dashboard across the systems
              you own or are authorized to administer.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">2. Prohibited Conduct</h2>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Reselling, white-labeling, or sublicensing the service except under a signed Agency/partner agreement</li>
              <li>Reverse-engineering the detection engine to defeat or evade compliance controls</li>
              <li>Using the service to surveil individuals without a lawful basis or to intercept traffic you are not authorized to monitor</li>
              <li>Probing, scanning, or load-testing our infrastructure without prior written consent</li>
              <li>Circumventing rate limits, license validation, or tier entitlements</li>
              <li>Uploading malware, or using the service to facilitate unlawful, infringing, or harmful activity</li>
              <li>Attempting to access another tenant&rsquo;s data or accounts</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">3. Compliance Responsibility</h2>
            <p>
              HoundShield is a control that helps you meet CMMC, HIPAA, SOC 2, and DFARS obligations — it does not
              by itself constitute certification. You remain responsible for your overall compliance program and
              for configuring the service appropriately for your environment.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">4. Security Research</h2>
            <p>
              We welcome good-faith security research. Report vulnerabilities per our{" "}
              <Link href="/security" className="text-brand-700 hover:text-brand-700">Security &amp; Trust</Link> page
              and our{" "}
              <a href="/.well-known/security.txt" className="text-brand-700 hover:text-brand-700">security.txt</a>.
              Testing that respects those terms will not be treated as a violation of this AUP.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">5. Enforcement</h2>
            <p>
              We may investigate suspected violations and cooperate with law enforcement. Where practical, we will
              give notice and an opportunity to cure; egregious violations may result in immediate suspension.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">6. Contact</h2>
            <p>
              Questions or abuse reports:{" "}
              <a href="mailto:abuse@houndshield.com" className="text-brand-700 hover:text-brand-700">abuse@houndshield.com</a>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--hs-border-subtle)] flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/terms" className="text-sm text-brand-700 hover:text-brand-700">Terms of Service &rarr;</Link>
          <Link href="/privacy" className="text-sm text-brand-700 hover:text-brand-700">Privacy Policy &rarr;</Link>
          <Link href="/security" className="text-sm text-brand-700 hover:text-brand-700">Security &amp; Trust &rarr;</Link>
        </div>
      </main>
      <FooterV3 />
    </div>
  );
}
