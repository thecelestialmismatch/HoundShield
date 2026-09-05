"use client";

import { isBetterAuthClientEnabled, signOut as betterAuthSignOut } from "@/lib/auth/auth-client";
import { createClient } from "@/lib/supabase/browser";

/**
 * The ONE browser sign-out. Both call sites use it; there is no second copy.
 *
 * ─── The bug this closes ───────────────────────────────────────────────────
 *
 * There were two sign-out implementations and only one of them was correct.
 * `components/dashboard/SignOutButton.tsx` branched on the active provider;
 * `app/command-center/(tools)/settings/page.tsx` did not — it called Supabase's
 * `signOut()` unconditionally and ignored the result:
 *
 *     const supabase = createClient();
 *     await supabase.auth.signOut();   // no error check
 *     router.push('/login');
 *
 * With `AUTH_PROVIDER=better-auth` that is a no-op against a Better Auth
 * session. The user is redirected to /login and told they signed out while
 * their session cookie stays valid on the server — the failure mode a security
 * product can least afford. It was latent only because Supabase is still the
 * active provider; `lib/auth/auth-config.ts` describes the repo as mid-migration,
 * so it goes live the moment the flag flips.
 *
 * Swallowing the error was the second half of the defect: a revocation that
 * failed still redirected, which reports success it did not achieve.
 *
 * ─── Why a shared module rather than fixing the second copy ────────────────
 *
 * `tasks/lessons.md` records `escapeHtml` drifting across four copies, one of
 * which had a real gap. The same shape produced this one. Patching the copy
 * leaves the next sign-out free to forget the provider split again, so the
 * branch lives here once and
 * `lib/auth/__tests__/sign-out-single-source.test.ts` fails the build if any
 * component calls a provider's `signOut` directly.
 *
 * ─── Both paths end the session on the SERVER ──────────────────────────────
 *
 * Better Auth: POSTs /api/auth/sign-out, which deletes the `session` row.
 * Supabase:    calls GoTrue's logout endpoint to revoke the refresh token, and
 *              `createBrowserClient` (@supabase/ssr) clears the cookies the
 *              server reads. Neither is a cookie-only wipe.
 */
export async function signOutEverywhere(): Promise<void> {
  if (isBetterAuthClientEnabled()) {
    // Throws on failure — the caller must not redirect on a rejected promise.
    await betterAuthSignOut();
    return;
  }

  const { error } = await createClient().auth.signOut();
  if (error) throw error;
}
