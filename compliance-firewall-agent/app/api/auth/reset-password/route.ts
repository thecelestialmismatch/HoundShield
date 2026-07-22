import { NextResponse, after } from 'next/server';
import { createServiceClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { sendPasswordResetEmail } from '@/lib/auth/auth-emails';
import { recoveryRequestSchema, buildRecoveryConfirmUrl } from '@/lib/auth/recovery-link';

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
 */
const ok = () => NextResponse.json({ ok: true });

export async function POST(request: Request) {
  let email: string;
  try {
    const parsed = recoveryRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
    }
    email = parsed.data.email;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  // No Supabase configured (dev/demo) → stay enumeration-safe, send nothing.
  if (!isSupabaseConfigured()) {
    // Server-side only (never in the response) — every failure here is silent by
    // design, so log the outcome so a "nothing happening" report is diagnosable.
    console.warn('[reset-password] Supabase not configured — no recovery email sent');
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

  return ok();
}
