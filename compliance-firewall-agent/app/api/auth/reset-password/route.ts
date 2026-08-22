import { after, NextResponse } from 'next/server';
import { recoveryRequestSchema } from '@/lib/auth/recovery-link';
import { sendPasswordResetCodeEmail } from '@/lib/auth/auth-emails';
import {
  issuePasswordResetCode,
  PASSWORD_RESET_CODE_TTL_MINUTES,
} from '@/lib/auth/password-reset-codes';
import { enforceRateLimit, identifierFor, clientIp } from '@/lib/rate-limit-shared';
import { lockoutKey } from '@/lib/auth/lockout';
import { verifyCaptcha } from '@/lib/auth/captcha';
import { AUTH_CAPTCHA_REQUIRED } from '@/lib/auth/auth-error-message';
import { settleAuthTiming } from '@/lib/auth/timing';
import { recordAuthEvent } from '@/lib/auth/audit-log';

/**
 * POST /api/auth/reset-password
 *
 * Password-reset delivery is intentionally code based. A raw recovery code is
 * sent only in the email body; it is never created as a URL, query parameter,
 * redirect target, browser-history entry, or log field. The server stores only
 * a keyed hash, with a maximum 60-minute expiry and atomic single-use consume.
 *
 * Every well-formed email receives the same `200 { ok: true }` body after the
 * same timing floor whether it names a real account, an unknown account, an
 * exhausted token bucket, or an unavailable backend. That keeps this endpoint
 * from becoming an account-existence oracle.
 */
const RESET_IP_LIMIT = { limit: 5, windowMs: 60_000 };
const RESET_EMAIL_LIMIT = { limit: 3, windowMs: 900_000 };
const RESET_CAPTCHA_THRESHOLD = { limit: 2, windowMs: 60_000 };

const ok = () => NextResponse.json({ ok: true });

async function challengeAfterBurst(
  request: Request,
  email: string,
  captchaToken: string | undefined,
): Promise<NextResponse | null> {
  const ip = clientIp(request);
  // A low, separate counter decides when a human challenge is required. The
  // hard buckets below still set the absolute delivery ceiling. Both keys are
  // calculated for any submitted email, never only for a real account.
  const challenge = await enforceRateLimit(
    'auth:reset-captcha:ip',
    identifierFor({ ip }),
    RESET_CAPTCHA_THRESHOLD,
  );
  if (!challenge) return null;

  const passed = await verifyCaptcha(captchaToken, ip);
  if (passed) return null;
  return NextResponse.json(
    { error: AUTH_CAPTCHA_REQUIRED, captchaRequired: true },
    { status: 400 },
  );
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const ip = clientIp(request);

  // Per-IP first: cheapest ceiling and independent of request-body parsing.
  const ipBlocked = await enforceRateLimit(
    'auth:reset-ip',
    identifierFor({ ip }),
    RESET_IP_LIMIT,
  );
  if (ipBlocked) {
    await settleAuthTiming(startedAt);
    return ipBlocked;
  }

  let email: string;
  let captchaToken: string | undefined;
  try {
    const parsed = recoveryRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      await settleAuthTiming(startedAt);
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
    }
    email = parsed.data.email;
    captchaToken = parsed.data.captchaToken;
  } catch {
    await settleAuthTiming(startedAt);
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const emailBlocked = await enforceRateLimit(
    'auth:reset-email',
    `e:${lockoutKey(email)}`,
    RESET_EMAIL_LIMIT,
  );
  if (emailBlocked) {
    await settleAuthTiming(startedAt);
    return emailBlocked;
  }

  const captchaBlocked = await challengeAfterBurst(request, email, captchaToken);
  if (captchaBlocked) {
    await settleAuthTiming(startedAt);
    return captchaBlocked;
  }

  // Record request attempts without raw email, code, password, token, or prompt
  // data. This write is deliberately off the response path.
  after(() =>
    recordAuthEvent({
      event: 'password_reset_requested',
      email,
      ip,
      userAgent: request.headers.get('user-agent'),
      detail: { recovery: 'code', ttlMinutes: PASSWORD_RESET_CODE_TTL_MINUTES },
    }),
  );

  // The issuer returns a code only for a real account. The caller observes the
  // same response either way; delivery is scheduled off the response path.
  const issued = await issuePasswordResetCode(email);
  if (issued.result === 'issued' && issued.code) {
    after(() => sendPasswordResetCodeEmail(email, issued.code!));
  }

  await settleAuthTiming(startedAt);
  return ok();
}
