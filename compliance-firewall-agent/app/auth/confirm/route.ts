import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { EmailOtpType } from '@supabase/supabase-js';
import { confirmRedirect, confirmFailureRedirect } from '@/lib/auth/confirm-redirect';

/**
 * Email OTP confirmation handler (the SSR-canonical `token_hash` flow).
 *
 * This route now confirms email-verification links only. Password recovery uses
 * an application-owned one-time code entered in a POST body; accepting recovery
 * `token_hash` values here would reintroduce a bearer credential in a URL.
 *
 * This complements /auth/callback, which handles OAuth and the default PKCE
 * code-exchange flow.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next');

  // Recovery codes are intentionally never accepted from a URL. Existing legacy
  // links are redirected to the code-entry page without verification, so their
  // token remains unusable and is not copied to a subsequent request.
  if (type === 'recovery') {
    return noReferrer(NextResponse.redirect(new URL('/reset-password?error=REQUEST_CODE', origin)));
  }

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

/** Apply no-referrer to legacy-token rejection and verification redirects. */
function noReferrer(res: NextResponse): NextResponse {
  res.headers.set('Referrer-Policy', 'no-referrer');
  return res;
}
