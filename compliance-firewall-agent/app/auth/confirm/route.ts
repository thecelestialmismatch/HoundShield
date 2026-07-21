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
        return NextResponse.redirect(new URL(confirmRedirect(type, next), origin));
      }
    } catch {
      // Misconfigured env or a transient network failure must not 500 a user
      // whose link may simply be expired — fall through to the graceful
      // "Link expired" / login redirect below.
    }
  }

  // Missing params or verification failed (expired / already used).
  return NextResponse.redirect(new URL(confirmFailureRedirect(type), origin));
}
