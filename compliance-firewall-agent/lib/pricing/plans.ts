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
 * The lead product — a one-time CMMC AI Risk Assessment Report. Sold direct at
 * $499, or co-branded wholesale to RPO/MSP partners who resell at $499–$999.
 */
export const RISK_REPORT = {
  name: "CMMC AI Risk Assessment Report",
  oneTimePrice: 499,
  wholesalePrice: 299,
  resaleLow: 499,
  resaleHigh: 999,
} as const;

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
