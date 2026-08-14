import { RISK_REPORT, formatUSD } from "@/lib/pricing/plans";
import { LEGAL_ENTITY } from "@/lib/legal/entity";

/**
 * The refund terms — one constant, one place, matching what is actually sold.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * "30-day money-back guarantee" was published on FOUR surfaces with no policy
 * behind it anywhere:
 *
 *   app/pricing/page.tsx          under the offer card
 *   app/terms/page.tsx §4         as one clause about subscriptions
 *   lib/seo/faqs.ts               inside FAQPage JSON-LD, which answer engines quote
 *   lib/email/templates/report-order.ts   in the receipt a paying buyer receives
 *
 * There was no `/refund` page and no statement of how to claim, what the window
 * runs from, or how long a refund takes. A guarantee a buyer cannot read the
 * terms of is a promise on the marketing page and nothing behind it — and it is
 * the specific thing a procurement reviewer asks for before a $499 PO clears.
 * Stripe also requires merchants to publish a refund policy.
 *
 * WHAT WAS WRONG BEYOND THE MISSING PAGE
 * --------------------------------------
 * `/terms` §4 described refunds ONLY for "paid subscriptions billed in advance
 * on a monthly or annual basis" that you may "cancel at any time". HoundShield
 * does not sell a subscription. `/pricing` sells exactly one thing: a one-time
 * report. So the refund terms for the only purchasable product were unstated,
 * while terms for products that do not exist were published — the same class of
 * defect as the schema.org six-tier bug fixed in #275, where machine-readable
 * output advertised prices with no checkout behind them.
 *
 * THE WINDOW IS NOT NARROWED HERE
 * -------------------------------
 * This file CODIFIES the promise already made in public; it does not reduce it.
 * Writing a policy that is stingier than the guarantee already advertised to
 * every visitor would be worse than having no page at all — it would retroactively
 * shrink a live commitment, which is precisely the conduct the FTC's guidance on
 * advertised guarantees exists to stop. So: 30 days, full amount, and explicitly
 * still refundable after the PDF has been delivered, because "money-back
 * guarantee" on a deliverable that is a PDF can honestly mean nothing else.
 *
 * No exclusions are invented. If a carve-out is ever genuinely needed, it is a
 * founder decision, it goes in `EXCLUSIONS` below, and the guard test will make
 * sure the page and the marketing copy move together.
 */

/** Days from purchase in which a refund may be requested. */
export const REFUND_WINDOW_DAYS = 30;

/**
 * The exact phrase used on every marketing surface. Exported so the guard test
 * can assert the surfaces and this policy cannot drift apart — the failure mode
 * being a page that says 14 days while /pricing still promises 30.
 */
export const REFUND_GUARANTEE_PHRASE = `${REFUND_WINDOW_DAYS}-day money-back guarantee`;

/** Business days Stripe typically takes to return funds to the original method. */
export const REFUND_SETTLEMENT_DAYS = "5–10 business days";

/** Where a refund request is sent. Reuses the mailbox the other policies publish. */
export const REFUND_CONTACT = LEGAL_ENTITY.legalEmail;

/**
 * Conditions that void a refund.
 *
 * DELIBERATELY EMPTY. Every plausible exclusion — "PDF already delivered",
 * "you used the proxy", "assessment already run" — describes the normal,
 * intended use of a product whose entire deliverable is a PDF produced by
 * running the proxy. Excluding those would make the guarantee claimable only by
 * someone who never used what they bought, which is not a guarantee, it is a
 * technicality. Kept as an explicit empty list rather than as silence so that
 * adding one is a visible, reviewed act.
 */
export const EXCLUSIONS: readonly string[] = [];

export interface RefundTerm {
  readonly heading: string;
  readonly body: string;
}

/**
 * The policy itself, as data — so `/refund`, `/terms` and the guard test all
 * read the same words instead of three prose copies drifting apart, which is
 * exactly how `[COMPANY LEGAL NAME]` survived on three pages at once.
 */
export const REFUND_TERMS: readonly RefundTerm[] = [
  {
    heading: "What is covered",
    body:
      `The ${RISK_REPORT.name} — a one-time purchase of ${formatUSD(RISK_REPORT.oneTimePrice)}, ` +
      `and the ${formatUSD(RISK_REPORT.wholesalePrice)} co-branded wholesale order placed by an ` +
      `RPO or MSP partner. This is the only product HoundShield sells today; there is no ` +
      `subscription, no seat count and no minimum term, so there is nothing to cancel.`,
  },
  {
    heading: `The ${REFUND_WINDOW_DAYS}-day window`,
    body:
      `You may request a full refund within ${REFUND_WINDOW_DAYS} days of purchase. The window ` +
      `runs from the date of payment, not from the date the report is delivered — the assessment ` +
      `runs for 14 days in your environment before the PDF is produced, so measuring from delivery ` +
      `would quietly halve the guarantee.`,
  },
  {
    heading: "Delivery does not void the refund",
    body:
      `A refund is available even after the report has been generated and delivered, and even if ` +
      `you ran the proxy for the full assessment period. The deliverable is a PDF; a guarantee ` +
      `that expired the moment you received it would not be a guarantee. If the report does not ` +
      `tell you something worth ${formatUSD(RISK_REPORT.oneTimePrice)}, that is our problem, not yours.`,
  },
  {
    heading: "How to request one",
    body:
      `Email ${REFUND_CONTACT} from the address used at checkout, or reply to your order ` +
      `confirmation. No form and no justification is required — telling us why is welcome and ` +
      `genuinely useful, but it is not a condition. A human answers every message.`,
  },
  {
    heading: "How long it takes",
    body:
      `Refunds are issued to the original payment method through Stripe, typically within ` +
      `${REFUND_SETTLEMENT_DAYS} of approval. Your bank, not HoundShield, controls when the ` +
      `credit appears on a statement.`,
  },
  {
    heading: "What happens to your data",
    body:
      `A refund does not change the data boundary, because there is nothing extra to delete: in ` +
      `Mode B the proxy runs inside your own network and prompt content never reaches HoundShield ` +
      `at any point, refunded or not. Any account record held for the order is removed on request ` +
      `under the same process as any other erasure request — see the Privacy Policy.`,
  },
] as const;
