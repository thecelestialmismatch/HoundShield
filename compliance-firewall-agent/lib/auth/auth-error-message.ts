/**
 * Neutral, non-enumerating messages for every credential-auth outcome.
 *
 * The rule this file exists to enforce: a caller must not be able to tell
 * whether an email has an account. That is broken by WORDING as much as by
 * status codes, and this repo had it broken in three places at once —
 * `/auth` echoed raw GoTrue text ("Email not confirmed" vs "Invalid login
 * credentials", a clean oracle), `/login` fell through to raw text for any
 * message it did not hardcode, and `/signup` said outright "That email is
 * already registered."
 *
 * Modelled on `supabaseOtpErrorMessage` in ./passwordless-state.ts, which
 * already got this right for the passwordless path: map to a fixed set of
 * strings, never echo raw server text, default to generic. Same discipline,
 * extended to the password paths and shared by the server routes so the
 * surfaces cannot drift apart again.
 *
 * WHAT MAY BE DISTINGUISHED, and why it leaks nothing:
 *   • throttling / lockout — the caller caused it and already knows they did.
 *     Both are keyed on the submitted email whether or not it resolves to an
 *     account (see ./lockout.ts), so "locked" is not an existence signal.
 *   • deployment-not-configured — a property of the build, not of any account.
 * Everything else collapses to one string.
 */

/** Every credential failure: wrong password, unknown email, unconfirmed, disabled. */
export const AUTH_INVALID_CREDENTIALS =
  "That email and password don't match an active account. Check both, and confirm your email if you signed up recently.";

/** Rate limited — by our own limiter or by GoTrue upstream. */
export const AUTH_RATE_LIMITED =
  'Too many attempts — please wait a minute, then try again.';

/** Anything we cannot classify. Never carries server text. */
export const AUTH_GENERIC_FAILURE =
  "We couldn't complete that just now — a temporary problem on our end. Please try again in a minute.";

/** CAPTCHA demanded but missing or rejected. */
export const AUTH_CAPTCHA_REQUIRED =
  'Please complete the verification challenge and try again.';

/**
 * Sign-up outcome. Deliberately identical for a brand-new email and one that
 * already has an account — that symmetry IS the fix for the enumeration leak
 * at app/signup/page.tsx.
 */
export const AUTH_SIGNUP_CHECK_EMAIL =
  "If that email can be registered, we've sent a confirmation link. Check your inbox — and your spam folder.";

/** Account is locked out. Minutes are rounded up; 0 renders as 1. */
export function lockedOutMessage(minutesRemaining: number): string {
  const mins = Math.max(1, Math.ceil(minutesRemaining));
  return `Too many failed sign-in attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}, or reset your password.`;
}

/** Values that are strings but carry no meaning — a stringified Error lands here. */
const JUNK = new Set(['', '{}', '[]', '[object object]', 'null', 'undefined']);

/**
 * Best-effort raw text from any error shape. Used ONLY to classify; the result
 * is never returned to a caller.
 */
function rawText(error: unknown): string {
  let raw = '';
  if (typeof error === 'string') raw = error;
  else if (error instanceof Error) raw = error.message ?? '';
  else if (error && typeof error === 'object') {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') raw = message;
  }
  raw = raw.trim();
  return JUNK.has(raw.toLowerCase()) ? '' : raw;
}

/** GoTrue and Better Auth throttle text. */
export function isThrottleError(error: unknown): boolean {
  const m = rawText(error).toLowerCase();
  return (
    m.includes('rate limit') ||
    m.includes('too many') ||
    m.includes('security purposes') ||
    m.includes('over_email_send_rate_limit')
  );
}

/**
 * The ONE message any sign-in failure produces.
 *
 * Throttling is the single distinguishable case, because the caller produced
 * it and it says nothing about whether the account exists.
 */
export function signInErrorMessage(error: unknown): string {
  return isThrottleError(error) ? AUTH_RATE_LIMITED : AUTH_INVALID_CREDENTIALS;
}

/**
 * The ONE message any sign-up failure produces.
 *
 * Note there is no "already registered" branch, by design. A collision is not
 * an error the caller may observe — the route returns the same
 * AUTH_SIGNUP_CHECK_EMAIL body it returns for a fresh address.
 */
export function signUpErrorMessageNeutral(error: unknown): string {
  return isThrottleError(error) ? AUTH_RATE_LIMITED : AUTH_GENERIC_FAILURE;
}
