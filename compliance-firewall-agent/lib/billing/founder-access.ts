import { configuredFounderEmail } from '@/lib/email/identity';

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
 *  - The list comes ONLY from env (FOUNDER_ACCESS_EMAILS / FOUNDER_EMAIL) — a
 *    deploy-time decision, not a runtime input, and nothing personal is
 *    committed to this public repo. Unset means nobody gets the override.
 *  - Pure + unit-tested; no I/O in this module.
 */

/** Top of the upgrade ladder — a strict superset of every other plan. */
export const FOUNDER_TIER = 'agency' as const;

/** Human plan label shown wherever the founder's "plan" is displayed. */
export const FOUNDER_PLAN_LABEL = 'Founder';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Addresses granted founder access, from configuration only.
 *
 * This repo is PUBLIC, so the founder's address is NOT hardcoded here — a
 * committed literal both publishes a personal mailbox and states in public
 * exactly which account holds top-tier access, which is an invitation.
 *
 * Configure with FOUNDER_ACCESS_EMAILS (comma-separated) or FOUNDER_EMAIL.
 * With neither set the list is EMPTY and no account gets the founder override —
 * fail-closed, which is the correct direction for an access grant. /api/health
 * reports whether it is configured so the lockout is visible, not silent.
 */
function configuredFounderEmails(): string[] {
  const fromList = (process.env.FOUNDER_ACCESS_EMAILS ?? '')
    .split(',')
    .map(normalizeEmail)
    .filter(Boolean);
  // FOUNDER_EMAIL is read ONLY by lib/email/identity, so the mail routing and
  // the access grant can never disagree about who the founder is.
  const single = configuredFounderEmail();
  return single ? [...fromList, normalizeEmail(single)] : fromList;
}

/**
 * Every email with founder access, from env only (case-insensitive). Empty when
 * unconfigured — no account gets the override.
 */
export function founderEmails(): string[] {
  return [...new Set(configuredFounderEmails())];
}

/** Is the founder override configured at all? Surfaced by /api/health. */
export function isFounderAccessConfigured(): boolean {
  return founderEmails().length > 0;
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
