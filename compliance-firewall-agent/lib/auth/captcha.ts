/**
 * Cloudflare Turnstile verification for the credential routes.
 *
 * Turnstile over hCaptcha/reCAPTCHA: free at any volume, no per-seat cost, and
 * it does not ship visitor data to an ad network — which matters for a product
 * sold to healthcare and defense buyers who read the subprocessor list.
 *
 * ESCALATING, not always-on. A challenge is demanded only after
 * CAPTCHA_AFTER_FAILURES consecutive failures on a bucket, so a customer
 * signing in correctly never sees one and the conversion funnel is untouched.
 *
 * VERIFIED SERVER-SIDE, always. A client-side widget alone proves nothing — a
 * scripted attacker simply does not run it. The token must be exchanged with
 * Cloudflare from the route, which is only possible because the route exists.
 *
 * UNCONFIGURED = BLOCKED once a challenge is required. A missing production
 * secret must not silently turn an abuse-control policy into a bypass. Normal
 * traffic remains unaffected until the escalation threshold, while a release
 * readiness check and health signal make missing configuration immediately
 * visible before a customer ever reaches the challenged branch.
 */

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** Consecutive failures on a bucket before a challenge is required. */
export const CAPTCHA_AFTER_FAILURES = 3;

/** True when the release configuration can verify a Turnstile challenge. */
export function isCaptchaConfigured(): boolean {
  return (process.env.TURNSTILE_SECRET_KEY ?? '').trim().length > 0;
}

/** Pure: does this attempt need a challenge? */
export function captchaRequired(recentFailures: number): boolean {
  return recentFailures >= CAPTCHA_AFTER_FAILURES;
}

/**
 * Exchange a widget token with Cloudflare.
 *
 * Returns false for an absent token, a rejected token, or a network failure —
 * fail CLOSED here, unlike the rate limiter. This runs only after several
 * failures on the same bucket, so the caller is already behaving like an
 * attacker; refusing on a Cloudflare blip costs one retry for a legitimate
 * user and denies a free bypass to everyone else.
 */
export async function verifyCaptcha(token: string | undefined, ip?: string): Promise<boolean> {
  const secret = (process.env.TURNSTILE_SECRET_KEY ?? '').trim();
  if (!secret) return false; // Never silently bypass an escalated challenge.
  if (!token) return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip && ip !== 'unknown') body.set('remoteip', ip);

    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (error: unknown) {
    console.warn(
      '[captcha] verification failed:',
      error instanceof Error ? error.message : String(error),
    );
    return false;
  }
}
