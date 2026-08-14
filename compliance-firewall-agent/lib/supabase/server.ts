import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Create a Supabase client for Server Components / Route Handlers.
 * Uses cookie-based sessions for proper Next.js App Router auth.
 *
 * SESSION COOKIE FLAGS (audit finding #2). This file previously passed no
 * `cookieOptions` at all, so the session cookie took the `@supabase/ssr`
 * defaults verbatim: `sameSite: "lax"`, `httpOnly: false`, `maxAge` 400 days,
 * and NO `secure` flag. Three notes on what changed and what deliberately did
 * not — each verified against the installed library, not assumed:
 *
 *  • `secure` is now set in production. It passes through the library's option
 *    merge untouched (`cookies.js:231-234`). HSTS plus the edge HTTP→HTTPS
 *    redirect already make plaintext transmission unlikely; this is the
 *    defence-in-depth that does not depend on either of those holding.
 *
 *  • `maxAge` is deliberately NOT passed, because passing it does nothing.
 *    @supabase/ssr 0.12.4 spreads caller options and then OVERWRITES the result
 *    with its own default on both cookie-set paths:
 *      cookies.js:231-234  `{...DEFAULT_COOKIE_OPTIONS, ...options?.cookieOptions,
 *                            maxAge: DEFAULT_COOKIE_OPTIONS.maxAge}`
 *      cookies.js:461-465  the same construction on the server response path.
 *    Measured, not read: requesting `maxAge: 2592000` (30 days) emits a cookie
 *    carrying `maxAge: 34560000` (400 days). The audit's recommendation to
 *    shorten the session "via cookieOptions" is therefore not implementable
 *    here, and shipping it would have been a fix that changed nothing while
 *    reading in review as if it had. Session lifetime is governed by GoTrue's
 *    JWT expiry and refresh-token rotation — a Supabase dashboard setting
 *    (Authentication → Sessions), which is the founder's to change.
 *    `lib/auth/__tests__/session-cookie-flags.test.ts` pins this so the day a
 *    library upgrade starts honouring the option, it goes red and says so.
 *
 *  • `httpOnly` stays `false`. That is a design decision by @supabase/ssr, not
 *    a misconfiguration here: the browser client in `lib/supabase/browser.ts`
 *    reads the session from this cookie, and `app/login/page.tsx` and
 *    `app/signup/page.tsx` both depend on it. Flipping the flag breaks
 *    client-side auth. The tractable mitigation is CSP hardening (see
 *    next.config.js), not this line.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim(),
    {
      cookieOptions: {
        // Dev serves over http://localhost, where a Secure cookie is never sent
        // back — gating on NODE_ENV keeps local sign-in working.
        secure: process.env.NODE_ENV === 'production',
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method is called from a Server Component where
            // cookies can't be set. This is fine — the middleware will
            // refresh the session.
          }
        },
      },
    }
  );
}
