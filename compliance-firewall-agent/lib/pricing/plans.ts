/**
 * Single source of truth for all HoundShield pricing.
 *
 * Why this file exists: prices were duplicated across the pricing page, two nav
 * dropdowns, page metadata, and llms.txt, and they drifted. Everything that
 * shows a price now imports from here so the numbers can never diverge again.
 *
 * Product strategy (per the project brain): the LEAD product is the one-time
 * $499 CMMC AI Risk Assessment Report. The subscription tiers below are the
 * secondary ladder. Do not invent a second pricing grid — extend this one.
 */

export type PlanId = "free" | "pro" | "growth" | "enterprise" | "agency";

export interface PricingPlan {
  id: PlanId;
  /** Canonical plan name. Surfaces may use a friendlier display label. */
  name: string;
  /** USD per month on monthly billing. 0 = free. */
  monthlyPrice: number;
  /** USD total per year on annual billing (~20% off monthly). */
  annualTotal: number;
  /** Short note used by the compact nav dropdowns. */
  navNote: string;
  href: string;
}

/** Annual billing saves ~20% versus paying monthly. */
export const ANNUAL_DISCOUNT = 0.2;

export const PRICING_PLANS: readonly PricingPlan[] = [
  { id: "free",       name: "Free",         monthlyPrice: 0,    annualTotal: 0,     navNote: "Up to 1,000 prompts/mo",   href: "/pricing" },
  { id: "pro",        name: "Pro",          monthlyPrice: 199,  annualTotal: 1910,  navNote: "CMMC suite + AI gateway",  href: "/pricing" },
  { id: "growth",     name: "Growth",       monthlyPrice: 499,  annualTotal: 4790,  navNote: "PDF reports + C3PAO coord", href: "/pricing" },
  { id: "enterprise", name: "Enterprise",   monthlyPrice: 999,  annualTotal: 9590,  navNote: "On-prem · air-gapped",     href: "/pricing" },
  { id: "agency",     name: "Agency / MSP", monthlyPrice: 2499, annualTotal: 23990, navNote: "White-label for MSPs",     href: "/pricing" },
] as const;

/**
 * PARTNER ECONOMICS — one retail price, one flat partner discount.
 *
 * THE DRIFT THIS ENDS. Three public numbers answered "what do I make?":
 * "20% revenue share" and "$299 wholesale" on a $499 report (a 40% cut) on the
 * SAME /partners page, plus a third figure in CLAUDE.md matching neither.
 * `docs/gtm/MSP-CHANNEL-RESEARCH.md` flagged it as blocking and left the margin
 * call to the founder.
 *
 * FOUNDER RULING (2026-08-19): retail customers pay $499, partners pay $399.
 *
 * MODELLED IN DOLLARS, NOT PERCENT — deliberately. A percentage ceiling forces
 * a rounding decision on every price ($499 × 0.80 = $399.20), and whichever way
 * you round, the realised cut misses the published figure: round down to $399
 * and the cut is 20.04%, over a "20%" claim; round up to $400 and the price is
 * no longer the number the founder asked for. A flat $100 is exact, needs no
 * rounding, and is easier for a partner to hold in their head than a percentage
 * they have to compute. The percentage below is DERIVED for display only.
 *
 * Partner economics that result: $100 margin reselling at $499 (20%), $600 at
 * $999 (60%) — the top of that range sits inside the 60–70% gross margin the
 * Kitecyber source in the research doc says MSPs target.
 *
 * RETAIL STAYS $499, NOT $500. The sub-$500 figure is load-bearing: it keeps a
 * purchase under the common $500 procurement-approval threshold, which is the
 * report's entire positioning ("a $499 PO bypasses procurement review"). The
 * extra dollar would buy a round number and cost the thing the product is for.
 */

/** Retail price of the lead product. Never below $499, and never $500 — see above. */
const RISK_REPORT_RETAIL = 499;

/** Flat dollars off retail for an approved RPO/MSP partner. Exact, no rounding. */
export const PARTNER_DISCOUNT_USD = 100;

/**
 * The lead product — a one-time CMMC AI Risk Assessment Report. Sold direct at
 * $499; approved partners co-brand it at the wholesale price below and set
 * their own retail ($499–$999).
 *
 * `wholesalePrice` is COMPUTED from the discount, never typed alongside it —
 * typing both independently is exactly how $299 and a published "20%" managed
 * to coexist on the same page.
 */
export const RISK_REPORT = {
  name: "CMMC AI Risk Assessment Report",
  oneTimePrice: RISK_REPORT_RETAIL,
  wholesalePrice: RISK_REPORT_RETAIL - PARTNER_DISCOUNT_USD,
  resaleLow: 499,
  resaleHigh: 999,
} as const;

/** Display copy for the partner discount, e.g. "$100 off". The canonical phrasing. */
export const PARTNER_DISCOUNT_LABEL = `$${PARTNER_DISCOUNT_USD} off`;

/**
 * The discount as a whole-number percentage, for surfaces that want one.
 * Derived — never write a percentage literal in copy or it will drift.
 */
export const PARTNER_DISCOUNT_PCT = Math.round(
  (PARTNER_DISCOUNT_USD / RISK_REPORT_RETAIL) * 100,
);

