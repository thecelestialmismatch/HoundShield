import { createHash } from 'crypto';
import { createServiceClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { lockoutKey } from './lockout';

/**
 * Durable authentication audit trail.
 *
 * WHAT THIS REPLACES. Every credential route logged its outcome with
 * `console.log`, which is not an audit record: Vercel's retention is rolling
 * and short, the output is unqueryable, and it is readable and effectively
 * mutable by anyone with project access. For a product sold on SHA-256
 * hash-chained evidence, "we have logs" was true and "we have an audit trail"
 * was not. NIST 800-171 3.3.1 asks for records sufficient to investigate
 * unauthorized activity; a sign-in is the canonical example.
 *
 * NOT `compliance_events`. That table's `action_taken` is CHECK-constrained to
 * ('ALLOWED','BLOCKED','QUARANTINED') and it feeds the operator's gateway
 * telemetry (lib/dashboard/gateway-traffic.ts). Putting auth events there would
 * either violate the constraint or inflate a customer's "prompts scanned"
 * numbers with rows that were never prompts. See migration 032.
 *
 * ── Two design rules, both load-bearing ─────────────────────────────────────
 *
 * FAIL OPEN, LOUDLY. A failure to write an audit row must never prevent a
 * legitimate sign-in — an audit store outage would otherwise become a total
 * authentication outage, converting a logging problem into a business one.
 * But it must never be silent either, because "no rows" would then be
 * indistinguishable from "no attacks", which is precisely the state an
 * assessor is trying to rule out. Every failure logs at error level.
 *
 * NEVER AN ADDRESS. Rows are keyed on `lockoutKey()` — the same SHA-256 prefix
 * migration 031 uses — and written whether or not the address resolves. If
 * only real accounts produced rows, the presence of a row would prove the
 * account exists, re-opening the enumeration oracle the rest of the auth work
 * closes. `userId` is set only once identity is already established.
 *
 * ponytail: fire-and-forget writes, no batching. Add batching only if the row
 * rate ever justifies it — a queue here would add a failure mode to a path
 * whose entire job is to be boring.
 */

export type AuthAuditEvent =
  | 'login_success'
  | 'login_failure'
  | 'signup_requested'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'lockout_triggered'
  | 'email_verified'
  | 'logout';

export interface AuthAuditInput {
  event: AuthAuditEvent;
  /** The SUBMITTED address. Hashed here; never stored or logged raw. */
  email: string;
  /** Only when identity is already established. Never on a failure path. */
  userId?: string | null;
  /** Raw client IP. Hashed here; never stored raw. */
  ip?: string | null;
  /** Raw User-Agent header. Reduced to a coarse family; never stored raw. */
  userAgent?: string | null;
  /** Non-identifying context: reason category, lock minutes, captcha required. */
  detail?: Record<string, string | number | boolean | null>;
}

/**
 * Hash an IP for storage.
 *
 * Salted with the same secret the rest of the server already holds, so a
 * dump of this table cannot be brute-forced back to addresses — the IPv4 space
 * is small enough that an unsalted SHA-256 is reversible by exhaustion, which
 * makes an unsalted "hash" of an IP a plaintext IP with extra steps.
 */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip || ip === 'unknown') return null;
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.AUTH_AUDIT_SALT ?? '';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);
}

/** Recognised browser families, longest-match-first where names overlap. */
const UA_FAMILIES: Array<[RegExp, string]> = [
  // Edge and Opera must precede Chrome: both include "Chrome" in their UA.
  [/edg[ea]?\//i, 'edge'],
  [/opr\/|opera/i, 'opera'],
  [/chrome\/|crios\//i, 'chrome'],
  [/firefox\/|fxios\//i, 'firefox'],
  [/safari\//i, 'safari'],
  [/curl\/|wget\/|python-|go-http|axios\/|node-fetch/i, 'tool'],
];

/**
 * Reduce a User-Agent to a coarse family.
 *
 * The raw string is a fingerprinting vector and routinely carries corporate
 * build identifiers, which for a defence customer is itself sensitive. The
 * family is what an investigation actually uses ("the failures came from a
 * tool, not a browser"), so that is all we keep.
 */
export function userAgentFamily(ua: string | null | undefined): string {
  if (!ua) return 'unknown';
  for (const [pattern, family] of UA_FAMILIES) {
    if (pattern.test(ua)) return family;
  }
  return 'other';
}

/**
 * Write one audit row. Never throws, never blocks the caller's outcome.
 *
 * Call it on EVERY credential path, including the ones that fail — a trail
 * that records only successes cannot answer the question an investigation asks.
 */
export async function recordAuthEvent(input: AuthAuditInput): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from('auth_audit_events').insert({
      event_type: input.event,
      email_hash: lockoutKey(input.email),
      user_id: input.userId ?? null,
      ip_hash: hashIp(input.ip),
      user_agent: userAgentFamily(input.userAgent),
      detail: input.detail ?? {},
    });
    if (error) throw new Error(error.message);
  } catch (error: unknown) {
    // Loud, and deliberately specific about the consequence: a quiet failure
    // here makes "no rows" look like "no attacks".
    console.error(
      `[auth-audit] FAILED to persist ${input.event} — the authentication audit trail is ` +
        'incomplete for this event. Sign-in was NOT blocked. Cause:',
      error instanceof Error ? error.message : String(error),
    );
  }
}
