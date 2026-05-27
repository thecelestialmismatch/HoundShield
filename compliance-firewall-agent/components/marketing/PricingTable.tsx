import { PricingTier, type Tier } from "./PricingTier";
import { SectionEyebrow } from "./SectionEyebrow";

const TIERS: Tier[] = [
  {
    name: "Free",
    meta: "Evaluation · <500 req/day",
    price: "$0",
    ctaLabel: "Get Started Free",
    ctaHref: "/signup?plan=free",
    features: ["500 scans/day", "Basic CUI detection", "7-day log retention", "Email support"],
  },
  {
    name: "Pro",
    meta: "IT Manager (Jordan)",
    price: "$159",
    ctaLabel: "Start Free Trial",
    ctaHref: "/signup?plan=pro",
    featured: true,
    features: [
      "Unlimited scans",
      "All 16 detection engines",
      "90-day log retention",
      "C3PAO-ready PDF reports",
      "Brain AI access",
      "Priority support",
    ],
  },
  {
    name: "Growth",
    meta: "Multi-team + SIEM",
    price: "$399",
    ctaLabel: "Start Free Trial",
    ctaHref: "/signup?plan=growth",
    features: [
      "Everything in Pro",
      "SIEM integration",
      "Custom detection rules",
      "Team management (5–25)",
      "SLA 99.9%",
    ],
  },
  {
    name: "Enterprise",
    meta: "Custom SLA · 25+ users",
    price: "$799",
    ctaLabel: "Start Free Trial",
    ctaHref: "/signup?plan=enterprise",
    features: [
      "Everything in Growth",
      "Custom SLA",
      "Dedicated CSM",
      "SSO / SAML",
      "On-prem option",
    ],
  },
  {
    name: "Agency",
    meta: "C3PAO / MSP reseller",
    price: "$1,999",
    ctaLabel: "Start Free Trial",
    ctaHref: "/signup?plan=agency",
    features: [
      "Everything in Enterprise",
      "Multi-tenant management",
      "White-label reports",
      "Reseller dashboard",
      "Volume pricing",
    ],
  },
];

export function PricingTable({ tiers = TIERS }: { tiers?: Tier[] }) {
  return (
    <section
      id="pricing"
      className="spotlight"
      style={{ position: "relative", padding: "96px 24px", overflow: "hidden", background: "var(--hs-surface-2)" }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 2 }}>
        <div style={{ textAlign: "center" }}>
          <SectionEyebrow>Pricing</SectionEyebrow>
        </div>
        <h2
          className="font-display"
          style={{
            textAlign: "center",
            fontSize: "clamp(32px,4vw,52px)",
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: "var(--hs-ink)",
            margin: "8px auto 48px",
            maxWidth: 900,
          }}
        >
          Start free. Pay when it saves your contract.
        </h2>
        <div
          className="hs-tier-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5,1fr)",
            gap: 16,
            maxWidth: 1200,
            margin: "0 auto",
            alignItems: "stretch",
          }}
        >
          {tiers.map((t) => (
            <PricingTier key={t.name} tier={t} />
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 1100px) { .hs-tier-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 600px)  { .hs-tier-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
