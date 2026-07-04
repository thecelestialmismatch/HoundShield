/**
 * Order-view helpers for the $499 one-time "CMMC AI Risk Assessment Report".
 *
 * These are the pure, side-effect-free transforms that turn a raw `report_orders`
 * row (or a Stripe Checkout session normalized into the same shape) into the
 * SANITIZED, buyer-safe confirmation object rendered on `/report/thank-you` and
 * in the signed-in "My report orders" panel.
 *
 * Sanitization contract (why this file exists):
 *   - The email is ALWAYS masked (`j••••@acme.com`) — a confirmation surface
 *     keyed by an unguessable Stripe session id must never echo the full address.
 *   - No Stripe customer id, payment-intent id, or partner_ref ever leaves here.
 *   - The order reference is derived from the session id — stable, opaque, and
 *     safe to show a buyer or quote in a support email.
 *
 * Everything is a pure function so the whole surface is unit-testable with zero
 * mocks (the lessons file's standard for compliance-adjacent code).
 */

/** Fulfillment window: proxy runs for 14 days, then the signed PDF ships. */
export const REPORT_FULFILLMENT_DAYS = 14;

/** Fulfillment lifecycle, in order. Mirrors `report_orders.status`. */
export type ReportOrderStatus =
  | 'paid'
  | 'proxy_deployed'
  | 'report_delivered'
  | (string & {});

/**
 * The subset of a `report_orders` row (or a normalized Stripe session) that the
 * view builder reads. Every field is optional/nullable so a partial row — e.g.
 * synthesized from a Stripe session before the webhook has landed — still builds.
 */
export interface OrderRowLike {
  id?: string | null;
  email?: string | null;
  full_name?: string | null;
  vertical?: string | null;
  amount_cents?: number | null;
  currency?: string | null;
  status?: string | null;
  is_wholesale?: boolean | null;
  stripe_session_id?: string | null;
  report_delivered_at?: string | null;
  created_at?: string | null;
}

/** The sanitized, buyer-safe confirmation object. Safe to return from an API. */
export interface OrderView {
  reference: string;
  emailMasked: string;
  amountCents: number;
  amountFormatted: string;
  currency: string;
  vertical: string | null;
  verticalLabel: string | null;
  status: ReportOrderStatus;
  statusLabel: string;
  /** 1-based position in the 3-step fulfillment lifecycle (1..3). */
  statusStep: number;
  isWholesale: boolean;
  createdAt: string;
  reportDueDate: string;
  reportDeliveredAt: string | null;
}

/**
 * Mask an email for display: keep the first character of the local part and the
 * full domain, replace the rest of the local part with bullets.
 *   "jordan@acme.com" -> "j•••••@acme.com"
 *   "a@x.io"          -> "a@x.io"        (nothing to mask)
 *   ""/invalid        -> "•••••"
 */
export function maskEmail(email: string | null | undefined): string {
  const value = (email ?? '').trim();
  const at = value.indexOf('@');
  // Require a non-empty local part and a domain with a dot.
  if (at <= 0 || at === value.length - 1 || !value.slice(at + 1).includes('.')) {
    return '•••••';
  }
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  if (local.length <= 1) return `${local}@${domain}`;
  const masked = local[0] + '•'.repeat(Math.min(local.length - 1, 6));
  return `${masked}@${domain}`;
}

/**
 * A stable, opaque order reference derived from the Stripe session id (falling
 * back to the row id). Strips the `cs_test_` / `cs_live_` prefix and uppercases
 * the last 8 alphanumeric characters: `HS-A1B2C3D4`. Deterministic for a given
 * order, safe to show a buyer, and greppable in support.
 */
export function orderReference(order: Pick<OrderRowLike, 'stripe_session_id' | 'id'>): string {
  const raw = (order.stripe_session_id ?? order.id ?? '').trim();
  const alnum = raw.replace(/^cs_(test|live)_/i, '').replace(/[^A-Za-z0-9]/g, '');
  if (!alnum) return 'HS-PENDING';
  return `HS-${alnum.slice(-8).toUpperCase()}`;
}

/** Add whole days to an ISO timestamp, returning a new ISO string. */
export function addDays(iso: string, days: number): string {
  const base = new Date(iso);
  const ms = base.getTime();
  if (Number.isNaN(ms)) return iso;
  return new Date(ms + days * 24 * 60 * 60 * 1000).toISOString();
}

/** The date the signed PDF is due: order date + the 14-day fulfillment window. */
export function computeReportDueDate(
  createdAtISO: string,
  days: number = REPORT_FULFILLMENT_DAYS,
): string {
  return addDays(createdAtISO, days);
}

/** Format cents as currency, e.g. (49900, "usd") -> "$499.00". */
export function formatMoney(cents: number, currency: string = 'usd'): string {
  const code = (currency || 'usd').toUpperCase();
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
    }).format(cents / 100);
  } catch {
    // Unknown currency code — fall back to a plain dollar-style amount.
    return `$${(cents / 100).toFixed(2)}`;
  }
}

/** Human label for a sales vertical, or null for none/unknown. */
export function verticalLabel(vertical: string | null | undefined): string | null {
  switch ((vertical ?? '').toLowerCase()) {
    case 'defense':
      return 'Defense / DIB';
    case 'healthcare':
      return 'Healthcare';
    case 'legal':
      return 'Legal';
    default:
      return null;
  }
}

/** Label + 1-based lifecycle step for a fulfillment status. */
export function statusMeta(status: string | null | undefined): { label: string; step: number } {
  switch ((status ?? 'paid').toLowerCase()) {
    case 'report_delivered':
      return { label: 'Report delivered', step: 3 };
    case 'proxy_deployed':
      return { label: 'Proxy deployed — 14-day observation in progress', step: 2 };
    case 'paid':
    default:
      return { label: 'Payment received — deployment pending', step: 1 };
  }
}

/**
 * Build the sanitized confirmation view from a raw row (or normalized session).
 * Defensive about missing fields so a pre-webhook Stripe-only synthesis and a
 * fully-fulfilled DB row both produce a coherent object.
 */
export function buildOrderView(order: OrderRowLike): OrderView {
  const createdAt =
    order.created_at && !Number.isNaN(new Date(order.created_at).getTime())
      ? new Date(order.created_at).toISOString()
      : new Date().toISOString();

  const amountCents =
    typeof order.amount_cents === 'number' && order.amount_cents > 0
      ? order.amount_cents
      : 49900;

  const currency = (order.currency || 'usd').toLowerCase();
  const vertical = order.vertical && order.vertical.trim() ? order.vertical.trim() : null;
  const status = (order.status && order.status.trim()) || 'paid';
  const meta = statusMeta(status);

  return {
    reference: orderReference(order),
    emailMasked: maskEmail(order.email),
    amountCents,
    amountFormatted: formatMoney(amountCents, currency),
    currency,
    vertical,
    verticalLabel: verticalLabel(vertical),
    status,
    statusLabel: meta.label,
    statusStep: meta.step,
    isWholesale: Boolean(order.is_wholesale),
    createdAt,
    reportDueDate: computeReportDueDate(createdAt),
    reportDeliveredAt: order.report_delivered_at ?? null,
  };
}
