import { z } from 'zod';

/**
 * Password-reset request helpers for the self-hosted (no-dashboard-config)
 * recovery flow.
 *
 * Instead of Supabase's built-in auth mailer (unbranded sender + needs the
 * Redirect-URL allow-list + custom SMTP configured in the dashboard), the app
 * mints the recovery link itself via `auth.admin.generateLink` and sends a
 * branded email through Resend. The link targets our own `/auth/confirm` route
 * on the app's own origin, so it is immune to the GoTrue "redirect_to not
 * allow-listed → fall back to Site URL (homepage)" bug. See
 * docs/auth-password-reset.md.
 */

/** Bounded, normalized request body. Lower-casing + trimming keeps the emailed
 *  address canonical; 320 is the RFC 5321 max. */
export const recoveryRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
});

/**
 * Build the branded recovery link that lands on the allow-list-immune
 * `/auth/confirm` route. `tokenHash` is the `hashed_token` returned by
 * `supabase.auth.admin.generateLink({ type: 'recovery' })`. `base` should be the
 * app's canonical origin (NEXT_PUBLIC_APP_URL), never a request Host header, so
 * a spoofed host can't redirect the link off-site.
 */
export function buildRecoveryConfirmUrl(base: string, tokenHash: string): string {
  const url = new URL('/auth/confirm', base);
  url.searchParams.set('token_hash', tokenHash);
  url.searchParams.set('type', 'recovery');
  url.searchParams.set('next', '/reset-password');
  return url.toString();
}
