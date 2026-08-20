/**
 * Schema.org JSON-LD builders for AEO (Answer Engine Optimization).
 *
 * Pure functions that return plain JSON-LD objects. They are rendered with
 * the <JsonLd> component. Keeping them pure makes them trivially testable
 * and keeps page/layout files free of inline schema literals.
 */

import type { FaqItem, HowToStep } from "./faqs";
import { RISK_REPORT } from "@/lib/pricing/plans";

import { SITE_URL } from "@/lib/site-url";

export const BASE_URL =
  SITE_URL;

/** Anything that can be serialized into a <script type="application/ld+json">. */
export type JsonLdSchema = Record<string, unknown>;

interface OfferInput {
  name: string;
  price: string;
  description: string;
}

/*
 * Offers must match what /pricing actually sells — exactly one thing.
 *
 * This list used to carry six tiers (Free, Pro $199, Growth $499/mo,
 * Enterprise $999, Agency $2,499) alongside the report. /pricing stopped
 * selling all of them — it is deliberately a single-offer page, locked by
 * app/pricing/__tests__/pricing-single-offer.test.tsx — but this schema kept
 * publishing them to Google, Perplexity and every other answer engine.
 *
 * Two concrete harms, not just untidiness:
 *   1. Rich results advertised prices with no checkout behind them. A buyer
 *      arriving on "HoundShield Pro — $199/mo" lands on a page selling one
 *      $499 report, and bounces.
 *   2. It was a literal second pricing grid — the machine-readable one — in
 *      a codebase whose first pricing rule is that there is only ever one.
 *
 * The subscription ladder still exists in lib/pricing/plans.ts for Stage 2.
 * It does not belong here until it is something a visitor can actually buy.
 */
const PRODUCT_OFFERS: readonly OfferInput[] = [
  {
    name: RISK_REPORT.name,
    price: String(RISK_REPORT.oneTimePrice),
    description: `One-time $${RISK_REPORT.oneTimePrice} report — run the proxy 14 days in your own environment for a SHA-256-signed PDF risk-scoring every AI prompt event against NIST 800-171. No subscription.`,
  },
];

const PRODUCT_FEATURES: readonly string[] = [
  "Customer-operated AI request inspection",
  "Configurable CUI, PHI, and PII pattern detection",
  "NIST SP 800-171 control mapping support",
  "Evidence-oriented assessment workflow support",
  "Tamper-evident audit artifacts where configured",
  "Exportable records for human review",
  "Self-hosted deployment option for customer-controlled prompt handling",
  "Human-reviewed readiness planning; not a certification or assessor decision",
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
      "AI traffic security controls and evidence-workflow support for organizations evaluating CMMC-aligned, HIPAA, and SOC 2 program needs. In supported customer-operated deployments, HoundShield can inspect AI requests before forwarding them, detect selected CUI, PHI, and PII patterns, and produce audit artifacts for human review. It does not provide certification or assessor determinations.",
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
