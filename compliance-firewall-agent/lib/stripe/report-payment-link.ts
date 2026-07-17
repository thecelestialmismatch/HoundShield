/**
 * Stripe-hosted Payment Link fallback for the $499 report — the sales rail
 * that a bad STRIPE_SECRET_KEY paste cannot take down.
 *
 * Why this exists: on 2026-07-16 the publishable `pk_` key landed in
 * STRIPE_SECRET_KEY and every dynamic checkout attempt failed with a Stripe
 * auth error — the buyer saw "Failed to create checkout session" and the
 * company could not take money (zero charges ever, per a live API read on
 * 2026-07-17). A Payment Link is hosted and billed by Stripe against the
 * account directly, so it keeps selling no matter what this app's env holds.
 *
 * The link below was verified against the live account on 2026-07-17
 * (`plink_1Tge3jQK7cyCnCHkqWpUnmze`, active, selling
 * `price_1Tge3aQK7cyCnCHkfIfVDAGt` — the $499 CMMC AI Risk Assessment
 * Report, one-time). Payment Link URLs are public by design.
 *
 * Fallback trade-offs vs dynamic checkout (all acceptable while the rail is
 * down, all recovered the moment the real key lands): no promotion codes,
 * Stripe's hosted confirmation instead of /report/thank-you, and no session
 * metadata — but the webhook records ANY `mode: 'payment'` session as a
 * report order, and the vertical survives via `?client_reference_id` (see
 * `verticalFromClientReference`).
 */

const LIVE_REPORT_PAYMENT_LINK = 'https://buy.stripe.com/aFa00lgzIgJx3Aqb7qgUM00';

/** The verticals the $499 report is sold into. Single source — the checkout
 *  route and the webhook attribution both import this. */
export const REPORT_VERTICALS = ['defense', 'healthcare', 'legal'] as const;
export type ReportVertical = (typeof REPORT_VERTICALS)[number];

const CLIENT_REF_PREFIX = 'report-';

/**
 * Base Payment Link URL. `STRIPE_REPORT_PAYMENT_LINK` overrides it (link
 * rotation without a deploy of this constant), but only when it is actually a
 * Stripe Payment Link URL — a garbled env value must not become a redirect
 * target, and falling back to the known-good live link keeps the rail up.
 */
export function reportPaymentLinkBase(): string {
  const raw = process.env.STRIPE_REPORT_PAYMENT_LINK?.trim();
  if (raw && /^https:\/\/buy\.stripe\.com\/[A-Za-z0-9]+$/.test(raw)) return raw;
  return LIVE_REPORT_PAYMENT_LINK;
}

/**
 * The buyer-facing fallback URL. A static link carries no metadata, but
 * `client_reference_id` passed as a query param lands verbatim on the
 * Checkout Session Stripe creates from it — so the webhook can still
 * attribute the sale to the fallback rail and (when known) the vertical.
 */
export function reportPaymentLinkUrl(vertical?: string): string {
  const ref = (REPORT_VERTICALS as readonly string[]).includes(vertical ?? '')
    ? `${CLIENT_REF_PREFIX}${vertical}`
    : `${CLIENT_REF_PREFIX}direct`;
  return `${reportPaymentLinkBase()}?client_reference_id=${ref}`;
}

/**
 * Webhook-side reverse of `reportPaymentLinkUrl`: recover the vertical from a
 * session's `client_reference_id`. Returns null for absent/foreign refs and
 * for `report-direct` (rail marker, no vertical).
 */
export function verticalFromClientReference(
  ref: string | null | undefined,
): ReportVertical | null {
  if (!ref || !ref.startsWith(CLIENT_REF_PREFIX)) return null;
  const v = ref.slice(CLIENT_REF_PREFIX.length);
  return (REPORT_VERTICALS as readonly string[]).includes(v) ? (v as ReportVertical) : null;
}
