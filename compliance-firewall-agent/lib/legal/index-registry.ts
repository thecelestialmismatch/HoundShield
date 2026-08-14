/**
 * The index of every published legal document, and the law that asks for it.
 *
 * Two jobs, and the second is the one that pays for this file:
 *
 *  1. `/legal` renders it, so a buyer has one page instead of guessing URLs.
 *  2. `app/__tests__/legal-index-contract.test.ts` walks it and fails if any
 *     entry has no page behind it. A legal index is the one kind of page where
 *     a dead link is itself the defect: it advertises a policy that does not
 *     exist, which is worse than not listing it.
 *
 * `required` states the actual instrument, not a vague "GDPR". A reviewer
 * should be able to check the citation, which is the standard the rest of this
 * codebase holds market claims to.
 *
 * `basis` exists because not every document here is compelled by a statute, and
 * pretending otherwise would be its own small dishonesty. A privacy policy is
 * required by law; an acceptable-use policy is a contract term we chose to
 * publish. The guard demands a checkable instrument only from the STATUTORY
 * ones — the alternative was inventing a citation for the AUP, which is exactly
 * the kind of decorative compliance this page exists to avoid.
 */

/** Whether the law compels this document, or we publish it by choice. */
export type LegalBasis = "statutory" | "contractual";

export interface LegalDocument {
  /** Route, e.g. "/privacy". Must resolve to app/<route>/page.tsx. */
  readonly href: string;
  readonly title: string;
  /** What a reader gets from it, in one line. */
  readonly summary: string;
  readonly basis: LegalBasis;
  /** The obligations this document exists to satisfy. */
  readonly required: readonly string[];
}

export const LEGAL_DOCUMENTS: readonly LegalDocument[] = [
  {
    href: "/privacy",
    basis: "statutory",
    title: "Privacy Policy",
    summary:
      "What personal data we handle, why, on what legal basis, and how to exercise your rights over it.",
    required: [
      "GDPR Art. 13–14 (information to data subjects)",
      "CCPA/CPRA notice at collection",
      "CalOPPA",
    ],
  },
  {
    href: "/cookies",
    basis: "statutory",
    title: "Cookie Policy",
    summary:
      "Every cookie and browser-storage item we set, its purpose and lifetime. Analytics stays off until you opt in.",
    required: [
      "ePrivacy Directive Art. 5(3) (consent for non-essential storage)",
      "GDPR Art. 13",
    ],
  },
  {
    href: "/terms",
    basis: "statutory",
    title: "Terms of Service",
    summary: "The contract governing use of HoundShield, including billing and liability.",
    required: ["Contract formation", "EU Directive 2000/31/EC Art. 5 (service-provider information)"],
  },
  {
    href: "/refund",
    basis: "statutory",
    title: "Refund Policy",
    summary:
      "The terms behind the 30-day money-back guarantee — how to claim one and how long it takes.",
    required: [
      "Stripe merchant requirements",
      "FTC guidance on advertised guarantees",
      "EU Consumer Rights Directive 2011/83/EU (withdrawal), where it applies",
    ],
  },
  {
    href: "/dpa",
    basis: "statutory",
    title: "Data Processing Agreement",
    summary:
      "The processor terms we offer controllers, including international transfer mechanisms.",
    required: ["GDPR Art. 28(3)", "UK GDPR", "Standard Contractual Clauses"],
  },
  {
    href: "/subprocessors",
    basis: "statutory",
    title: "Sub-processors",
    summary:
      "The complete list of third parties that process data on our behalf, what each receives, and where.",
    required: ["GDPR Art. 28(2) (disclosure of sub-processors)"],
  },
  {
    href: "/acceptable-use",
    basis: "contractual",
    title: "Acceptable Use Policy",
    summary: "What the service may not be used for.",
    required: ["Contract term", "Platform-liability hygiene"],
  },
  {
    href: "/accessibility",
    basis: "statutory",
    title: "Accessibility Statement",
    summary:
      "Our conformance posture against WCAG 2.1 AA, what we measure, what that does not prove, and how to report a barrier.",
    required: [
      "European Accessibility Act — Directive (EU) 2019/882",
      "EN 301 549",
      "ADA Title III · Section 508 (US)",
    ],
  },
  {
    href: "/security",
    basis: "contractual",
    title: "Security",
    summary: "How the product is built and where the data boundary sits.",
    required: ["Buyer diligence", "NIST SP 800-171 evidence expectations"],
  },
] as const;
