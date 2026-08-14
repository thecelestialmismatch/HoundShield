import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import Link from "next/link";
import type { Metadata } from "next";
import { ScrollProgressBar } from "@/components/scroll-effects/ScrollProgressBarClient";
import {
  REFUND_TERMS,
  REFUND_WINDOW_DAYS,
  REFUND_CONTACT,
  EXCLUSIONS,
} from "@/lib/legal/refund-policy";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "The full terms behind HoundShield's 30-day money-back guarantee on the $499 CMMC AI Risk Assessment Report — including how to claim one and how long it takes.",
  alternates: { canonical: "/refund" },
};

/**
 * The terms behind the "30-day money-back guarantee" that /pricing, /terms, the
 * FAQ schema and the order-confirmation email had all been promising with
 * nothing published behind them.
 *
 * Every word comes from lib/legal/refund-policy.ts so this page, the Terms of
 * Service and the guard test cannot drift — the failure that left an unfilled
 * company-legal-name placeholder on three separate pages at once.
 *
 * The literal token is not written out here on purpose: legal-contract.test.ts
 * greps these files for bracketed ALL-CAPS placeholders and does not exempt
 * comments, so quoting one would fail the guard that exists to catch it.
 */
export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)]">
      <ScrollProgressBar />
      <NavV3 />
      <main className="max-w-4xl mx-auto px-6 pt-16 pb-24">
        <h1 className="text-3xl font-bold text-[var(--hs-ink)] mb-2">Refund Policy</h1>
        <p className="text-sm text-[var(--hs-ink-tertiary)] mb-10">
          The terms behind our {REFUND_WINDOW_DAYS}-day money-back guarantee.
        </p>

        <div className="prose-dark space-y-8 text-sm text-[var(--hs-ink-secondary)] leading-relaxed">
          <section>
            <p className="text-base text-[var(--hs-ink)]">
              Ask for your money back within {REFUND_WINDOW_DAYS} days and you get all of it.
              You do not have to explain why, and it still applies after the report has been
              delivered.
            </p>
          </section>

          {REFUND_TERMS.map((term) => (
            <section key={term.heading}>
              <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">{term.heading}</h2>
              <p>{term.body}</p>
            </section>
          ))}

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">Exclusions</h2>
            {EXCLUSIONS.length === 0 ? (
              <p>
                None. Every exclusion we considered — the PDF was already delivered, you ran the
                proxy, the assessment already completed — describes someone using the product
                exactly as intended. A guarantee claimable only by a buyer who never used what
                they bought is not a guarantee.
              </p>
            ) : (
              <ul className="list-disc pl-5 space-y-1">
                {EXCLUSIONS.map((exclusion) => (
                  <li key={exclusion}>{exclusion}</li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">Chargebacks</h2>
            <p>
              Please email us before opening a dispute with your bank. Not because a chargeback
              is prohibited — it is your right and we will not contest an honest one — but
              because emailing {REFUND_CONTACT} is faster for you, and we would rather fix the
              problem than win the argument.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--hs-ink)] mb-3">Questions</h2>
            <p>
              Email{" "}
              <a href={`mailto:${REFUND_CONTACT}`} className="text-brand-700 hover:text-brand-700">
                {REFUND_CONTACT}
              </a>
              . See also our{" "}
              <Link href="/terms" className="text-brand-700 hover:text-brand-700">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-brand-700 hover:text-brand-700">
                Privacy Policy
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
      <FooterV3 />
    </div>
  );
}
