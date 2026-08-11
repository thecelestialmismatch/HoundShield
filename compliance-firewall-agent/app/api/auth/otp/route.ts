import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import {
  guardCredentials,
  AUTH_LIMITS,
  isServerAuthEnabled,
  serverAuthDisabled,
} from '@/lib/auth/credential-guard';
import { registerFailure, clearFailures } from '@/lib/auth/lockout';
import { settleAuthTiming } from '@/lib/auth/timing';
import {
  AUTH_RATE_LIMITED,
  lockedOutMessage,
  isThrottleError,
} from '@/lib/auth/auth-error-message';
import { supabaseOtpErrorMessage } from '@/lib/auth/passwordless-state';

/**
 * POST /api/auth/otp — passwordless sign-in: send a code / magic link, and
 * verify a code.
 *
 * The client-side version of this flow was already enumeration-safe
 * (`shouldCreateUser:false` plus supabaseOtpErrorMessage, which never echoes
 * raw GoTrue text — it is the pattern the password paths were rewritten to
 * copy). What it had no way to do was bound the two abusable operations:
 *
 *   send   — an email-bomb vector, and it spends Supabase/Resend quota.
 *   verify — a 6-digit code is a 1,000,000-wide space, which is only safe if
 *            guesses are capped. Unbounded, it is brute-forceable in minutes,
 *            and a correct guess mints a full session.
 *
 * Both now go through the shared buckets. Verify additionally feeds the
 * lockout counter, because a wrong code is a failed credential attempt in
 * exactly the sense AC.2.008 means.
 *
 * Two actions in one route rather than two files: they share the schema, the
 * buckets and the settle-timing contract, and splitting them is how one of the
 * two later loses a clause.
 */

export const dynamic = 'force-dynamic';

const sendSchema = z.object({
  action: z.literal('send'),
  email: z.string().trim().toLowerCase().email().max(320),
  method: z.enum(['code', 'link']),
  /** Same-origin relative path only; re-checked below. */
  redirect: z.string().max(512).optional(),
  captchaToken: z.string().max(4096).optional(),
});

const verifySchema = z.object({
  action: z.literal('verify'),
  email: z.string().trim().toLowerCase().email().max(320),
  token: z.string().trim().regex(/^\d{6}$/),
  captchaToken: z.string().max(4096).optional(),
});

const bodySchema = z.discriminatedUnion('action', [sendSchema, verifySchema]);

/** Single-slash relative paths only — blocks `//evil.com` and absolute URLs. */
function safeRedirect(raw: string | undefined): string {
  if (raw && raw.startsWith('/') && !raw.startsWith('//') && !raw.includes('://')) return raw;
  return '/command-center';
}

/** The one send response. Identical whether or not the address has an account. */
const neutralSent = () => NextResponse.json({ ok: true });

export async function POST(request: Request) {
  const startedAt = Date.now();

  if (!isServerAuthEnabled()) return serverAuthDisabled();

  let body: z.infer<typeof bodySchema>;
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      await settleAuthTiming(startedAt);
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }
    body = parsed.data;
  } catch {
    await settleAuthTiming(startedAt);
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const isVerify = body.action === 'verify';

  const { blocked } = await guardCredentials({
    request,
    email: body.email,
    namespace: isVerify ? 'auth:otp-verify' : 'auth:otp-send',
    ipLimit: AUTH_LIMITS.otpIp,
    emailLimit: AUTH_LIMITS.otpEmail,
    captchaToken: body.captchaToken,
    // A wrong code IS a failed credential attempt; a send is not.
    useLockout: isVerify,
  });
  if (blocked) {
    await settleAuthTiming(startedAt);
    return blocked;
  }

  if (!isSupabaseConfigured()) {
    await settleAuthTiming(startedAt);
    return NextResponse.json(
      { error: 'Sign-in is not configured on this deployment.' },
      { status: 503 },
    );
  }

  try {
    const supabase = await createClient();

    if (body.action === 'send') {
      const origin = (process.env.NEXT_PUBLIC_APP_URL ?? '').trim() || new URL(request.url).origin;
      const options: { shouldCreateUser: boolean; emailRedirectTo?: string } = {
        // LOGIN only. An unknown address must not mint an account — that would
        // both enumerate and fill the table with junk rows.
        shouldCreateUser: false,
      };
      if (body.method === 'link') {
        options.emailRedirectTo = `${origin}/auth/callback?redirect=${encodeURIComponent(
          safeRedirect(body.redirect),
        )}`;
      }

      const { error } = await supabase.auth.signInWithOtp({ email: body.email, options });

      if (error && isThrottleError(error)) {
        await settleAuthTiming(startedAt);
        return NextResponse.json({ error: AUTH_RATE_LIMITED }, { status: 429 });
      }
      // Any other error (including "user not found") is swallowed: the caller
      // gets the same 200 either way.
      await settleAuthTiming(startedAt);
      return neutralSent();
    }

    const { error } = await supabase.auth.verifyOtp({
      email: body.email,
      token: body.token,
      type: 'email',
    });

    if (error) {
      const lock = await registerFailure(body.email);
      await settleAuthTiming(startedAt);
      if (lock.locked) {
        return NextResponse.json(
          { error: lockedOutMessage(lock.minutesRemaining) },
          { status: 429, headers: { 'Retry-After': String(lock.minutesRemaining * 60) } },
        );
      }
      // Reuses the existing mapper, which already never echoes raw server text.
      return NextResponse.json({ error: supabaseOtpErrorMessage(error.message) }, { status: 401 });
    }

    await clearFailures(body.email);
    await settleAuthTiming(startedAt);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error(
      '[auth/otp] request threw:',
      error instanceof Error ? error.message : String(error),
    );
    await settleAuthTiming(startedAt);
    return NextResponse.json({ error: 'Sign-in is unavailable right now.' }, { status: 503 });
  }
}
