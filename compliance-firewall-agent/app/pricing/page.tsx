import { ReportOfferCard } from '@/components/ReportOfferCard'
import { NavV3 } from '@/components/layout/NavV3'
import { FooterV3 } from '@/components/layout/FooterV3'
import { FaqSection } from '@/components/seo/FaqSection'
import { pricingFaqs } from '@/lib/seo/faqs'

/* ─────────────────────────────────────────────────────────────────
 * /pricing — ONE offer: the $499 one-time AI Risk Assessment Report.
 *
 * The subscription grid (Free/$199/$499-mo/$999 + $2,499 Agency) and the
 * tier-compare table were removed deliberately. Two reasons:
 *   1. CLAUDE.md pricing doctrine — ONE grid, and never lead with a
 *      subscription before the $499 report is proven to sell.
 *   2. "$499 one-time" and "Growth $499/mo" sat on the same page, so a
 *      buyer could not tell what $499 actually bought. That ambiguity
 *      costs conversions on the only page where money changes hands.
 *
 * Subscription tiers come back only after 3 customers have paid $499,
 * and never as a second grid on this page. Locked by
 * __tests__/pricing-single-offer.test.tsx.
 * ───────────────────────────────────────────────────────────────── */

export default function PricingPage() {
  return (
    <div className="hermes" style={{ minHeight: '100vh' }}>
      <NavV3 />

      <main className="page">
        <div className="section">
          <div className="container">
            <div className="section-head" style={{ marginBottom: 28 }}>
              <div className="eyebrow">Pricing</div>
              <h1 className="display">One report. One price. No subscription.</h1>
              <p>
                A $499 one-time AI Risk Assessment Report: we scan your team&apos;s real AI
                prompts on your own hardware and hand you a signed PDF mapped to NIST 800-171.
                No contract, no seats to count, no procurement review.
              </p>
            </div>

            <ReportOfferCard />

            <p className="center muted" style={{ marginTop: 18, fontSize: '.82rem' }}>
              One-time purchase, delivered as a PDF. 30-day money-back guarantee.
            </p>
          </div>
        </div>

        {/* FAQ — visible Q&A + FAQPage JSON-LD (AEO), one shared component. */}
        <div className="section alt">
          <div className="container">
            <FaqSection
              items={pricingFaqs}
              title="Pricing questions, answered"
              className="!py-0"
            />
          </div>
        </div>
      </main>

      <FooterV3 />
    </div>
  )
}
