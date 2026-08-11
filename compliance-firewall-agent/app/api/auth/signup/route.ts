import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import {
  credentialSchema,
  guardCredentials,
  AUTH_LIMITS,
  isServerAuthEnabled,
  serverAuthDisabled,
} from '@/lib/auth/credential-guard';
import { settleAuthTiming } from '@/lib/auth/timing';
import {
  AUTH_SIGNUP_CHECK_EMAIL,
  AUTH_RATE_LIMITED,
  isThrottleError,
} from '@/lib/auth/auth-error-message';

/**
 * POST /api/auth/signup — server-side account creation.
 *
 * THE LEAK THIS REPLACES. app/signup/page.tsx used to answer "That email is
 * already registered" — an unauthenticated oracle for "does this person have
 * an account here?", which for a compliance product means "is this company a
 * HoundShield customer?". It reached that message two ways: GoTrue's error
 * text, and the empty-`identities` inference in lib/auth/signup-result.ts.
 * Both are closed here by never distinguishing the two cases at all.
 *
 * A fresh address and one that already exists produce a byte-identical
 * response: 200 with AUTH_SIGNUP_CHECK_EMAIL. The person who genuinely owns
 * the address learns which it was from their inbox — Supabase sends a
 * confirmation to a new address and nothing to an existing one — and that
 * channel is not available to an attacker probing addresses they do not own.
 *
 * ⚠️ ONE CONFIGURATION DEPENDENCY, stated rather than hidden. This symmetry
 * holds only while Supabase "Confirm email" is ON. With auto-confirm, a NEW
 * address gets a live session and an EXISTING one does not, and that
 * difference is observable no matter what this route writes in the body. The
 * route detects it and logs a warning; turning the setting on is the founder
 * item that makes requirement 3 and this half of requirement 1 real.
 */

export const dynamic = 'force-dynamic';

const signupSchema = credentialSchema.extend({
  name: z.string().trim().max(120).optional(),
  password: z.string().min(8).max(200),
});

/** The one success body. Identical for a new address and an existing one. */
const neutralOk = () => NextResponse.json({ ok: true, message: AUTH_SIGNUP_CHECK_EMAIL });

export async function POST(request: Request) {
  const startedAt = Date.now();

  if (!isServerAuthEnabled()) return serverAuthDisabled();

  let email: string;
  let password: string;
  let name: string | undefined;
  let captchaToken: string | undefined;
  try {
    const parsed = signupSchema.safeParse(await request.json());
    if (!parsed.success) {
      await settleAuthTiming(startedAt);
      // Input-shape feedback only — it describes the request, not any account.
      return NextResponse.json(
        { error: 'Enter a valid email address and a password of at least 8 characters.' },
        { status: 400 },
      );
    }
    ({ email, password, name, captchaToken } = parsed.data);
  } catch {
    await settleAuthTiming(startedAt);
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { blocked } = await guardCredentials({
    request,
    email,
    namespace: 'auth:signup',
    ipLimit: AUTH_LIMITS.signupIp,
    emailLimit: AUTH_LIMITS.signupEmail,
    captchaToken,
    // No lockout: sign-up has no wrong answer to repeat, so there is no
    // consecutive-failure streak to count. Its abuse mode is volume, which the
    // two buckets above already bound.
    useLockout: false,
  });
  if (blocked) {
    await settleAuthTiming(startedAt);
    return blocked;
  }

  if (!isSupabaseConfigured()) {
    await settleAuthTiming(startedAt);
    return NextResponse.json(
      { error: 'Sign-up is not configured on this deployment.' },
      { status: 503 },
    );
  }

  const origin = (process.env.NEXT_PUBLIC_APP_URL ?? '').trim() || new URL(request.url).origin;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name ?? '' },
        emailRedirectTo: `${origin}/auth/callback?redirect=${encodeURIComponent('/command-center?welcome=true')}`,
      },
    });

    // Throttling is the one failure a caller may see: they caused it, and it
    // is keyed on their request rate, not on whether the address exists.
    if (error && isThrottleError(error)) {
      await settleAuthTiming(startedAt);
      return NextResponse.json({ error: AUTH_RATE_LIMITED }, { status: 429 });
    }

    if (error) {
      // Everything else — including a duplicate-email error — is swallowed and
      // answered with the neutral body. Logged without the address.
      console.info('[auth/signup] sign-up did not create an account (reason withheld from caller)');
      await settleAuthTiming(startedAt);
      return neutralOk();
    }

    if (data?.session) {
      // Auto-confirm is ON. The account is live, so send them into the product
      // — but this branch is exactly the enumeration gap described above.
      console.warn(
        '[auth/signup] Supabase returned a session on sign-up: "Confirm email" is OFF, ' +
          'so sign-up is enumerable by session presence. Enable it in the Supabase dashboard.',
      );
      await settleAuthTiming(startedAt);
      return NextResponse.json({ ok: true, next: '/command-center?welcome=true' });
    }
  } catch (error: unknown) {
    console.error(
      '[auth/signup] sign-up threw:',
      error instanceof Error ? error.message : String(error),
    );
    await settleAuthTiming(startedAt);
    return NextResponse.json({ error: 'Sign-up is unavailable right now.' }, { status: 503 });
  }

  await settleAuthTiming(startedAt);
  return neutralOk();
}
