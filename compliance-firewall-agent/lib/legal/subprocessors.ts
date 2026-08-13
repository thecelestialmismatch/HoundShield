/**
 * The sub-processors that actually receive data, derived from the code.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * On 2026-08-13 `/privacy` and `/dpa` disclosed DIFFERENT, incomplete lists:
 *
 *   /privacy named: Google, OpenRouter, Stripe, Supabase, Vercel
 *   /dpa     named: Resend, Stripe, Supabase, Vercel
 *
 * Neither named PostHog, Sentry, Cloudflare Turnstile, Bytez or CloudFront.
 * Two authoritative documents contradicting each other is worse than one being
 * incomplete, and GDPR Art. 28(2) requires the list to be disclosed and kept
 * current. So there is now exactly one list, here, and both documents render it.
 *
 * Every entry below was confirmed against an actual outbound host or SDK in
 * `lib/` or `app/`, not from memory. `__tests__/legal-contract.test.ts` asserts
 * that a known-integrated vendor cannot silently drop off this list.
 *
 * ON THE GATEWAY UPSTREAMS
 * ------------------------
 * api.openai.com, api.anthropic.com and generativelanguage.googleapis.com also
 * appear in the code, and they are deliberately NOT listed as HoundShield
 * sub-processors. They are the customer's own AI providers, reached with the
 * customer's own API key; HoundShield forwards to them at the customer's
 * instruction and never holds that relationship. Listing them would misstate who
 * the controller is. They belong in the customer's own processor register.
 */

export type DataClass =
  | "account"
  | "payment"
  | "email"
  | "telemetry"
  | "diagnostics"
  | "security"
  | "content";

export interface SubProcessor {
  readonly name: string;
  /** What it does for HoundShield, in one line. */
  readonly purpose: string;
  /** Categories of personal data it can receive. */
  readonly data: readonly DataClass[];
  /** Where processing happens, as advertised by the vendor. */
  readonly region: string;
  /** Proof this vendor is genuinely integrated — a path in this repo. */
  readonly evidence: string;
  /** True if it can be reached while a visitor is merely browsing, before signup. */
  readonly preAuth: boolean;
}

export const SUB_PROCESSORS: readonly SubProcessor[] = [
  {
    name: "Vercel",
    purpose: "Application hosting, edge delivery and build pipeline",
    data: ["account", "diagnostics"],
    region: "United States",
    evidence: "vercel.json, deployment target",
    preAuth: true,
  },
  {
    name: "Supabase",
    purpose: "Authentication, Postgres database and session storage",
    data: ["account", "security"],
    region: "United States",
    evidence: "lib/supabase/*, NEXT_PUBLIC_SUPABASE_URL",
    preAuth: false,
  },
  {
    name: "Stripe",
    purpose: "Payment processing and checkout for the assessment report",
    data: ["account", "payment"],
    region: "United States",
    evidence: "app/api/stripe/*, buy.stripe.com payment link",
    preAuth: true,
  },
  {
    name: "Resend",
    purpose: "Transactional email — receipts, password reset, notifications",
    data: ["account", "email"],
    region: "United States",
    evidence: "RESEND_API_KEY, lib/email/*",
    preAuth: true,
  },
  {
    name: "PostHog",
    purpose: "Product analytics. Loaded only after cookie consent is granted.",
    data: ["telemetry"],
    region: "United States",
    evidence: "NEXT_PUBLIC_POSTHOG_KEY, consent-gated loader",
    preAuth: true,
  },
  {
    name: "Sentry",
    purpose: "Error monitoring and stack traces",
    data: ["diagnostics", "account"],
    region: "United States",
    evidence: "SENTRY_DSN, instrumentation config",
    preAuth: true,
  },
  {
    name: "Cloudflare",
    purpose: "Turnstile CAPTCHA on authentication endpoints",
    data: ["security"],
    region: "Global edge",
    evidence: "TURNSTILE_SECRET_KEY, lib/auth/captcha.ts",
    preAuth: true,
  },
  {
    name: "OpenRouter",
    purpose:
      "Routes Brain AI questions to commercial LLM providers. NOT FedRAMP-authorized and NOT covered by a BAA — never submit CUI or PHI to Brain AI.",
    data: ["content"],
    region: "United States",
    evidence: "OPENROUTER_API_KEY, app/api/brain/query/route.ts",
    preAuth: true,
  },
  {
    name: "Bytez",
    purpose: "Model inference endpoint referenced by the application CSP",
    data: ["content"],
    region: "United States",
    evidence: "connect-src https://bytez.com in next.config CSP",
    preAuth: true,
  },
  {
    name: "Amazon CloudFront",
    purpose: "Media delivery for site video assets",
    data: ["diagnostics"],
    region: "Global edge",
    evidence: "media-src https://d8j0ntlcm91z4.cloudfront.net in CSP",
    preAuth: true,
  },
] as const;

/** Vendors reachable before a visitor ever creates an account. Drives the cookie notice. */
export function preAuthSubProcessors(): readonly SubProcessor[] {
  return SUB_PROCESSORS.filter((s) => s.preAuth);
}

/** Vendors that can receive prompt or question content. The list a CISO checks first. */
export function contentTouchingSubProcessors(): readonly SubProcessor[] {
  return SUB_PROCESSORS.filter((s) => s.data.includes("content"));
}
