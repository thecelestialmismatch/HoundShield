import { CONSENT_KEY } from "@/lib/consent";

/**
 * What HoundShield stores in a visitor's browser — the inventory behind the
 * consent banner.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * `components/CookieConsent.tsx` is a correct GDPR/ePrivacy banner: analytics
 * stays off until the visitor opts in, and "Accept essential" is offered
 * alongside "Accept all". But it linked to `/privacy`, whose entire cookie
 * section was two sentences — "We use essential cookies for authentication and
 * session management. We use anonymous analytics cookies only after you opt
 * in." — naming nothing.
 *
 * ePrivacy Art. 5(3) and GDPR Art. 13 require "clear and comprehensive
 * information", which the EDPB reads as the identity, purpose and lifetime of
 * each item stored. A banner asking for consent to an unnamed set cannot obtain
 * informed consent, so the consent it collects is the part that is weak — not
 * merely the disclosure.
 *
 * EVERY ENTRY IS DERIVED, NOT DESCRIBED
 * -------------------------------------
 * Each row carries an in-repo `evidence` path, the same discipline
 * `lib/legal/subprocessors.ts` uses. A cookie policy listing cookies the code
 * does not set is worse than none: it is a published inaccuracy about data
 * handling, on a site sold to buyers who verify exactly that.
 *
 * Two things deliberately absent, because they are not set on this domain:
 *   • Stripe (`__stripe_mid` / `__stripe_sid`) — checkout is Stripe-HOSTED. No
 *     Stripe.js is loaded here (verified: no `@stripe/stripe-js`, no
 *     `js.stripe.com`), so those cookies are set on Stripe's domain under
 *     Stripe's own policy, not ours.
 *   • Cloudflare Turnstile — the widget only loads when `TURNSTILE_SECRET_KEY`
 *     is configured, which it currently is not. Listing it would describe a
 *     control that is not running (`/api/health` reports it as
 *     `not_configured`).
 */

export type CookieCategory = "essential" | "analytics";

/** Where the value physically lives. Not every stored item is a cookie. */
export type StorageKind = "cookie" | "localStorage";

export interface StoredItem {
  readonly name: string;
  readonly category: CookieCategory;
  readonly storage: StorageKind;
  /** Who sets it. */
  readonly provider: string;
  readonly purpose: string;
  readonly duration: string;
  /** In-repo path proving this is actually set. */
  readonly evidence: string;
}

export const STORED_ITEMS: readonly StoredItem[] = [
  {
    name: "sb-<project>-auth-token",
    category: "essential",
    storage: "cookie",
    provider: "Supabase (authentication)",
    purpose:
      "Keeps you signed in. Without it every page load would return you to the login screen. Strictly necessary, so it is not gated behind consent.",
    // Verified empirically, not from documentation: a real session write emits
    // exactly this cookie name (see lib/auth/__tests__/session-cookie-flags.test.ts).
    duration:
      "Session lifetime, as issued by the authentication provider. Marked Secure in production and SameSite=Lax.",
    evidence: "lib/supabase/server.ts",
  },
  {
    name: CONSENT_KEY,
    category: "essential",
    storage: "localStorage",
    provider: "HoundShield",
    purpose:
      "Remembers your cookie choice so the banner does not ask again on every page. Storing the record of a refusal is itself strictly necessary — the alternative is asking forever.",
    duration: "Until you clear site data. Versioned, so a material change to the choices re-asks.",
    evidence: "lib/consent.ts",
  },
  {
    name: "ph_<key>_posthog",
    category: "analytics",
    storage: "cookie",
    provider: "PostHog",
    purpose:
      "Counts page views and distinguishes a returning browser from a new one, so we can tell which pages are useful. Set ONLY after you choose “Accept all”. Prompt content is never sent — the analytics library is not initialised at all until you opt in.",
    duration: "Up to 12 months, PostHog's default.",
    evidence: "components/PostHogProvider.tsx",
  },
] as const;

export function itemsByCategory(category: CookieCategory): readonly StoredItem[] {
  return STORED_ITEMS.filter((item) => item.category === category);
}

/** Categories that require opt-in consent before anything is stored. */
export const CONSENTED_CATEGORIES: readonly CookieCategory[] = ["analytics"] as const;

export function requiresConsent(category: CookieCategory): boolean {
  return CONSENTED_CATEGORIES.includes(category);
}