/** Wholesale price in cents, for Stripe. Derived — never hardcode this. */
export const RISK_REPORT_WHOLESALE_CENTS = RISK_REPORT.wholesalePrice * 100;

/** Retail price in cents, for Stripe. Derived — never hardcode this. */
export const RISK_REPORT_RETAIL_CENTS = RISK_REPORT.oneTimePrice * 100;

/** Partner's gross margin reselling at `retail`, as a percentage (0–100). */
export function partnerMarginPct(retail: number): number {
  return Math.round(((retail - RISK_REPORT.wholesalePrice) / retail) * 100);
}

/**
 * THE PARTNER ENGAGEMENT — a distinct SKU, not a resale of the $499 report.
 *
 * THE PROBLEM THIS SOLVES (market research, 2026-08-21)
 * ----------------------------------------------------
 * Zero partners had signed, and the reason was arithmetic, not sales effort.
 * MSP compliance assessments list at $500–$2,000 (ScalePad's compliance pricing
 * calculator) and MSSPs target 60–75% gross margin (ContraForce). A partner
 * buying at $399 and reselling the SAME artifact at its PUBLISHED $499 clears
 * 20% — far below the floor a channel will carry.
 *
 * The trap is the published price itself: HoundShield sells direct at a public
 * $499, so a partner cannot quote $999 for the identical deliverable. Their
 * client finds the vendor's own price in one search. You cannot tell a partner
 * "you set the retail" while advertising the retail to their client.
 *
 * THE FIX — SELL A DIFFERENT THING, NOT A CHEAPER THING
 * ----------------------------------------------------
 * Founder ruling (2026-08-21): do NOT cut wholesale and do NOT hide the direct
 * price. The $499 self-serve artifact and the $399 flat partner discount both
 * stand exactly as the 2026-08-19 ruling set them. What changes is what the
 * partner SELLS: a scoped engagement that WRAPS the report in work only the
 * partner can do — their branding, a remediation roadmap sequenced for that
 * client, and a live readout with the client's team.
 *
 * That is ordinary channel economics: the vendor supplies the artifact, the
 * partner supplies the service, and the spread is the partner's own labour
 * rather than a discount HoundShield funds. No money leaves; nothing is
 * rebated. It also removes the comparison — a $1,250 advisory engagement is
 * not the $499 self-serve PDF, so there is no published price undercutting it.
 *
 * HONESTY CONSTRAINT: never imply the engagement is a different SCAN. The
 * detection engines and the evidence artifact are identical. What the client
 * pays more for is the interpretation and the remediation work around it, and
 * partner-facing copy must say so plainly.
 */
export const PARTNER_ENGAGEMENT = {
  name: "Co-Branded AI Risk Engagement",

  /** What the partner pays HoundShield — unchanged from the flat-$100 ruling. */
  wholesaleCost: RISK_REPORT.wholesalePrice,

  /** Suggested list band for the partner's own client. Guidance, not a rule. */
  suggestedListLow: 1200,
  suggestedListHigh: 1500,

  /**
   * What the PARTNER adds on top of the artifact. This is the whole basis for
   * the price difference — if a partner does none of it, they are reselling the
   * $499 report and should price it accordingly.
   */
  partnerDelivers: [
    "Their firm's branding on the assessment report",
    "A remediation roadmap sequenced for that client's environment",
    "A live findings readout with the client's team",
    "Ongoing advisory follow-up against the identified gaps",
  ] as const,

  /** Identical to the direct product — stated so no surface can imply otherwise. */
  identicalToDirect:
    "The detection engines, the scan and the evidence artifact are exactly the same as the $499 self-serve report. The engagement price reflects the partner's interpretation and remediation work, not a different or deeper scan.",
} as const;

/** Partner gross margin at the low end of the suggested engagement band. */
export const PARTNER_ENGAGEMENT_MARGIN_LOW_PCT = partnerMarginPct(
  PARTNER_ENGAGEMENT.suggestedListLow,
);

/** Partner gross margin at the high end of the suggested engagement band. */
export const PARTNER_ENGAGEMENT_MARGIN_HIGH_PCT = partnerMarginPct(
  PARTNER_ENGAGEMENT.suggestedListHigh,
);

/** Format a whole-dollar USD amount, e.g. 2499 -> "$2,499". */
export function formatUSD(amount: number): string {
  return `$${amount.toLocaleString("en-US")}`;
}

/** Look up a plan by id. Throws on an unknown id so typos fail loudly. */
export function getPlan(id: PlanId): PricingPlan {
  const plan = PRICING_PLANS.find((p) => p.id === id);
  if (!plan) throw new Error(`Unknown plan id: ${id}`);
  return plan;
}

/** The per-month figure when billed annually (rounded), e.g. 1910 -> 159. */
export function annualMonthly(plan: PricingPlan): number {
  return Math.round(plan.annualTotal / 12);
}

/**
 * Price fields shaped for the pricing-page plan cards. `annualPrice` mirrors
 * `annualTotal` (the page treats them identically) so the card author only
 * keeps copy/features local while the numbers stay sourced from here.
 */
export function getPlanPrice(id: PlanId): {
  monthlyPrice: number;
  annualPrice: number;
  annualTotal: number;
} {
  const { monthlyPrice, annualTotal } = getPlan(id);
  return { monthlyPrice, annualPrice: annualTotal, annualTotal };
}
