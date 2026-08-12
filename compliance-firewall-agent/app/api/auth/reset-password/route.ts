import { NextResponse, after } from 'next/server';
import { createServiceClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { sendPasswordResetEmail } from '@/lib/auth/auth-emails';
import { recoveryRequestSchema, buildRecoveryConfirmUrl } from '@/lib/auth/recovery-link';
import { enforceRateLimit, identifierFor, clientIp } from '@/lib/rate-limit-shared';
import { lockoutKey } from '@/lib/auth/lockout';
import { settleAuthTiming } from '@/lib/auth/timing';

/**
 * POST /api/auth/reset-password — self-hosted password-reset send.
 *
 * Mints the recovery link server-side (`admin.generateLink`) and sends a branded
 * Resend email pointing at `/auth/confirm`. This removes every Supabase-dashboard
 * dependency from the reset flow: no Redirect-URL allow-list (the link is
 * same-origin), no custom email template, no custom SMTP (Resend is the sender).
 *
 * ENUMERATION-SAFE: always answers 200 for a well-formed email, whether or not an
 * account exists — the client shows "check your email" either way. Only a
 * malformed body returns 4xx (that leaks nothing about account existence). The
 * Resend send runs in `after()` (off the response path) so an existing account
 * does NOT return slower than a non-existent one — response latency can't be
 * used as an account-existence oracle.
 *
 * …AND THAT WAS NOT SUFFICIENT ON ITS OWN. Moving the *email send* off the
 * response path leaves `admin.generateLink` ON it, and that call is exactly the
 * one whose cost depends on the answer: it mints and stores a recovery token
 * for an address that resolves, and returns an error for one that does not. The
 * gap is the same shape as the bcrypt gap that ../login guards against, so it
 * gets the same treatment — every path below settles against the shared floor
 * in lib/auth/timing.ts before returning. `after()` bounds the slow half; the
 * floor bounds the fast half. Neither closes the oracle alone.
 *
 * RATE LIMITED HERE, IN THE ROUTE. A 5-per-minute bucket for this path already
 * existed in middleware.ts — and was dead: the repo-root vercel.json uses the
 * legacy `builds`/`routes` keys, which replace the routing table the middleware
 * lives in, so none of it executes on this deployment (verified 2026-08-11:
 * /auth/signup 404s, no X-RateLimit-* on any response). Until that config is
 * fixed separately, an "unauthenticated endpoint that emails a stranger" was
 * completely unbounded — an email-bomb vector aimed at a customer's inbox and a
 * way to burn Supabase and Resend quota. A limiter in a file that never runs is
 * worse than no limiter, because it reads as covered.
 */
const RESET_IP_LIMIT = { limit: 5, windowMs: 60_000 };
const RESET_EMAIL_LIMIT = { limit: 3, windowMs: 900_000 };

const ok = () => NextResponse.json({ ok: true });

export async function POST(request: Request) {
  const startedAt = Date.now();

  // Per-IP first — cheapest check, and it needs no parsed body.
  const ipBlocked = await enforceRateLimit(
    'auth:reset-ip',
    identifierFor({ ip: clientIp(request) }),
    RESET_IP_LIMIT,
  );
  if (ipBlocked) {
    await settleAuthTiming(startedAt);
    return ipBlocked;
  }

  let email: string;
  try {
    const parsed = recoveryRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      await settleAuthTiming(startedAt);
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
    }
    email = parsed.data.email;
  } catch {
    await settleAuthTiming(startedAt);
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  // Per-address, so a botnet cannot spread an inbox flood across many IPs.
  // Keyed on the hash — this bucket must never hold an address. Applied to any
  // well-formed email whether or not it has an account, or the 429 itself
  // would become the enumeration oracle the rest of this route avoids.
  const emailBlocked = await enforceRateLimit(
    'auth:reset-email',
    `e:${lockoutKey(email)}`,
    RESET_EMAIL_LIMIT,
  );
  if (emailBlocked) {
    await settleAuthTiming(startedAt);
    return emailBlocked;
  }

  // No Supabase configured (dev/demo) → stay enumeration-safe, send nothing.
  if (!isSupabaseConfigured()) {
    // Server-side only (never in the response) — every failure here is silent by
    // design, so log the outcome so a "nothing happening" report is diagnosable.
    console.warn('[reset-password] Supabase not configured — no recovery email sent');
    await settleAuthTiming(startedAt);
    return ok();
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.auth.admin.generateLink({ type: 'recovery', email });
    // A non-existent email errors here — swallow it so response timing/shape
    // never reveals whether the account exists.
    if (!error && data?.properties?.hashed_token) {
      const base = process.env.NEXT_PUBLIC_APP_URL?.trim() || new URL(request.url).origin;
      const confirmUrl = buildRecoveryConfirmUrl(base, data.properties.hashed_token);
      // Send after the response so both branches return in ~generateLink time.
      after(() => sendPasswordResetEmail(email, confirmUrl));
      console.info('[reset-password] recovery link dispatched');
    } else {
      // Unknown account or unexpected shape — no send (outcome logged, no PII).
      console.info('[reset-password] no recovery link minted (unknown account or error)');
    }
  } catch (err: unknown) {
    // Never surface internals; log server-side only.
    console.error('[reset-password] link generation failed:', err instanceof Error ? err.message : err);
  }

  // Single exit for every outcome above — known account, unknown account, and
  // thrown error all leave through the same floor.
  await settleAuthTiming(startedAt);
  return ok();
}
