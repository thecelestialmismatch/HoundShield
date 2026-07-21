/**
 * Pure decision logic for Supabase passwordless sign-in (email OTP code +
 * magic link), shared by the /login PasswordlessSignIn panel. Kept here,
 * unit-tested, so the UI can never leak raw GoTrue error text or reveal
 * whether an account exists.
 *
 * Flow (Supabase, the active provider):
 *   code  — signInWithOtp({ email, options:{ shouldCreateUser:false } })
 *           → email carries a 6-digit code (template must include {{ .Token }})
 *           → verifyOtp({ email, token, type:'email' }).
 *   link  — signInWithOtp({ email, options:{ shouldCreateUser:false,
 *           emailRedirectTo:/auth/callback } }) → user clicks the link →
 *           /auth/callback exchanges it into a session.
 *
 * shouldCreateUser:false makes this LOGIN-only: an unknown email must not mint
 * an account (no enumeration, no junk rows).
 */

export type PasswordlessView = 'choose' | 'code' | 'sent';

/**
 * Supabase throttle messages, e.g. "Email rate limit exceeded" or
 * "For security purposes, you can only request this after 47 seconds".
 * These are the only send-time errors we surface — everything else is hidden
 * so we never reveal whether the email has an account.
 */
export function isRateLimitError(raw?: string): boolean {
  const m = (raw ?? '').toLowerCase();
  return m.includes('rate limit') || m.includes('security purposes') || m.includes('too many');
}

/**
 * One friendly, enumeration-safe line per failure class. Never echoes raw
 * server text (which can name internals or account state).
 */
export function supabaseOtpErrorMessage(raw?: string): string {
  const m = (raw ?? '').toLowerCase();
  if (isRateLimitError(m)) return 'Too many requests — wait a minute, then try again.';
  if (m.includes('expired') || m.includes('invalid') || m.includes('token'))
    return 'That code is invalid or has expired. Request a fresh one.';
  return "We couldn't verify that code. Request a new one and try again.";
}
