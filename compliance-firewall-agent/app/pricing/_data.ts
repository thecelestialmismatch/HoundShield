// Pure pricing data — no React/Lucide imports so this is safely testable in Node.

// ─── Tier pricing ──────────────────────────────────────────────────────────────
// Monthly prices per PRD v2. Annual = 20% off (rounded to nearest dollar).
export const PLANS = [
  {
    id: "starter",
    name: "Starter",
    icon: "Zap",
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    monthlyPrice: 0,
    annualMonthly: 0,
    annualTotal: 0,
    description: "See your SPRS score. Map all 110 NIST control gaps. No commitment, no credit card.",
    badge: null as string | null,
    highlighted: false,
    cta: "Start Free",
    ctaHref: "/signup" as string | null,
    features: [
      "CMMC self-assessment (read-only)",
      "110-control gap analysis",
      "Live SPRS score calculator",
      "Basic compliance dashboard",
      "Up to 1,000 AI prompt scans/mo",
      "Community support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    icon: "Crown",
    iconColor: "text-brand-400",
    iconBg: "bg-brand-400/10 border-brand-400/20",
    monthlyPrice: 199,
    annualMonthly: 159,
    annualTotal: 1908,
    description: "The plan Jordan buys. AI gateway enforces CUI rules. Full CMMC assessment. DFARS 7012 satisfied.",
    badge: "Most Popular" as string | null,
    highlighted: true,
    cta: "Start 7-Day Trial",
    ctaHref: null as string | null,
    features: [
      "AI gateway — 50,000 scans/mo",
      "CMMC assessment (editable)",
      "Gap analysis + remediation roadmap",
      "JSON compliance reports",
      "SSP & policy document generation",
      "Slack & webhook alerts",
      "Priority support (<4hr SLA)",
      "90-day log retention",
      "10 user seats",
      "API access",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    icon: "TrendingUp",
    iconColor: "text-sky-400",
    iconBg: "bg-sky-500/10 border-sky-500/20",
    monthlyPrice: 499,
    annualMonthly: 399,
    annualTotal: 4788,
    description: "PDF reports your C3PAO can stamp. SPRS improvement tracking. Unlimited scans.",
    badge: "C3PAO Ready" as string | null,
    highlighted: false,
    cta: "Start 7-Day Trial",
    ctaHref: null as string | null,
    features: [
      "Everything in Pro",
      "AI gateway — unlimited scans",
      "PDF compliance reports (C3PAO grade)",
      "SPRS improvement history",
      "Merkle-anchored audit trail export",
      "Custom detection rules",
      "30 user seats",
      "1-year log retention",
      "Dedicated onboarding call",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    icon: "Building2",
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/10 border-violet-500/20",
    monthlyPrice: 999,
    annualMonthly: 799,
    annualTotal: 9588,
    description: "On-prem for air-gapped networks. Unlimited seats. Direct C3PAO coordination.",
    badge: null as string | null,
    highlighted: false,
    cta: "Start 7-Day Trial",
    ctaHref: null as string | null,
    features: [
      "Everything in Growth",
      "On-prem / air-gapped deployment",
      "Unlimited user seats",
      "White-labeled PDF reports",
      "HITL quarantine review",
      "C3PAO assessment coordination",
      "Custom SLA (99.99%)",
      "Dedicated account manager",
      "SSO & RBAC",
    ],
  },
  {
    id: "agency",
    name: "Agency / MSP",
    icon: "Users",
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10 border-amber-500/20",
    monthlyPrice: 2499,
    annualMonthly: 1999,
    annualTotal: 23988,
    description: "For C3PAOs and MSPs managing multiple DoD contractors. 20% revenue share on referrals.",
    badge: "For C3PAOs" as string | null,
    highlighted: false,
    cta: "Contact Sales",
    ctaHref: "/contact" as string | null,
    features: [
      "Everything in Enterprise",
      "Multi-tenant dashboard",
      "Unlimited client accounts",
      "White-label compliance reports",
      "Bulk compliance reporting",
      "Partner API + webhooks",
      "Revenue-share program (20%)",
      "Dedicated success manager",
    ],
  },
] as const;

export type PlanId = (typeof PLANS)[number]["id"];

// ─── Comparison table ──────────────────────────────────────────────────────────
export type FeatureValue = boolean | string;

export interface ComparisonRow {
  feature: string;
  category: string;
  starter: FeatureValue;
  pro: FeatureValue;
  growth: FeatureValue;
  enterprise: FeatureValue;
  agency: FeatureValue;
}

export const COMPARISON: ComparisonRow[] = [
  // AI Gateway
  { feature: "Monthly API scans",       category: "AI Gateway",        starter: "1K",        pro: "50K",     growth: "Unlimited", enterprise: "Unlimited",   agency: "Unlimited"   },
  { feature: "Detection engines",       category: "AI Gateway",        starter: false,       pro: "16",      growth: "16",        enterprise: "16+ custom",  agency: "16+ custom"  },
  { feature: "Custom detection rules",  category: "AI Gateway",        starter: false,       pro: false,     growth: true,        enterprise: true,          agency: true          },
  { feature: "HITL quarantine review",  category: "AI Gateway",        starter: false,       pro: false,     growth: false,       enterprise: true,          agency: true          },
  // CMMC & Compliance
  { feature: "CMMC self-assessment",    category: "CMMC & Compliance", starter: "Read-only", pro: true,      growth: true,        enterprise: true,          agency: "White-label" },
  { feature: "SPRS score calculator",   category: "CMMC & Compliance", starter: true,        pro: true,      growth: true,        enterprise: true,          agency: true          },
  { feature: "Gap analysis & roadmap",  category: "CMMC & Compliance", starter: false,       pro: true,      growth: true,        enterprise: true,          agency: true          },
  { feature: "JSON compliance reports", category: "CMMC & Compliance", starter: false,       pro: true,      growth: true,        enterprise: true,          agency: true          },
  { feature: "PDF compliance reports",  category: "CMMC & Compliance", starter: false,       pro: false,     growth: true,        enterprise: "White-label", agency: "White-label" },
  { feature: "SSP document generation", category: "CMMC & Compliance", starter: false,       pro: true,      growth: true,        enterprise: true,          agency: true          },
  { feature: "Merkle audit trail",      category: "CMMC & Compliance", starter: false,       pro: false,     growth: true,        enterprise: true,          agency: true          },
  { feature: "C3PAO coordination",      category: "CMMC & Compliance", starter: false,       pro: false,     growth: false,       enterprise: true,          agency: true          },
  // Platform
  { feature: "Team seats",              category: "Platform",          starter: "1",         pro: "10",      growth: "30",        enterprise: "Unlimited",   agency: "Unlimited"   },
  { feature: "Client accounts",         category: "Platform",          starter: false,       pro: false,     growth: false,       enterprise: false,         agency: "Unlimited"   },
  { feature: "Log retention",           category: "Platform",          starter: "7 days",    pro: "90 days", growth: "1 year",    enterprise: "Unlimited",   agency: "Unlimited"   },
  { feature: "On-prem / air-gapped",    category: "Platform",          starter: false,       pro: false,     growth: false,       enterprise: true,          agency: true          },
  { feature: "SSO & RBAC",              category: "Platform",          starter: false,       pro: false,     growth: false,       enterprise: true,          agency: true          },
  { feature: "API access",              category: "Platform",          starter: false,       pro: true,      growth: true,        enterprise: true,          agency: true          },
  // Support
  { feature: "Community support",       category: "Support",           starter: true,        pro: true,      growth: true,        enterprise: true,          agency: true          },
  { feature: "Priority support (<4hr)", category: "Support",           starter: false,       pro: true,      growth: true,        enterprise: true,          agency: true          },
  { feature: "Dedicated onboarding",    category: "Support",           starter: false,       pro: false,     growth: true,        enterprise: true,          agency: true          },
  { feature: "Dedicated account mgr",   category: "Support",           starter: false,       pro: false,     growth: false,       enterprise: true,          agency: true          },
  { feature: "SLA guarantee",           category: "Support",           starter: false,       pro: false,     growth: false,       enterprise: "99.99%",      agency: "99.99%"      },
];

// ─── FAQ ───────────────────────────────────────────────────────────────────────
export const FAQ = [
  {
    q: "What's included in the 7-day free trial?",
    a: "Full access to Pro features — 50,000 AI prompt scans, CMMC assessment, gap analysis, remediation roadmap, and priority support. No credit card required. After 7 days you move to Starter (free) unless you upgrade.",
  },
  {
    q: "How does HoundShield satisfy DFARS 7012?",
    a: "DFARS 7012 requires adequate security for all covered defense information. Cloud-based AI DLP tools (Nightfall, Strac, Purview) send CUI to third-party servers for scanning — that act is itself a potential DFARS violation. HoundShield scans locally. Prompt content never leaves your network.",
  },
  {
    q: "Which plan do I need for my C3PAO audit?",
    a: "Growth. Your C3PAO will ask for evidence of AC.L2-3.1.3 (CUI flow control), AU.L2-3.3.1 (audit logging), and SI.L2-3.14.1 (flaw identification). Growth generates the cryptographically-anchored PDF reports they need, with Merkle root verification so the report can't be tampered with.",
  },
  {
    q: "Can I switch between monthly and annual billing?",
    a: "Yes. Switch to annual at any time and save 20% immediately. Switching from annual to monthly takes effect at the end of your billing period. No penalties.",
  },
  {
    q: "How does on-prem deployment work on Enterprise?",
    a: "We provide Docker images and a single docker-compose.yml. Your team runs one command and the proxy is scanning. Air-gapped environments are supported — no external calls are made from the proxy. Our team assists with initial setup.",
  },
  {
    q: "Is there a money-back guarantee?",
    a: "Yes — 30-day full refund on all paid plans. If HoundShield does not improve your CMMC posture within 30 days, we refund every dollar. No questions asked.",
  },
  {
    q: "Do you offer discounts for small defense contractors?",
    a: "Yes — 25% off Pro for companies under 50 employees with an active CAGE code. Contact us with your CAGE code and company size for the discount code.",
  },
];

// ─── Pricing helpers (pure functions — testable) ───────────────────────────────
export function annualMonthly(monthlyPrice: number): number {
  return Math.round(monthlyPrice * 0.8);
}

export function annualTotal(monthlyPrice: number): number {
  return annualMonthly(monthlyPrice) * 12;
}

export function annualSavings(monthlyPrice: number): number {
  return monthlyPrice * 12 - annualTotal(monthlyPrice);
}
