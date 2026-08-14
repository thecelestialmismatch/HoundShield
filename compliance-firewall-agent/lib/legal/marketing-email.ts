import { createHmac, timingSafeEqual } from "node:crypto";
import { SITE_URL } from "@/lib/site-url";

/**
 * CAN-SPAM compliance for marketing email, in one place.
 *
 * WHAT WAS WRONG. The three onboarding emails — day3, day7 and day14, all sent
 * from `app/api/cron/email-drip/route.ts` — shipped with **no unsubscribe link,
 * no postal address, and nowhere to record an opt-out**.
 *
 * 15 U.S.C. §7704(a)(3) and (a)(5) require a functioning opt-out mechanism and
 * a valid physical postal address in every commercial message, and §7704(a)(4)
 * requires opt-outs to be honoured within 10 business days. The penalty is
 * assessed **per message**.
 *
 * WHY THERE IS NO VIOLATION YET, AND WHY THAT IS THE POINT. The drip has never
 * sent: its cron was never registered, because the repo-root vercel.json has no
 * `crons` key and Vercel reads only that file. It goes live the moment the
 * deployment topology is fixed — which is an open PR. So this module has to
 * land BEFORE that switch, not after.
 *
 * FAIL CLOSED IS THE LOAD-BEARING PART. `canSendMarketing()` returns false when
 * no postal address is configured, and the send paths consult it. The result is
 * that the drip stays dark rather than sending something unlawful — which is
 * the correct default for a company that does not yet have an address to
 * publish. A compliance feature that depends on someone remembering to finish
 * configuring it is the same class of defect as the three controls that were
 * failing open in `/api/health`.
 *
 * TRANSACTIONAL MAIL IS OUT OF SCOPE, deliberately. Receipts
 * (`report-order`), account-status notices (`canceled`) and application
 * acknowledgements (`partner-welcome`) are relationship messages under
 * §7702(17) and are exempt from the opt-out requirement. Adding "unsubscribe"
 * to a payment receipt would be worse than useless: it invites someone to opt
 * out of mail we are obliged to send them.
 */

/** Env var holding the physical postal address printed in every marketing email. */
const POSTAL_ADDRESS_ENV = "MARKETING_POSTAL_ADDRESS";

/**
 * The mailing address, or null when unset.
 *
 * A PO box or registered-agent/virtual-mailbox address satisfies §7704(a)(5);
 * it does not have to be an office. It deliberately has no default: inventing
 * one would be a false statement in a legal notice, and the founder's home
 * address must never be committed to a public repository.
 */
export function postalAddress(): string | null {
  const raw = (process.env[POSTAL_ADDRESS_ENV] ?? "").trim();
  if (raw.length === 0) return null;
  // A stray "undefined"/"null" is the classic env-var deploy slip, and here it
  // would print that literal word into a legal notice at the bottom of every
  // email. Found while writing the tests: `Object.assign(process.env, {X:
  // undefined})` stringifies rather than deletes, and the gate happily accepted
  // it. Treated as unset, so the send fails closed instead.
  if (/^(undefined|null|none|tbd|todo)$/i.test(raw)) return null;
  return raw;
}

/**
 * The HMAC key for unsubscribe tokens.
 *
 * Prefers a dedicated `UNSUBSCRIBE_SECRET`. Otherwise DERIVES one from the
 * service-role key with a domain separator rather than using that key directly
 * — same construction as HKDF-Expand. Using the database credential itself as a
 * signing key would mean a leaked unsubscribe token narrowed the search space
 * for the credential, and adding a second mandatory env var to ship a
 * compliance fix is how compliance fixes end up not shipping.
 */
function signingKey(): Buffer | null {
  const dedicated = (process.env.UNSUBSCRIBE_SECRET ?? "").trim();
  if (dedicated) return Buffer.from(dedicated, "utf8");

  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!serviceKey) return null;
  return createHmac("sha256", serviceKey).update("houndshield/unsubscribe/v1").digest();
}

