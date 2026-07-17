import type { Metadata } from "next";
import Link from "next/link";
import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import { ScrollProgressBar } from "@/components/scroll-effects/ScrollProgressBarClient";
import { ReportOfferCard } from "@/components/ReportOfferCard";
import { FaqHub } from "@/components/seo/FaqHub";
import { faqHubGroups } from "@/lib/seo/faqs";

export const metadata: Metadata = {
  title: "FAQ — CMMC, HIPAA, pricing & deployment answers | HoundShield",
  description:
    "Every HoundShield question in one searchable place: the $499 CMMC AI Risk Assessment Report, pricing and the free tier, HIPAA and PHI, deployment modes, SPRS scoring, and Brain AI. Deep-linkable, assessor-grade answers.",
  alternates: { canonical: "https://houndshield.com/faq" },
  openGraph: {
    title: "HoundShield FAQ — searchable compliance answers",
    description:
      "Search every HoundShield answer: the $499 report, pricing, HIPAA, CUI-safe deployment, SPRS scoring, and Brain AI.",
    url: "https://houndshield.com/faq",
    type: "website",
  },
};

/**
 * Consolidated, searchable FAQ hub.
 *
 * Intentionally emits NO FAQPage JSON-LD — each Q&A already carries FAQPage
 * schema on its origin page (pricing, hipaa, features, …); a second copy here
 * would be cross-URL structured-data duplication. The hub earns its keep
 * through search, category navigation, deep links, and internal linking.
 * Guarded by app/__tests__/faq-hub-contract.test.ts.
 */
export default function FaqHubPage() {
  const totalQuestions = faqHubGroups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="hermes" style={{ minHeight: "100vh" }}>
      <ScrollProgressBar />
      <NavV3 />

      <main>
        {/* Hero + searchable hub */}
        <section className="section">
          <div className="container">
            <div className="mx-auto max-w-3xl">
              <div className="mb-8 text-center">
                <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.22em] text-[var(--hs-steel-dark)]">
                  Help center · {totalQuestions} answers
                </p>
                <h1 className="text-[clamp(30px,5vw,46px)] font-editorial font-semibold leading-[1.06] tracking-tight text-[var(--hs-ink)]">
                  Frequently asked questions
                </h1>
                <p className="mx-auto mt-4 max-w-2xl text-[17px] leading-relaxed text-[var(--hs-ink-secondary)]">
                  Straight answers on the $499 CMMC AI Risk Assessment Report, pricing, HIPAA,
                  CUI-safe deployment, and Brain AI. Search below, jump to a topic, or share any
                  answer with a deep link.
                </p>
              </div>

              <FaqHub groups={faqHubGroups} />

              <p className="mt-10 text-center text-[15px] text-[var(--hs-ink-secondary)]">
                Still have questions?{" "}
                <Link
                  href="/contact"
                  className="font-semibold text-[var(--hs-steel-dark)] underline underline-offset-4 decoration-[var(--hs-border-strong)] transition-colors hover:decoration-[var(--hs-steel-dark)]"
                >
                  Talk to a compliance engineer
                </Link>{" "}
                — we respond within 4 business hours.
              </p>
            </div>
          </div>
        </section>

        {/* $499 report offer — the Stage-1 lead product */}
        <section className="section alt">
          <div className="container">
            <ReportOfferCard />
          </div>
        </section>
      </main>

      <FooterV3 />
    </div>
  );
}
