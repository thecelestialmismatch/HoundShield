import { after, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { guardCredentials, AUTH_LIMITS } from '@/lib/auth/credential-guard';
import { registerFailure, clearFailures } from '@/lib/auth/lockout';
import { settleAuthTiming } from '@/lib/auth/timing';
import { consumePasswordResetCode } from '@/lib/auth/password-reset-codes';
import { recordAuthEvent } from '@/lib/auth/audit-log';
import { clientIp } from '@/lib/rate-limit-shared';
import { lockedOutMessage } from '@/lib/auth/auth-error-message';

/**
 * The code is 128 bits of random hex. Password policy is asserted here, not
 * trusted to browser attributes. The password is passed directly to Supabase
 * Auth, whose provider KDF stores it; HoundShield never hashes or persists it.
 */
const completeSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  code: z.string().trim().regex(/^[A-Fa-f0-9]{32}$/),
  password: z
    .string()
    .min(12, 'Use at least 12 characters.')
    .max(200)
    .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), {
      message: 'Include at least one letter and one number.',
    }),
  captchaToken: z.string().max(4096).optional(),
});

const INVALID_CODE = 'This reset request is invalid, expired, or already used.';
const UNAVAILABLE = 'Password reset is unavailable right now. Please request a new code later.';

export async function POST(request: Request) {
  const startedAt = Date.now();
  const ip = clientIp(request);

  let body: z.infer<typeof completeSchema>;
  try {
    const parsed = completeSchema.safeParse(await request.json());
    if (!parsed.success) {
      await settleAuthTiming(startedAt);
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }
    body = parsed.data;
  } catch {
    await settleAuthTiming(startedAt);
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { blocked } = await guardCredentials({
    request,
    email: body.email,
    namespace: 'auth:reset-complete',
    ipLimit: AUTH_LIMITS.resetCompleteIp,
    emailLimit: AUTH_LIMITS.resetCompleteEmail,
    captchaToken: body.captchaToken,
    useLockout: true,
  });
  if (blocked) {
    await settleAuthTiming(startedAt);
    return blocked;
  }

  if (!isSupabaseConfigured()) {
    await settleAuthTiming(startedAt);
    return NextResponse.json({ error: UNAVAILABLE }, { status: 503 });
  }

  const consumed = await consumePasswordResetCode(body.email, body.code);
  if (!consumed.ok) {
    const lock = await registerFailure(body.email);
    after(() =>
      recordAuthEvent({
        event: 'password_reset_completed',
        email: body.email,
        ip,
        userAgent: request.headers.get('user-agent'),
        detail: { outcome: consumed.reason },
      }),
    );
    await settleAuthTiming(startedAt);
    if (lock.locked) {
      return NextResponse.json(
        { error: lockedOutMessage(lock.minutesRemaining) },
        { status: 429, headers: { 'Retry-After': String(lock.minutesRemaining * 60) } },
      );
    }
    return NextResponse.json({ error: INVALID_CODE }, { status: 400 });
  }

  try {
    const supabase = createServiceClient();
    // The provider owns password hashing. This server route never stores the
    // plaintext or a fast hash; `updateUserById` enters Supabase Auth's slow KDF.
    const { error } = await supabase.auth.admin.updateUserById(consumed.userId, {
      password: body.password,
    });
    if (error) throw error;

    await clearFailures(body.email);
    after(() =>
      recordAuthEvent({
        event: 'password_reset_completed',
        email: body.email,
        userId: consumed.userId,
        ip,
        userAgent: request.headers.get('user-agent'),
        detail: { outcome: 'success', provider: 'supabase-admin' },
      }),
    );
    await settleAuthTiming(startedAt);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    // The code has been consumed to preserve single-use semantics. Never expose
    // provider detail, the account identity, password policy internals, or code.
    console.error('[reset-password/complete] provider update failed:', error instanceof Error ? error.message : String(error));
    after(() =>
      recordAuthEvent({
        event: 'password_reset_completed',
        email: body.email,
        ip,
        userAgent: request.headers.get('user-agent'),
        detail: { outcome: 'provider_error' },
      }),
    );
    await settleAuthTiming(startedAt);
    return NextResponse.json({ error: UNAVAILABLE }, { status: 503 });
  }
}
