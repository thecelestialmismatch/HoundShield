/**
 * Reset-password view state — the one pure decision the /reset-password page
 * makes: given the active auth provider and what arrived in the URL / session,
 * do we show the "set a new password" form, an "expired link" message, or a
 * "verifying…" spinner?
 *
 * HoundShield runs two auth providers and the reset link arrives differently in
 * each, which is exactly the bug this untangles:
 *
 *   Better Auth  — the emailed link lands as /reset-password?token=… . The page
 *                  submits { newPassword, token }. No session involved.
 *   Supabase     — the emailed link goes through /auth/callback, which exchanges
 *                  the recovery code for a session and forwards to
 *                  /reset-password (NO token). The page submits the new password
 *                  against that recovery session (supabase.auth.updateUser).
 *
 * The old page was Better-Auth-only: with Supabase active it saw no ?token= and
 * showed "Link expired" for every real reset. Keeping the branch logic in one
 * pure, unit-tested function means the two providers can never silently diverge
 * again.
 */

export type ResetView = 'loading' | 'invalid' | 'form';

export interface ResetViewInput {
  /** True when Better Auth is the active client (token flow); false = Supabase. */
  betterAuth: boolean;
  /** Better Auth: the single-use token from ?token= (empty when absent). */
  token: string;
  /** Better Auth: ?error= on the link, e.g. "INVALID_TOKEN". */
  tokenError: string | null;
  /**
   * Supabase: has the recovery session been resolved yet?
   *   null  → still checking (show the spinner)
   *   true  → a recovery session exists (show the form)
   *   false → no session (expired/again — show the invalid state)
   * Ignored in Better Auth mode.
   */
  sessionReady: boolean | null;
}

export function resetView({
  betterAuth,
  token,
  tokenError,
  sessionReady,
}: ResetViewInput): ResetView {
  if (betterAuth) {
    return !token || tokenError ? 'invalid' : 'form';
  }
  // Supabase recovery-session mode.
  if (sessionReady === null) return 'loading';
  return sessionReady ? 'form' : 'invalid';
}
