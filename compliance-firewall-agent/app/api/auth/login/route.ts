import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import {
  credentialSchema,
  guardCredentials,
  AUTH_LIMITS,
  isServerAuthEnabled,
  serverAuthDisabled,
} from '@/lib/auth/credential-guard';
import { registerFailure, clearFailures } from '@/lib/auth/lockout';
import { settleAuthTiming } from '@/lib/auth/timing';
import {
  signInErrorMessage,
  lockedOutMessage,
  AUTH_GENERIC_FAILURE,
} from '@/lib/auth/auth-error-message';

/**
 * POST /api/auth/login — server-side password sign-in.
 *
 * WHY THIS ROUTE EXISTS. Sign-in used to run entirely in the browser, calling
 * Supabase GoTrue directly. HoundShield's server never saw an attempt, so rate
 * limiting, account lockout and response-timing control were not merely absent
 * — there was no point in the request path to attach them to. Moving the call
 * behind a route is what makes all three possible, and lockout in particular is
 * NIST 800-171 3.1.8 / CMMC AC.2.008, a control this product grades its own
 * customers on (lib/shieldready/controls/ac.ts:306).
 *
 * ENUMERATION. Every failure — unknown email, wrong password, unconfirmed
 * address, disabled user — returns the SAME 401 with the SAME body. The one
 * distinguishable outcome is throttling/lockout, which the caller produced and
 * which is keyed on the submitted email whether or not an account exists (see
 * lib/auth/lockout.ts), so it proves nothing.
 *
 * TIMING. Every path settles through settleAuthTiming() before returning,
 * including the early failures. A path that returns without settling becomes
 * the oracle the rest of this file exists to close.
 *
 * ROLLBACK. AUTH_SERVER_ROUTES=off makes this answer 501 and the browser falls
 * back to its previous direct-to-Supabase call. Server-read, so it takes effect
 * without a rebuild.
 */

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const startedAt = Date.now();

  if (!isServerAuthEnabled()) return serverAuthDisabled();

  let email: string;
  let password: string;
  let captchaToken: string | undefined;
  try {
    const parsed = credentialSchema.safeParse(await request.json());
    if (!parsed.success) {
      await settleAuthTiming(startedAt);
      // Neutral: a malformed body says nothing about any account.
      return NextResponse.json({ error: signInErrorMessage(null) }, { status: 400 });
    }
    ({ email, password, captchaToken } = parsed.data);
  } catch {
    await settleAuthTiming(startedAt);
    return NextResponse.json({ error: signInErrorMessage(null) }, { status: 400 });
  }

  const { blocked } = await guardCredentials({
    request,
    email,
    namespace: 'auth:login',
    ipLimit: AUTH_LIMITS.loginIp,
    emailLimit: AUTH_LIMITS.loginEmail,
    captchaToken,
    useLockout: true,
  });
  if (blocked) {
    await settleAuthTiming(startedAt);
    return blocked;
  }

  // A deployment with no Supabase credentials can never authenticate anyone.
  // Say so rather than returning "invalid credentials" for a correct password.
  if (!isSupabaseConfigured()) {
    await settleAuthTiming(startedAt);
    return NextResponse.json(
      { error: 'Sign-in is not configured on this deployment.' },
      { status: 503 },
    );
  }

  let authError: unknown = null;
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    authError = error;
  } catch (error: unknown) {
    // Never surface internals. Logged server-side only.
    console.error(
      '[auth/login] sign-in threw:',
      error instanceof Error ? error.message : String(error),
    );
    await settleAuthTiming(startedAt);
    return NextResponse.json({ error: AUTH_GENERIC_FAILURE }, { status: 503 });
  }

  if (authError) {
    const lock = await registerFailure(email);
    await settleAuthTiming(startedAt);
    if (lock.locked) {
      return NextResponse.json(
        { error: lockedOutMessage(lock.minutesRemaining) },
        { status: 429, headers: { 'Retry-After': String(lock.minutesRemaining * 60) } },
      );
    }
    return NextResponse.json({ error: signInErrorMessage(authError) }, { status: 401 });
  }

  // "Consecutive" only means consecutive if success resets the streak.
  await clearFailures(email);
  await settleAuthTiming(startedAt);
  // The session cookie was set by the Supabase SSR client during the call above.
  return NextResponse.json({ ok: true });
}
