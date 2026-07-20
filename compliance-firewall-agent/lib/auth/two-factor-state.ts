/**
 * Email-2FA pure decision logic, shared by the /login code step and the
 * /console/security enable flow. Keeping every branch here (unit-tested)
 * instead of inline in the components means the login interstitial and the
 * settings wizard can never silently disagree about what a valid code is or
 * when a resend is allowed.
 *
 * Flow recap (Better Auth `twoFactor` plugin, email OTP only):
 *   sign-in  — signIn.email() returns { twoFactorRedirect: true } instead of a
 *              session when the account has 2FA on → send a code → verifyOtp.
 *   enable   — twoFactor.enable({ password }) → send a code → verifyOtp. The
 *              account flag flips ONLY after the code round-trips, so a typo'd
 *              email can never lock the user out (skipVerificationOnEnable=false).
 */

/** Server default: 6-digit numeric codes. */
export const OTP_LENGTH = 6;

/** Minimum wait between "resend code" requests. */
export const RESEND_COOLDOWN_SECONDS = 30;

/**
 * Does a Better Auth signIn.email response mean "password OK, now ask for the
 * second factor"? The success payload is a union (session | redirect flag), so
 * probe structurally rather than trusting a cast.
 */
export function needsSecondFactor(data: unknown): boolean {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as { twoFactorRedirect?: unknown }).twoFactorRedirect === true
  );
}

/** Strip everything a paste can drag in (spaces, dashes) down to digits. */
export function normalizeOtpInput(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, OTP_LENGTH);
}

/** A code is submittable only when exactly OTP_LENGTH digits. */
export function isCompleteOtp(code: string): boolean {
  return new RegExp(`^\\d{${OTP_LENGTH}}$`).test(code);
}

/**
 * Seconds the user must still wait before another resend. 0 = allowed.
 * `lastSentAt`/`now` are epoch ms; null lastSentAt = never sent → allowed.
 */
export function resendWaitSeconds(lastSentAt: number | null, now: number): number {
  if (lastSentAt === null) return 0;
  const elapsed = (now - lastSentAt) / 1000;
  return Math.max(0, Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed));
}

/**
 * One user-facing message per failure class. Better Auth error codes are
 * SCREAMING_SNAKE; anything unrecognized gets the generic retry line so raw
 * server internals never reach the UI.
 */
export function otpErrorMessage(code: string | undefined, message?: string): string {
  switch (code) {
    case "INVALID_CODE":
      return "That code isn't right. Check the newest email and try again.";
    case "OTP_HAS_EXPIRED":
      return "That code expired. We can send you a fresh one.";
    case "TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE":
      return "Too many attempts — request a new code.";
    case "ACCOUNT_TEMPORARILY_LOCKED":
      return "Too many failed attempts. Your account is temporarily locked — try again in about 15 minutes.";
    case "INVALID_TWO_FACTOR_COOKIE":
      return "This sign-in attempt expired. Start again from the login page.";
    case "INVALID_PASSWORD":
      return "That password is incorrect.";
    default:
      return message || "Something went wrong. Please try again.";
  }
}
