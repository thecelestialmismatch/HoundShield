/**
 * /auth/confirm decision helpers — the two pure choices that the recovery /
 * email-confirmation route makes, kept out of the route so they can be unit
 * tested without a live Supabase.
 *
 * The route reads a Supabase `token_hash` + `type` link (the branded email
 * template — see docs/auth-password-reset.md), calls `verifyOtp` to establish a
 * session server-side, then redirects. Unlike `/auth/callback` (which relies on
 * GoTrue redirecting to an allow-listed `redirect_to`), the branded link targets
 * `{{ .SiteURL }}/auth/confirm` directly, so it can never fall back to the Site
 * URL / homepage — that is exactly the "reset link lands on the homepage" bug.
 */

/** Same-origin, single-slash relative path only — blocks open-redirect
 *  (`//evil.com`, `https://evil.com`, protocol-relative, or absolute URLs). */
function safeNext(next: string | null): string | null {
  if (next && next.startsWith('/') && !next.startsWith('//') && !next.includes('://')) {
    return next;
  }
  return null;
}

/**
 * Where to send the user after a SUCCESSFUL verifyOtp.
 * A recovery link must land on the set-a-new-password page; everything else
 * (signup/email confirmation, magic link) goes to the app. An explicit, safe
 * `next` always wins so the template can override per link.
 */
export function confirmRedirect(type: string | null, next: string | null): string {
  const dest = safeNext(next);
  if (dest) return dest;
  return type === 'recovery' ? '/reset-password' : '/console';
}

/**
 * Where to send the user when verifyOtp FAILS or the link is malformed
 * (expired, already used, missing params). Recovery failures return to
 * /reset-password, whose no-session state already renders "Link expired" with a
 * "request a new link" CTA; other failures go to login.
 */
export function confirmFailureRedirect(type: string | null): string {
  return type === 'recovery' ? '/reset-password?error=INVALID_TOKEN' : '/login?error=auth_failed';
}
