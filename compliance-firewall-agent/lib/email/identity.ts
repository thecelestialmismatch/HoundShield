/**
 * Email identity — the ONE place that decides who HoundShield email comes FROM
 * and where human-actionable mail lands.
 *
 * WHY THIS MODULE EXISTS
 * Before it, four routes resolved "the inbox a human must act on" independently
 * and two of them disagreed: the $499 sale alert, the contact form and the warm
 * snapshot lead defaulted to contact@houndshield.com, while the RPO/MSP partner
 * application — the Stage-1 "≥1 referral agreement" goal — defaulted to
 * info@houndshield.com. Same concept, two destinations, no single source of
 * truth, and nothing anywhere enforced that founder-to-buyer mail is signed by
 * a named human. Four copies of a decision is four places for it to rot.
 *
 * THE TWO KINDS OF ADDRESS (the distinction the old code conflated)
 *  - ROUTING address: internal. Where we send mail so a human acts on it.
 *    Resolved by `founderInbox()`. Deploy-overridable via FOUNDER_EMAIL, because
 *    the founder may want alerts in a phone-notified inbox.
 *  - PUBLISHED address: public. What we print on a page or hand back to a
 *    browser when a form degrades. Always the generic `GENERAL_INBOX` constant —
 *    never the routing address. `/api/contact` used to return its routing
 *    address as `fallbackEmail`, so setting FOUNDER_EMAIL to a personal inbox
 *    would have published it to every visitor who hit the form while Resend was
 *    down. Routing and publishing are now different functions on purpose.
 *
 * SENDING vs RECEIVING (do not collapse these)
 * Resend SENDS as @houndshield.com (the domain is verified there — see
 * `reset_sender_domain` on /api/health). Hostinger RECEIVES: the mailboxes
 * contact@, info@ and Gaurav@ live there, which is what makes replies land
 * anywhere. Sending as Gaurav@ therefore needs no new DNS — same verified
 * domain, different local part — but a reply is only readable because the
 * Hostinger mailbox exists. See docs/FOUNDER-EMAIL-IDENTITY.md.
 *
 * Pure module: no I/O, no imports. Env is read inside functions (never at module
 * load) so a deploy-time env change takes effect without a cold restart.
 */

/** The founder's display name. Signs every human-written email. */
export const FOUNDER_NAME = 'Gaurav';

/** The founder's title, as it appears under the signature. */
export const FOUNDER_TITLE = 'Founder, HoundShield';

/**
 * The founder's canonical mailbox — a real Hostinger mailbox, confirmed by the
 * founder on 2026-07-29 alongside contact@ and info@. This is the From and
 * Reply-To for all human outreach (sales, partner, founder-to-buyer) and the
 * default destination for alerts a human must act on.
 *
 * Deliberately NOT info@ or contact@: a founder-to-buyer email from a generic
 * inbox reads like a newsletter and gets deleted unread.
 */
export const FOUNDER_ADDRESS = 'Gaurav@houndshield.com';

/**
 * The generic, publishable inbox. Safe to print on a page or return to a
 * browser. Used for the degraded-form fallback and the /contact page listing.
 */
export const GENERAL_INBOX = 'contact@houndshield.com';

/** Send-only address for automated mail. No mailbox needs to exist to send as this. */
export const NOREPLY_ADDRESS = 'noreply@houndshield.com';

/** The From header for automated/transactional mail (receipts, resets, drips). */
export const TRANSACTIONAL_FROM = `HoundShield <${NOREPLY_ADDRESS}>`;

/**
 * Minimal shape check for an email address. Deliberately conservative: one @,
 * no whitespace, a dot-bearing domain, no angle brackets. This validates SHAPE
 * so a typo'd env var cannot silently redirect revenue alerts into the void —
 * it does NOT prove the mailbox exists or accepts mail.
 */
