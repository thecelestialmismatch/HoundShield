import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import Link from "next/link";
import type { Metadata } from "next";
import { ScrollProgressBar } from "@/components/scroll-effects/ScrollProgressBarClient";
import { SUB_PROCESSORS, contentTouchingSubProcessors } from "@/lib/legal/subprocessors";

export const metadata: Metadata = {
  title: "Sub-processors",
  description:
    "Every third party that processes data on HoundShield's behalf, what it receives, and where.",
  alternates: { canonical: "/subprocessors" },
};

export default function SubprocessorsPage() {
  const contentTouching = contentTouchingSubProcessors();

  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)]">
      <ScrollProgressBar />
      <NavV3 />
      <main className="max-w-4xl mx-auto px-6 pt-16 pb-24">
        <h1 className="text-3xl font-bold text-[var(--hs-ink)] mb-2">Sub-processors</h1>
        <p className="text-sm text-[var(--hs-ink-tertiary)] mb-10">
          The complete list of third parties that process data on our behalf, as required by
          GDPR Article 28(2).
        </p>

        <div className="prose-dark space-y-8 text-sm text-[var(--hs-ink-secondary)] leading-relaxed">
          <section>
            <p>
              This page is the single source of truth. Our{" "}
              <Link href="/privacy" className="text-brand-700 hover:text-brand-700">Privacy Policy</Link>{" "}
              and{" "}
              <Link href="/dpa" className="text-brand-700 hover:text-brand-700">Data Processing Addendum</Link>{" "}
              render the same underlying list, so the three documents cannot drift apart.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">
              The self-hosted boundary comes first
            </h2>
            <p>
              Everything below concerns the HoundShield <strong className="text-[var(--hs-ink-secondary)]">web
              application and hosted trial endpoint</strong> — the marketing site, your account,
              billing and the dashboard.
            </p>
            <p className="mt-2">
              It does <strong className="text-[var(--hs-ink-secondary)]">not</strong> describe
              self-hosted deployments. When you run the proxy on your own infrastructure
              (Mode&nbsp;B) or in an isolated network (Mode&nbsp;C), prompt content is scanned
              locally and never reaches us or any party on this page. That is the deployment mode
              to use for CUI or PHI. The hosted endpoint is for non-regulated evaluation only, and
              is not FedRAMP-authorized.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">Current sub-processors</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--hs-border-subtle)]">
                    <th className="py-2 pr-4 font-semibold text-[var(--hs-ink)]">Provider</th>
                    <th className="py-2 pr-4 font-semibold text-[var(--hs-ink)]">Purpose</th>
                    <th className="py-2 pr-4 font-semibold text-[var(--hs-ink)]">Data</th>
                    <th className="py-2 font-semibold text-[var(--hs-ink)]">Region</th>
                  </tr>
                </thead>
                <tbody>
                  {SUB_PROCESSORS.map((s) => (
                    <tr key={s.name} className="border-b border-[var(--hs-border-subtle)] align-top">
                      <td className="py-3 pr-4 font-medium text-[var(--hs-ink-secondary)] whitespace-nowrap">
                        {s.name}
                      </td>
                      <td className="py-3 pr-4">{s.purpose}</td>
                      <td className="py-3 pr-4 whitespace-nowrap">{s.data.join(", ")}</td>
                      <td className="py-3 whitespace-nowrap">{s.region}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">
              Which of these can see the content you type
            </h2>
            <p>
              Most providers above receive only account, billing or diagnostic data. These receive
              content you submit, and are the ones to check first:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              {contentTouching.map((s) => (
                <li key={s.name}>
                  <strong className="text-[var(--hs-ink-secondary)]">{s.name}:</strong> {s.purpose}
                </li>
              ))}
            </ul>
            <p className="mt-2">
              Neither is FedRAMP-authorized, and neither is covered by a Business Associate
              Agreement. Do not submit CUI or PHI to Brain AI or any other AI-assisted feature of
              the hosted application.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">
              Your own AI providers are not our sub-processors
            </h2>
            <p>
              When the gateway forwards a request to OpenAI, Anthropic or Google, it does so with{" "}
              <strong className="text-[var(--hs-ink-secondary)]">your</strong> API key, at your
              instruction, to a provider you already have a relationship with. We do not hold that
              relationship and do not list them here. They belong in your own record of processing
              activities.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">Changes</h2>
            <p>
              We will publish any new sub-processor here before it begins processing. To be
              notified of changes, or to object to a new sub-processor under your DPA, contact{" "}
              <a href="mailto:legal@houndshield.com" className="text-brand-700 hover:text-brand-700">
                legal@houndshield.com
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--hs-border-subtle)]">
          <Link href="/privacy" className="text-sm text-brand-700 hover:text-brand-700">
            ← Privacy Policy
          </Link>
        </div>
      </main>
      <FooterV3 />
    </div>
  );
}
