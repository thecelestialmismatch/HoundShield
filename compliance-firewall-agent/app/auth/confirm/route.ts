import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { EmailOtpType } from '@supabase/supabase-js';
import { confirmRedirect, confirmFailureRedirect } from '@/lib/auth/confirm-redirect';

/**
 * Email OTP confirmation handler (the SSR-canonical `token_hash` flow).
 *
 * The branded Supabase email templates (see docs/auth-password-reset.md) link to
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
 * Because that link targets the Site URL directly, it is immune to the
 * redirect-URL allow-list fallback that silently dumps recovery links on the
 * homepage. We verify the OTP here (establishing a session cookie), then forward
 * the user to set their new password.
 *
 * This complements /auth/callback, which handles the PKCE `?code=` flow used by
 * OAuth and the default (unbranded) email template.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next');

  if (tokenHash && type) {
    try {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            },
          },
        }
      );

      const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
      if (!error) {
        return noReferrer(NextResponse.redirect(new URL(confirmRedirect(type, next), origin)));
      }
    } catch {
      // Misconfigured env or a transient network failure must not 500 a user
      // whose link may simply be expired — fall through to the graceful
      // "Link expired" / login redirect below.
    }
  }

  // Missing params or verification failed (expired / already used).
  return noReferrer(NextResponse.redirect(new URL(confirmFailureRedirect(type), origin)));
}

/**
 * Partial mitigation for the one requirement this flow cannot fully meet:
 * "reset tokens are never exposed in URLs".
 *
 * Supabase's SSR recovery design puts `token_hash` in the query string, and
 * that is not ours to change — the link is minted by GoTrue's
 * admin.generateLink and has to arrive as a GET. So the token lands in this
 * request's URL, and from there in browser history and edge access logs.
 *
 * What we CAN stop is it travelling any further. `no-referrer` means the
 * redirect target (/reset-password) and every asset it loads receive no
 * Referer header, so the token-bearing URL is not handed to a third party or
 * written into a downstream log. The token is a single-use hash with a short
 * TTL, which bounds the rest.
 *
 * Reported as a partial in docs/SECURITY-AUDIT-2026-08-11.md rather than
 * claimed as satisfied.
 */
function noReferrer(res: NextResponse): NextResponse {
  res.headers.set('Referrer-Policy', 'no-referrer');
  return res;
}
