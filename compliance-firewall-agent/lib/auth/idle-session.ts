/**
 * Idle session termination — the automatic logoff control.
 *
 * WHY THIS IS A PRODUCT REQUIREMENT, not a preference. HoundShield sells audit
 * evidence, so its own access controls are in scope for the frameworks it maps
 * against:
 *
 *   NIST 800-171 Rev 2  3.1.11 (AC.L2-3.1.11) — "Terminate (automatically) a
 *                       user session after a defined condition."
 *   HIPAA §164.312(a)(2)(iii)                 — Automatic logoff: terminate an
 *                       electronic session after a predetermined time of
 *                       inactivity.
 *
 * Rachel (Privacy Officer) and Jordan (Defense IT) both get asked for this by
 * an assessor. A dashboard that stays signed in on a shared clinic workstation
 * indefinitely is a finding against the tool that is supposed to produce the
 * evidence.
 *
 * WHY THE SERVER HOLDS THE CLOCK. A `setTimeout` in a React component is not a
 * session control — it dies with the tab, is trivially bypassed, and does
 * nothing at all for the case the founder actually described: close the laptop,
 * come back an hour later, refresh. That request only ever reaches the edge
 * middleware, so the middleware is where the decision has to be made. The
 * client-side warning banner (components/auth/IdleTimeout.tsx) is UX on top of
 * this, never the enforcement.
 *
 * WHY THE COOKIE IS SIGNED. The last-activity stamp lives in a cookie, which is
 * client-controlled storage. Unsigned, any user could hand back a fresh
 * timestamp forever and the control would be decorative. Each value is
 * HMAC-SHA256'd with the server secret, so a forged or edited stamp fails
 * verification and is treated as "no activity recorded" — i.e. it expires the
 * session rather than extending it. Fail closed.
 *
 * Everything here is Web Crypto + pure functions so it runs unchanged on the
 * Edge runtime (middleware) and is unit-testable with no mocks.
 */

/** How long a session may sit idle before it is terminated. */
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/** How long before termination the client should warn the user. */
export const IDLE_WARNING_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Signed last-activity stamp. Readable by client JS ON PURPOSE — the countdown
 * banner needs the deadline, and the timestamp is not a secret. It is not
 * `httpOnly` for that reason; its integrity comes from the HMAC, not from being
 * hidden. Forging it does not help an attacker, because verification fails and
 * a failed verification expires the session.
 */
export const IDLE_COOKIE = 'hs_last_activity';

/** Query flag carried to /login so the page can explain what happened. */
export const IDLE_LOGOUT_REASON = 'idle';

/**
 * Session cookies to clear on idle termination, across BOTH auth providers.
 * Supabase's chunked cookies (`sb-<ref>-auth-token.0`, `.1`, …) are matched by
 * prefix, so a name list alone would leave a resumable session behind.
 */
export const SESSION_COOKIE_PREFIXES = [
  'sb-', // Supabase auth token (often chunked)
  'better-auth.session_token',
  '__Secure-better-auth.session_token',
] as const;

/** True when `name` is one of the session cookies idle logout must clear. */
export function isSessionCookie(name: string): boolean {
  return SESSION_COOKIE_PREFIXES.some((p) => name.startsWith(p));
}

/**
 * Has the session been idle past the limit?
 *
 * A null/unknown last-activity means we cannot prove recent activity, so it
 * expires — the same fail-closed posture as a bad signature.
 */
export function isIdleExpired(
  lastActivityMs: number | null,
  now: number,
  timeoutMs: number = IDLE_TIMEOUT_MS,
): boolean {
  if (lastActivityMs === null || !Number.isFinite(lastActivityMs)) return true;
  // A stamp from the future is either clock skew or forgery. Treat modest skew
  // as live (clocks drift) and anything beyond the timeout window as invalid.
  if (lastActivityMs > now + timeoutMs) return true;
  return now - lastActivityMs > timeoutMs;
}