export function isEmailShaped(value: string | null | undefined): boolean {
  if (!value) return false;
  const v = value.trim();
  if (v.length < 6 || v.length > 320) return false;
  if (/[\s<>,;"']/.test(v)) return false;
  return /^[^@]+@[^@.]+(\.[^@.]+)+$/.test(v);
}

/**
 * Reserved domains (RFC 2606 / RFC 6761) and template residue that must never
 * receive a real send. This is the code-level expression of "no flukes, only
 * genuine emails": a draft that still carries `[First name]@clinic.com`, or a
 * copy-pasted `someone@example.com`, is refused rather than delivered.
 *
 * Honest scope: this catches obvious placeholders. It is NOT an address
 * verifier — it cannot tell a real mailbox from a plausible-looking guess.
 * Verifying that a human actually exists at an address is a research step the
 * sender owns (docs/OUTREACH-SOURCING-RUNBOOK.md), not something code can do.
 */
const RESERVED_DOMAINS = [
  'example.com',
  'example.org',
  'example.net',
  'example.edu',
  'domain.com',
  'domain.tld',
  'yourcompany.com',
  'company.com',
  'clinic.com',
  'test.com',
  'email.tld',
];

const RESERVED_TLDS = ['.test', '.invalid', '.localhost', '.example', '.local'];

const TEMPLATE_TOKENS = [
  'firstname',
  'lastname',
  'first.last',
  'yourname',
  'clinicname',
  'companyname',
  'recipient',
  'placeholder',
];

/**
 * Is this address obviously not a real person? Returns true for reserved
 * example domains and unfilled template tokens.
 */
export function isPlaceholderAddress(value: string | null | undefined): boolean {
  if (!value) return true;
  const v = value.trim().toLowerCase();

  // Unsubstituted template markers: [First name], {{name}}, <email>
  if (/[[\]{}<>]/.test(v)) return true;

  const at = v.lastIndexOf('@');
  if (at === -1) return true;
  const local = v.slice(0, at);
  const domain = v.slice(at + 1);

  if (RESERVED_DOMAINS.includes(domain)) return true;
  if (RESERVED_TLDS.some((tld) => domain.endsWith(tld))) return true;
  if (TEMPLATE_TOKENS.some((token) => local.includes(token))) return true;

  return false;
}

/**
 * An address is safe to actually send to only if it is both well-shaped and not
 * a placeholder. Used by the send tool as a hard precondition.
 */
export function isSendableAddress(value: string | null | undefined): boolean {
  return isEmailShaped(value) && !isPlaceholderAddress(value);
}

/**
 * The inbox where mail a human must act on is delivered: $499 sale alerts, warm
 * snapshot leads, RPO/MSP partner applications, contact-form messages.
 *
 * Resolution order:
 *  1. FOUNDER_EMAIL, if it is email-shaped (a malformed value is ignored, not
 *     obeyed — a typo here would silently drop every revenue alert).
 *  2. FOUNDER_ADDRESS — the founder's real mailbox.
 *
 * Never returns an empty string, so no caller can construct a send with no
 * recipient.
 */
export function founderInbox(): string {
  const override = process.env.FOUNDER_EMAIL?.trim();
  if (isEmailShaped(override)) return override as string;
  return FOUNDER_ADDRESS;
}

/**
 * True when FOUNDER_EMAIL is set but unusable — surfaced by /api/health so a
 * typo is visible instead of silently falling back forever. Value-free: callers
 * learn that the var is bad, never what it contains.
 */
export function hasBrokenFounderEmailOverride(): boolean {
  const override = process.env.FOUNDER_EMAIL?.trim();
  if (!override) return false;
  return !isEmailShaped(override);
}

/**
 * Value-free readiness report for the founder inbox, shaped like this repo's other
 * diagnostics (`stripeKeyDiagnostic`, `passwordResetDiagnostic`) and consumed by
 * `/api/health`.
 *
 * Returns the DOMAIN and the source, never the mailbox: /api/health is public and
 * unauthenticated, so printing a live address there would hand it to a harvester.
 * Callers get enough to spot a misconfiguration and nothing more.
 */
export function founderInboxDiagnostic(): {
  source: 'override' | 'default';
  domain: string;
  broken: boolean;
} {
  const raw = process.env.FOUNDER_EMAIL?.trim();
  const broken = hasBrokenFounderEmailOverride();
  return {
    source: raw && !broken ? 'override' : 'default',
    domain: founderInbox().split('@')[1] ?? 'unknown',
    broken,
  };
}

/** From header for human outreach: `Gaurav <Gaurav@houndshield.com>`. */
export function founderFrom(): string {
  return `${FOUNDER_NAME} <${FOUNDER_ADDRESS}>`;
}

/**
 * From header for automated mail, optionally sub-labelled so a recipient can
 * tell a partner notification from a billing receipt at a glance.
 * `transactionalFrom('Partners')` → `HoundShield Partners <noreply@…>`.
 */
export function transactionalFrom(label?: string): string {
  const name = label?.trim() ? `HoundShield ${label.trim()}` : 'HoundShield';
  return `${name} <${NOREPLY_ADDRESS}>`;
}

/**
 * The signature block that closes every human-written email. Two lines, no
 * title inflation, no marketing tagline — a person writing to a person.
 */
export function founderSignature(): string {
  return `${FOUNDER_NAME}\n${FOUNDER_TITLE}`;
}
