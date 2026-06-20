import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * OAuth callback handler.
 * Supabase redirects here after Google/GitHub login.
 * Exchanges the auth code for a session, then redirects to the app.
 */
/** Only allow same-origin, single-slash relative paths — blocks open-redirect
 *  (e.g. `//evil.com` or `https://evil.com`, which `new URL()` would honour). */
function safeRedirect(raw: string | null): string {
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return '/console';
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirect = safeRedirect(searchParams.get('redirect'));

  if (code) {
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

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(redirect, origin));
    }
  }

  // Something went wrong — redirect to login with error
  return NextResponse.redirect(new URL('/login?error=auth_failed', origin));
}
