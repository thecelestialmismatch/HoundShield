import { createHash } from 'crypto';
import { createServiceClient, isSupabaseConfigured } from '@/lib/supabase/client';

/**
 * Per-account sign-in lockout — NIST 800-171 3.1.8 / CMMC AC.2.008,
 * "Limit unsuccessful logon attempts."
 *
 * HoundShield grades its own customers on this control
 * (lib/shieldready/controls/ac.ts:306, a -3 SPRS deduction) and asks them
 * "are your systems configured to lock a user account automatically after a
 * defined number of consecutive failed login attempts?" — so HoundShield has
 * to be able to answer yes about itself.
 *
 * NOT the same thing as the rate limiter. `enforceRateLimit` caps requests per
 * window; a lockout is stateful across windows: it counts CONSECUTIVE failures,
 * clears on a successful sign-in, and refuses even a CORRECT password while
 * the lock holds. That last property is what the control's evidence
 * requirement actually tests, and a rate-limit window cannot provide it.
 *
 * ENUMERATION: the key is a hash of the submitted email, and failures are
 * counted whether or not that email resolves to an account. Without that, a
 * "locked" response would itself prove the account exists. Never key this on a
 * user id.
 *
 * PRIVACY: only the SHA-256 of the normalized address is stored. The table
 * never holds an email, an IP, or any prompt content.
 *
 * AVAILABILITY: fails OPEN, matching lib/rate-limit-shared.ts. Sign-in runs
 * against Supabase Auth, which does not depend on this table — so a Postgres
 * blip must not lock every customer out of a product they are paying for. The
 * per-IP and per-email rate limits still apply on that path, and the degraded
 * decision is logged.
 */

/**
 * Consecutive failures before the account locks.
 *
 * 5 sits inside the 3-10 band HoundShield tells its own customers to use
 * (lib/shieldready/controls/ac.ts:314, :318). Named so the SSP can cite it
 * rather than quoting a literal buried in a route.
 */
export const LOCKOUT_THRESHOLD = 5;

/** How long the lock holds once it trips. */
export const LOCKOUT_MINUTES = 15;

export interface LockState {
  locked: boolean;
  /** Whole minutes left on the lock; 0 when not locked. */
  minutesRemaining: number;
  /** Consecutive failures recorded so far. Drives the CAPTCHA escalation. */
  consecutiveFailures: number;
  /** True when the shared store was unreachable and we failed open. */
  degraded: boolean;
}

const UNLOCKED: LockState = {
  locked: false,
  minutesRemaining: 0,
  consecutiveFailures: 0,
  degraded: false,
};
const DEGRADED: LockState = { ...UNLOCKED, degraded: true };

/**
 * Stable key for an email address. Normalizes first so `User@ACME.com` and
 * `user@acme.com` share one lock — otherwise case-flipping defeats the whole
 * mechanism.
 */
export function lockoutKey(email: string): string {
  const normalized = email.trim().toLowerCase();
  return createHash('sha256').update(normalized).digest('hex').slice(0, 32);
}

/** Pure: minutes left on a lock, rounded up. 0 when expired, absent, or unparseable. */
export function minutesRemaining(lockedUntil: string | null | undefined, now: number): number {
  if (!lockedUntil) return 0;
  const until = new Date(lockedUntil).getTime();
  if (!Number.isFinite(until) || until <= now) return 0;
  return Math.ceil((until - now) / 60_000);
}

/** Pure: turn a stored row into the state a route acts on. */
export function lockStateFrom(
  lockedUntil: string | null | undefined,
  now: number,
  failures = 0,
): LockState {
  const mins = minutesRemaining(lockedUntil, now);
  return {
    locked: mins > 0,
    minutesRemaining: mins,
    consecutiveFailures: Math.max(0, failures),
    degraded: false,
  };
}

/**
 * Is this email currently locked? Read-only — call BEFORE attempting auth so a
 * correct password is refused while the lock holds.
 */
export async function checkLockout(email: string): Promise<LockState> {
  if (!isSupabaseConfigured()) return UNLOCKED;
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('auth_lockouts')
      .select('locked_until, consecutive_failures')
      .eq('email_hash', lockoutKey(email))
      .maybeSingle();
    if (error) throw new Error(error.message);
    return lockStateFrom(
      data?.locked_until as string | undefined,
      Date.now(),
      (data?.consecutive_failures as number | undefined) ?? 0,
    );
  } catch (error: unknown) {
    console.warn(
      '[lockout] store unreachable on check — failing open:',
      error instanceof Error ? error.message : String(error),
    );
    return DEGRADED;
  }
}

/**
 * Record one failed attempt and return the resulting state. Locks the account
 * when the consecutive count reaches LOCKOUT_THRESHOLD.
 */
export async function registerFailure(email: string): Promise<LockState> {
  if (!isSupabaseConfigured()) return UNLOCKED;
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc('register_auth_failure', {
      p_email_hash: lockoutKey(email),
      p_threshold: LOCKOUT_THRESHOLD,
      p_lock_minutes: LOCKOUT_MINUTES,
    });
    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    return lockStateFrom(
      row?.locked_until as string | undefined,
      Date.now(),
      (row?.consecutive_failures as number | undefined) ?? 0,
    );
  } catch (error: unknown) {
    console.warn(
      '[lockout] store unreachable on failure — failing open:',
      error instanceof Error ? error.message : String(error),
    );
    return DEGRADED;
  }
}

/**
 * Wipe the failure count after a successful sign-in. "Consecutive" is only
 * meaningful if success resets it — without this the counter is a lifetime
 * total and every long-lived account eventually locks itself.
 */
export async function clearFailures(email: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = createServiceClient();
    await supabase.from('auth_lockouts').delete().eq('email_hash', lockoutKey(email));
  } catch (error: unknown) {
    console.warn(
      '[lockout] could not clear failures:',
      error instanceof Error ? error.message : String(error),
    );
  }
}