/** Signature for a recipient id. Truncated to 32 hex chars — 128 bits. */
export function unsubscribeToken(userId: string): string | null {
  const key = signingKey();
  if (!key) return null;
  return createHmac("sha256", key).update(userId).digest("hex").slice(0, 32);
}

/**
 * Constant-time verification. A plain `===` on an HMAC leaks the position of
 * the first differing byte, which is enough to forge a token given enough
 * attempts — and this endpoint is unauthenticated by necessity.
 */
export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  const expected = unsubscribeToken(userId);
  if (!expected || !token || token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(token, "utf8"));
}

/** The one-click unsubscribe URL for a recipient, or null if it cannot be signed. */
export function unsubscribeUrl(userId: string): string | null {
  const token = unsubscribeToken(userId);
  if (!token) return null;
  return `${SITE_URL}/api/email/unsubscribe?u=${encodeURIComponent(userId)}&t=${token}`;
}

/**
 * Can a marketing message lawfully be sent right now?
 *
 * Both halves are required by statute, so both are checked: an address to print
 * (§7704(a)(5)) and a working opt-out link (§7704(a)(3)). Callers must treat
 * false as "do not send" — never as "send without the footer".
 */
export function canSendMarketing(userId?: string): boolean {
  if (postalAddress() === null) return false;
  if (signingKey() === null) return false;
  if (userId !== undefined && unsubscribeUrl(userId) === null) return false;
  return true;
}

/** Why marketing is blocked, for an operator reading a log or /api/health. */
export function marketingBlockReason(): string | null {
  if (postalAddress() === null) {
    return `${POSTAL_ADDRESS_ENV} is not set. CAN-SPAM 15 U.S.C. §7704(a)(5) requires a valid physical postal address in every commercial email, so marketing sending is disabled until one is configured. A PO box or registered-agent address is sufficient.`;
  }
  if (signingKey() === null) {
    return "Neither UNSUBSCRIBE_SECRET nor SUPABASE_SERVICE_ROLE_KEY is set, so unsubscribe links cannot be signed and marketing sending is disabled.";
  }
  return null;
}

/**
 * The footer appended to every marketing message.
 *
 * Appended by the SEND PATH, not pasted into each template — seven copies of a
 * legal notice is how six of them end up stale. Same lesson as the 29 copies of
 * the base URL.
 *
 * Returns null when marketing cannot lawfully be sent, so a caller that ignores
 * `canSendMarketing()` still cannot produce a non-compliant message.
 */
export function marketingFooter(userId: string): string | null {
  const address = postalAddress();
  const url = unsubscribeUrl(userId);
  if (!address || !url) return null;

  return `
    <div style="margin:32px 0 0;padding:20px 40px 32px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;line-height:1.6;">
      <p style="margin:0 0 8px;">
        You are receiving this because you created a HoundShield account.
        <a href="${url}" style="color:#64748b;text-decoration:underline;">Unsubscribe from onboarding emails</a>.
        This does not affect receipts, security notices or other messages about your account.
      </p>
      <p style="margin:0;">${address}</p>
    </div>`;
}

/**
 * `List-Unsubscribe` headers (RFC 2369 / RFC 8058).
 *
 * Not merely good practice: since February 2024 Gmail and Yahoo require
 * one-click unsubscribe from bulk senders, and mail without it is filtered or
 * rejected regardless of what CAN-SPAM says. `List-Unsubscribe-Post` is what
 * makes it one-click rather than a link the provider has to render.
 *
 * The https form only — no `mailto:`. A mailto would route opt-outs into a
 * human inbox where they get missed, and §7704(a)(4) puts a 10-business-day
 * clock on honouring them; the endpoint records them immediately.
 */
export function marketingHeaders(userId: string): Record<string, string> | null {
  const url = unsubscribeUrl(userId);
  if (!url) return null;
  return {
    "List-Unsubscribe": `<${url}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}
