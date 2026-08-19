import { createHmac, randomBytes } from 'crypto';
import { createServiceClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { lockoutKey } from '@/lib/auth/lockout';

/**
 * Application-owned password-reset codes.
 *
 * A code is deliberately sent in the email body, not embedded in a URL. The
 * raw value never enters a redirect, page URL, browser history, request log, or
 * database row. The database receives only an HMAC digest and atomically marks
 * it used before the privileged password update proceeds.
 */
export const PASSWORD_RESET_CODE_TTL_MINUTES = 60;

function resetCodePepper(): string | null {
  // A deployment must set the dedicated secret. The service role key fallback
  // keeps an emergency migration from silently creating predictable hashes, but
  // `AUTH_RESET_CODE_PEPPER` remains the required release configuration.
  return (
    process.env.AUTH_RESET_CODE_PEPPER?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    null
  );
}

/** 128 bits of cryptographically secure entropy, readable enough to paste. */
export function generatePasswordResetCode(): string {
  return randomBytes(16).toString('hex').toUpperCase();
}

/** Domain-separated keyed digest; the raw code and email are never persisted. */
export function hashPasswordResetCode(email: string, code: string): string {
  const pepper = resetCodePepper();
  if (!pepper) throw new Error('AUTH_RESET_CODE_PEPPER is not configured');
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = code.trim().toUpperCase();
  return createHmac('sha256', pepper)
    .update(`houndshield:password-reset:v1:${normalizedEmail}:${normalizedCode}`)
    .digest('hex');
}

export type ResetCodeIssueResult = 'issued' | 'unknown-or-unavailable';

/**
 * Issue a code only when the profile exists. Callers must always return a
 * neutral response regardless of this outcome; the result controls email only.
 */
export async function issuePasswordResetCode(email: string): Promise<{
  result: ResetCodeIssueResult;
  code: string | null;
}> {
  if (!isSupabaseConfigured() || !resetCodePepper()) {
    return { result: 'unknown-or-unavailable', code: null };
  }

  const code = generatePasswordResetCode();
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc('issue_password_reset_code', {
      p_email: email,
      p_email_hash: lockoutKey(email),
      p_code_hash: hashPasswordResetCode(email, code),
      p_ttl_minutes: PASSWORD_RESET_CODE_TTL_MINUTES,
    });
    if (error || data !== true) return { result: 'unknown-or-unavailable', code: null };
    return { result: 'issued', code };
  } catch {
    return { result: 'unknown-or-unavailable', code: null };
  }
}

export type ResetCodeConsumeResult =
  | { ok: true; userId: string }
  | { ok: false; reason: 'invalid-or-expired' | 'unavailable' };

/** Redeem exactly one still-valid code. The database operation is atomic. */
export async function consumePasswordResetCode(
  email: string,
  code: string,
): Promise<ResetCodeConsumeResult> {
  if (!isSupabaseConfigured() || !resetCodePepper()) {
    return { ok: false, reason: 'unavailable' };
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc('consume_password_reset_code', {
      p_email_hash: lockoutKey(email),
      p_code_hash: hashPasswordResetCode(email, code),
    });
    const row = Array.isArray(data) ? data[0] : null;
    if (error || !row || typeof row.user_id !== 'string') {
      return { ok: false, reason: 'invalid-or-expired' };
    }
    return { ok: true, userId: row.user_id };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}
