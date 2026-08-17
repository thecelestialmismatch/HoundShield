import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  enforceRateLimit,
  identifierFor,
  clientIp,
  type RateLimitOptions,
} from '@/lib/rate-limit-shared';
import { checkLockout, lockoutKey, type LockState } from '@/lib/auth/lockout';
import { captchaRequired, verifyCaptcha } from '@/lib/auth/captcha';
import { AUTH_CAPTCHA_REQUIRED, lockedOutMessage } from '@/lib/auth/auth-error-message';

/**
 * The shared front half of every credential route: rate limit, lockout,
 * CAPTCHA. One implementation so /login, /signup and /otp cannot drift apart —
 * three near-identical copies of a security check is how one of them quietly
 * loses a clause.
 *
 * Counting is delegated to `enforceRateLimit` (lib/rate-limit-shared.ts), which
 * is already Postgres-backed via migration 028 and therefore shared across
 * Fluid Compute instances. Nothing new is built here; a second in-memory
 * limiter would have the exact defect 028 was written to fix.
 *
 * TWO BUCKETS, because one is not enough:
 *   per-IP     — stops one host walking a password list.
 *   per-email  — stops a botnet spreading the same walk across many hosts,
 *                which a per-IP limit alone cannot see.
 * The email bucket is keyed on the SHA-256 from lockoutKey(), so no address
 * reaches the database. The IP bucket is keyed through identifierFor(), which
 * already hashes.
 */

/** Bounded, normalized credentials. 320 is the RFC 5321 max address length. */
export const credentialSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  password: z.string().min(1).max(200),
  captchaToken: z.string().max(4096).optional(),
});

/** Email-only body (OTP send, magic link). */
export const emailOnlySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  captchaToken: z.string().max(4096).optional(),
});

/**
 * Ceilings. Generous for a person, ruinous for a loop.
 *
 * The per-IP login figure is 20/min rather than something tighter because a
 * shared office NAT can legitimately produce a burst of sign-ins; the per-email
 * bucket is where the real protection lives, and it matches the 15-minute
 * lockout window so the two describe the same unit of time.
 */
export const AUTH_LIMITS = {
  loginIp: { limit: 20, windowMs: 60_000 },
  loginEmail: { limit: 5, windowMs: 900_000 },
  signupIp: { limit: 10, windowMs: 60_000 },
  signupEmail: { limit: 5, windowMs: 900_000 },
  otpIp: { limit: 10, windowMs: 60_000 },
  otpEmail: { limit: 5, windowMs: 900_000 },
  resetCompleteIp: { limit: 10, windowMs: 60_000 },
  resetCompleteEmail: { limit: 5, windowMs: 900_000 },
} as const satisfies Record<string, RateLimitOptions>;

export interface GuardInput {
  request: Request;
  email: string;
  /** Route scope for the buckets, e.g. "auth:login". */
  namespace: string;
  ipLimit: RateLimitOptions;
  emailLimit: RateLimitOptions;
  captchaToken?: string;
  /**
   * Consult the lockout table. True for sign-in only: signup and OTP have no
   * "wrong answer" to repeat, so there is no consecutive-failure streak for a
   * lock to count. Their abuse mode is volume, which the buckets above handle.
   */
  useLockout?: boolean;
}

export interface GuardResult {
  /** Ready-to-return response when the request must not proceed. */
  blocked: NextResponse | null;
  /** Lock state for the submitted email; zeroed when useLockout is false. */
  lock: LockState;
}

const NO_LOCK: LockState = {
  locked: false,
  minutesRemaining: 0,
  consecutiveFailures: 0,
  degraded: false,
};

/**
 * Run every pre-auth check. Returns a response to send, or null to proceed.
 *
 * Callers MUST still pass the result through settleAuthTiming() before
 * returning, on every path — see lib/auth/timing.ts.
 */
export async function guardCredentials(input: GuardInput): Promise<GuardResult> {
  const { request, email, namespace, ipLimit, emailLimit, captchaToken, useLockout } = input;

  const ip = clientIp(request);

  // Per-IP first: the cheapest check that rejects the loudest abuse.
  const ipBlocked = await enforceRateLimit(`${namespace}:ip`, identifierFor({ ip }), ipLimit);
  if (ipBlocked) return { blocked: ipBlocked, lock: NO_LOCK };

  // Per-email second, keyed on the hash so no address is stored.
  const emailBlocked = await enforceRateLimit(
    `${namespace}:email`,
    `e:${lockoutKey(email)}`,
    emailLimit,
  );
  if (emailBlocked) return { blocked: emailBlocked, lock: NO_LOCK };

  if (!useLockout) return { blocked: null, lock: NO_LOCK };

  const lock = await checkLockout(email);

  // A live lock refuses even a correct password. That is the point of a
  // lockout rather than a rate limit, and it is what AC.2.008 evidence tests.
  if (lock.locked) {
    return {
      blocked: NextResponse.json(
        { error: lockedOutMessage(lock.minutesRemaining) },
        { status: 429, headers: { 'Retry-After': String(lock.minutesRemaining * 60) } },
      ),
      lock,
    };
  }

  // Escalating challenge: only after repeated failures, so a customer who
  // signs in correctly never sees one.
  if (captchaRequired(lock.consecutiveFailures)) {
    const passed = await verifyCaptcha(captchaToken, ip);
    if (!passed) {
      return {
        blocked: NextResponse.json(
          { error: AUTH_CAPTCHA_REQUIRED, captchaRequired: true },
          { status: 400 },
        ),
        lock,
      };
    }
  }

  return { blocked: null, lock };
}

/**
 * Is the server-side credential path switched on?
 *
 * Read at REQUEST time from a server-only variable, never NEXT_PUBLIC_* — a
 * public flag is inlined at build time, so reverting it would need a rebuild
 * (see lib/auth/signin-availability.ts:18 for what that cost last time). Off
 * means the route answers 501 and the browser falls back to calling Supabase
 * directly, exactly as it did before this work: a one-variable rollback with
 * no redeploy.
 */
export function isServerAuthEnabled(): boolean {
  // Production must never silently fall back to browser-direct provider calls:
  // that bypasses the timing, abuse-control, audit, and verification boundary.
  if (process.env.NODE_ENV === 'production') return true;
  return (process.env.AUTH_SERVER_ROUTES ?? '').trim().toLowerCase() !== 'off';
}

/** Development-only compatibility response; production always keeps the server boundary enabled. */
export function serverAuthDisabled(): NextResponse {
  return NextResponse.json(
    { error: 'Authentication is unavailable in this development environment.' },
    { status: 503 },
  );
}
