/**
 * Schema.org JSON-LD builders for AEO (Answer Engine Optimization).
 *
 * Pure functions that return plain JSON-LD objects. They are rendered with
 * the <JsonLd> component. Keeping them pure makes them trivially testable
 * and keeps page/layout files free of inline schema literals.
 */

import type { FaqItem, HowToStep } from "./faqs";

export const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://houndshield.com";

/** Anything that can be serialized into a <script type="application/ld+json">. */
export type JsonLdSchema = Record<string, unknown>;

interface OfferInput {
  name: string;
  price: string;
  description: string;
}

// Tier names and prices must match app/pricing/page.tsx exactly. The $499
// one-time CMMC AI Risk Assessment Report is the lead product and is listed
// first. The $2,499 tier is "Agency" on the pricing page (not "Federal").
const PRODUCT_OFFERS: readonly OfferInput[] = [
  { name: "CMMC AI Risk Assessment Report", price: "499", description: "One-time $499 report — run the proxy 14 days in your own environment for a SHA-256-signed PDF risk-scoring every AI prompt event against NIST 800-171. No subscription." },
  { name: "Free", price: "0", description: "Free tier — CMMC self-assessment, SPRS calculator, up to 1,000 prompts/mo" },
  { name: "Pro", price: "199", description: "Pro — AI gateway (50,000 scans/mo), SSP & POA&M generation, 10 seats" },
  { name: "Growth", price: "499", description: "Growth — unlimited scans, PDF reports, C3PAO coordination, SSO & RBAC, 25 seats" },
  { name: "Enterprise", price: "999", description: "Enterprise — on-prem / air-gapped, white-label PDF, dedicated CSM" },
  { name: "Agency", price: "2499", description: "Agency / MSP — multi-tenant, unlimited client accounts, revenue-share program" },
];

const PRODUCT_FEATURES: readonly string[] = [
  "Sub-10ms AI prompt scanning",
  "CUI detection and blocking",
  "PHI and PII detection",
  "CMMC Level 2 control mapping",
  "HIPAA-compliant audit trails",
  "SOC 2 compliance monitoring",
  "Tamper-evident audit logs",
  "C3PAO-ready PDF evidence",
  "Local-only deployment (data never leaves your network)",
  "NIST 800-171 assessment support",
];

/** Site-wide product entity. Rendered once in the root layout. */
export function softwareApplicationSchema(): JsonLdSchema {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "HoundShield",
    applicationCategory: "SecurityApplication",
    operatingSystem: "Docker, Linux, macOS, Windows Server",
    description:
      "Local-only AI compliance firewall for CMMC Level 2, HIPAA, and SOC 2. Intercepts AI prompts before they leave your network, scans for CUI/PHI/PII, generates tamper-proof audit logs, and produces C3PAO-ready PDF compliance reports.",
    url: BASE_URL,
    offers: PRODUCT_OFFERS.map((offer) => ({
      "@type": "Offer",
      name: offer.name,
      price: offer.price,
      priceCurrency: "USD",
      description: offer.description,
    })),
    featureList: [...PRODUCT_FEATURES],
  };
}

/** Site-wide organization entity. Powers Knowledge Panel eligibility. */
export function organizationSchema(): JsonLdSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "HoundShield",
    url: BASE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${BASE_URL}/logo.png`,
    },
    description:
      "AI compliance security company building local-only AI firewalls for defense contractors and regulated industries.",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Sales",
      url: `${BASE_URL}/contact`,
    },
    // Verified profiles only — the @houndshield handle is claimed in the site's
    // Twitter/X metadata. Add more (LinkedIn, GitHub) as they are established.
    sameAs: ["https://x.com/houndshield"],
  };
}

/**
 * Site-wide WebSite entity. This is Google's primary signal for the site name
 * shown in results and is a key fix for brand-name searches ("HoundShield")
 * resolving to us instead of similarly-named products. Rendered once in root.
 */
export function websiteSchema(): JsonLdSchema {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "HoundShield",
    alternateName: "HoundShield AI Compliance Firewall",
    url: BASE_URL,
    publisher: { "@type": "Organization", name: "HoundShield", url: BASE_URL },
  };
}

/**
 * Page-scoped FAQ schema. The questions MUST also be visible on the page
 * (rendered via <FaqSection>) or Google will ignore the markup.
 */
export function faqPageSchema(items: readonly FaqItem[]): JsonLdSchema {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

interface HowToInput {
  name: string;
  description: string;
  steps: readonly HowToStep[];
  totalTime?: string; // ISO 8601 duration, e.g. "PT15M"
}

/** Step-by-step schema. Eligible for SERP step display and voice read-out. */
export function howToSchema({ name, description, steps, totalTime }: HowToInput): JsonLdSchema {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    ...(totalTime ? { totalTime } : {}),
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };
}

interface BreadcrumbInput {
  name: string;
  /** Path beginning with "/" (joined to BASE_URL) or an absolute URL. */
  path: string;
}

/** Breadcrumb trail — improves SERP presentation and crawl context. */
export function breadcrumbSchema(items: readonly BreadcrumbInput[]): JsonLdSchema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.path.startsWith("http") ? item.path : `${BASE_URL}${item.path}`,
    })),
  };
}