/** Milliseconds until termination; 0 once expired. */
export function msUntilIdleLogout(
  lastActivityMs: number | null,
  now: number,
  timeoutMs: number = IDLE_TIMEOUT_MS,
): number {
  if (lastActivityMs === null || !Number.isFinite(lastActivityMs)) return 0;
  return Math.max(0, lastActivityMs + timeoutMs - now);
}

const encoder = new TextEncoder();

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Constant-time string compare. `===` on a signature leaks, through timing,
 * how many leading characters a guess got right.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Build the signed cookie value for a given moment. */
export async function signActivity(timestampMs: number, secret: string): Promise<string> {
  const ts = String(Math.floor(timestampMs));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(ts));
  return `${ts}.${toHex(sig)}`;
}

/**
 * Recover the last-activity timestamp from a cookie value.
 * Returns null for anything missing, malformed, or not signed by this secret —
 * all of which `isIdleExpired` then treats as expired.
 */
export async function verifyActivity(
  value: string | undefined | null,
  secret: string,
): Promise<number | null> {
  if (!value) return null;
  const dot = value.lastIndexOf('.');
  if (dot <= 0) return null;

  const ts = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  if (!/^\d+$/.test(ts)) return null;

  const expected = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(ts));
  if (!timingSafeEqual(sig, toHex(expected))) return null;

  const parsed = Number(ts);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * The secret used to sign activity stamps.
 *
 * Falls back across the secrets this app already requires so idle logout works
 * on both auth providers without adding another variable the founder has to set
 * (an unset variable is how the CAPTCHA layer ended up inert). Returns null only
 * when the deployment has no server secret at all — see `idleEnforcementMode`.
 */
export function idleSecret(env: Record<string, string | undefined>): string | null {
  const candidates = [
    env.BETTER_AUTH_SECRET,
    env.SUPABASE_SERVICE_ROLE_KEY,
    env.STRIPE_WEBHOOK_SECRET,
  ];
  for (const c of candidates) {
    const v = (c ?? '').trim();
    if (v.length >= 16) return v;
  }
  return null;
}

/**
 * What idle enforcement can actually do in this deployment.
 *
 * 'enforced'  — a secret exists; stamps are signed and verified.
 * 'unavailable' — no server secret at all. We do NOT silently pretend to
 *   enforce (the CAPTCHA lesson: a security layer that returns "pass" for
 *   everything while looking configured is worse than an absent one), and we do
 *   NOT lock everyone out of a working deployment over a missing optional var.
 *   The state is reported by /api/health so it is visible rather than assumed.
 */
export function idleEnforcementMode(
  env: Record<string, string | undefined>,
): 'enforced' | 'unavailable' {
  return idleSecret(env) ? 'enforced' : 'unavailable';
}

/**
 * Surfaces that sit behind a login and must therefore be idle-terminated.
 *
 * Matched as exact path OR path + '/'. NEVER as a bare `startsWith`, because
 * `/partner` (the signed-in partner dashboard) and `/partners` (the PUBLIC
 * marketing page) differ by one character: a prefix match would bounce
 * prospects off the page that sells them the partner program.
 */
export const IDLE_PROTECTED_ROOTS = [
  '/command-center',
  '/partner',
  '/console',
  '/admin',
] as const;

/** True when `pathname` is a signed-in surface subject to idle termination. */
export function isIdleProtectedPath(pathname: string): boolean {
  return IDLE_PROTECTED_ROOTS.some(
    (root) => pathname === root || pathname.startsWith(`${root}/`),
  );
}

/**
 * Requests that must NOT count as user activity.
 *
 * Without this the control is defeated by our own app: the dashboard polls, and
 * a background fetch every 60s would refresh the stamp forever while the user
 * is at lunch. "Idle" has to mean the human is idle, not the tab.
 */
export function countsAsActivity(pathname: string, method: string): boolean {
  if (pathname === '/api/auth/session-status') return false;
  if (pathname === '/api/health') return false;
  // Server-sent/polling telemetry surfaces that tick on their own.
  if (pathname.startsWith('/api/metrics')) return false;
  if (pathname.startsWith('/api/cron')) return false;
  // Next.js prefetches a link the user merely hovered — not an interaction.
  if (method === 'HEAD') return false;
  return true;
}
