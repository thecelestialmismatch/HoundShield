/**
 * Founder access — the ONE place that decides "this account gets everything,
 * no payment required."
 *
 * The founder signs in with the founder email and must be able to open, test
 * and demo every capability of the product — PDF reports, the AI gateway,
 * audit exports, on-prem settings — without a Stripe subscription existing.
 * That override is expressed as: "a founder email resolves to the TOP tier of
 * the entitlements ladder", so every existing gate (client tiles, /api/me,
 * customer status, the PDF 402 gate, gateway access) keeps reading one
 * coherent tier and no gate needs founder-specific branching logic.
 *
 * Security posture:
 *  - The match is on the SESSION email (server-verified by Supabase/Better
 *    Auth), never on anything client-sent.
 *  - The list is code-defaulted to the founder's address and can only be
 *    extended via the FOUNDER_ACCESS_EMAILS env var (comma-separated) — a
 *    deploy-time decision, not a runtime input.
 *  - Pure + unit-tested; no I/O in this module.
 */

/** Top of the upgrade ladder — a strict superset of every other plan. */
export const FOUNDER_TIER = 'agency' as const;

/** Human plan label shown wherever the founder's "plan" is displayed. */
export const FOUNDER_PLAN_LABEL = 'Founder';

/** The founder's canonical address. Always has full access. */
const DEFAULT_FOUNDER_EMAILS = ['gaurav@houndshield.com'];

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Every email with founder access: the canonical founder address plus any
 * extras granted via FOUNDER_ACCESS_EMAILS (comma-separated, case-insensitive).
 */
export function founderEmails(): string[] {
  const extra = (process.env.FOUNDER_ACCESS_EMAILS ?? '')
    .split(',')
    .map(normalizeEmail)
    .filter(Boolean);
  return [...new Set([...DEFAULT_FOUNDER_EMAILS, ...extra])];
}

/** Is this (session-verified) email a founder account? Case/space-insensitive. */
export function isFounderEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return founderEmails().includes(normalizeEmail(email));
}

/**
 * Resolve the tier every gate should bill against: founders get the top tier
 * regardless of what their profile/subscription says (including no row at
 * all); everyone else keeps their stored tier untouched.
 */
export function resolveEffectiveTier(
  email: string | null | undefined,
  storedTier: string | null | undefined,
): string {
  if (isFounderEmail(email)) return FOUNDER_TIER;
  return storedTier ?? 'free';
}
