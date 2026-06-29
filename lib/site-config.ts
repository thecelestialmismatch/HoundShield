/**
 * HoundShield — Single Source of Truth for the marketing surface.
 *
 * Brand name, pricing tiers, contact emails, nav + footer links all live here.
 * Pages and components import from this file so the public site can never drift
 * again (e.g. "Federal" vs "Agency", "50K scans" vs "Unlimited", logo variants).
 *
 * Pricing here is canonical and matches app/pricing/page.tsx. If you change a
 * price, change it HERE and both the homepage and pricing page update.
 */

export const BRAND = {
  name: "HoundShield",
  legalName: "HoundShield, Inc.",
  domain: "houndshield.com",
  url: "https://www.houndshield.com",
  tagline: "The local-only AI compliance firewall.",
  description:
    "HoundShield intercepts every AI prompt before it leaves your network. 16 detection engines, sub-10ms latency, CMMC Level 2 / HIPAA / SOC 2 enforced simultaneously.",
  logo: "/houndshield-logo.png",
  email: {
    general: "info@houndshield.com",
    sales: "sales@houndshield.com",
    support: "support@houndshield.com",
  },
  github: "https://github.com/thecelestialmismatch/HoundShield",
} as const;

/** Headline stats used across hero/stat strips. One set, everywhere. */
export const STATS = [
  { value: "16", label: "Detection engines", sub: "CUI · PHI · PII · IP" },
  { value: "~80,000", label: "contractors at risk", sub: "Need CMMC Level 2" },
  { value: "Nov 2026", label: "CMMC deadline", sub: "For DoD prime contractors" },
  { value: "<10ms", label: "Scan latency", sub: "Median, fully local" },
] as const;

export interface PricingTier {
  id: string;
  name: string;
  monthly: number; // USD / month
  annual: number; // USD / year (≈ 20% off)
  blurb: string;
  scans: string;
  features: string[];
  cta: string;
  href: string;
  highlight?: boolean;
}

/** Canonical 5-tier pricing — reconciled with app/pricing/page.tsx. */
export const PRICING: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    monthly: 0,
    annual: 0,
    blurb: "Try HoundShield risk-free",
    scans: "1,000 scans/mo",
    features: ["1 user", "1,000 scans/mo", "Basic compliance reports", "CMMC pattern detection"],
    cta: "Start free",
    href: "/signup",
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 199,
    annual: 1910,
    blurb: "For compliance-conscious teams",
    scans: "50,000 scans/mo",
    features: ["5 users", "50,000 scans/mo", "PDF evidence export", "SPRS score tracking", "Webhook alerts"],
    cta: "Start Pro",
    href: "/signup?plan=pro",
    highlight: true,
  },
  {
    id: "growth",
    name: "Growth",
    monthly: 499,
    annual: 4790,
    blurb: "For multi-team organizations",
    scans: "Unlimited scans",
    features: ["25 users", "Gateway mode", "HIPAA + SOC 2 coverage", "Audit trail export", "Priority support"],
    cta: "Start Growth",
    href: "/signup?plan=growth",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthly: 999,
    annual: 9590,
    blurb: "C3PAO assessment ready",
    scans: "Unlimited scans",
    features: ["Unlimited users", "C3PAO-ready reports", "On-prem deployment", "SLA guarantee", "Dedicated CSM"],
    cta: "Contact sales",
    href: "/contact",
  },
  {
    id: "agency",
    name: "Agency / MSP",
    monthly: 2499,
    annual: 23990,
    blurb: "Multi-tenant resale for MSPs & C3PAOs",
    scans: "Unlimited scans",
    features: ["Multi-tenant", "White-label", "Full platform resale", "CMMC advisory", "SLA + NDA"],
    cta: "Contact sales",
    href: "/contact",
  },
];

/** Primary top-nav links (consumed by NavV3). */
export const NAV_LINKS = [
  { label: "How it works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "/docs" },
  { label: "Blog", href: "/blog" },
] as const;

/**
 * Footer columns. Compliance links resolve to real targets/anchors instead of
 * every link dumping onto /features.
 */
export const FOOTER_SECTIONS: Record<string, Array<{ label: string; href: string }>> = {
  Product: [
    { label: "Features", href: "/features" },
    { label: "How it works", href: "/how-it-works" },
    { label: "Pricing", href: "/pricing" },
    { label: "Changelog", href: "/changelog" },
  ],
  Compliance: [
    { label: "CMMC Level 2", href: "/features#cmmc" },
    { label: "HIPAA", href: "/hipaa" },
    { label: "SOC 2", href: "/features#soc2" },
    { label: "NIST 800-171", href: "/features#nist" },
    { label: "DFARS 7012", href: "/features#dfars" },
  ],
  Resources: [
    { label: "Documentation", href: "/docs" },
    { label: "Blog", href: "/blog" },
    { label: "Partners", href: "/partners" },
    { label: "Contact", href: "/contact" },
    { label: "About", href: "/about" },
  ],
};

export const COMPLIANCE_BADGES = ["CMMC LVL 2", "HIPAA", "SOC 2", "NIST 800-171"] as const;
