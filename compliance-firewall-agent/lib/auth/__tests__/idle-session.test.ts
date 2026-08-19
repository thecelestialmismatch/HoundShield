/**
 * Idle session termination — the automatic logoff control.
 *
 * Mapped controls: NIST 800-171 Rev 2 §3.1.11 (AC.L2-3.1.11, "Terminate a user
 * session after a defined condition") and HIPAA §164.312(a)(2)(iii) (automatic
 * logoff). Both Rachel (Privacy Officer) and Jordan (Defense IT) get asked for
 * this by an assessor, so the behaviour is evidence, not a preference — which
 * is why the forgery and fail-closed cases below are tested as hard as the
 * happy path.
 *
 * Pure functions + Web Crypto, so none of this needs a mock.
 */
import { describe, it, expect } from 'vitest';
import {
  IDLE_TIMEOUT_MS,
  IDLE_WARNING_MS,
  IDLE_COOKIE,
  countsAsActivity,
  idleEnforcementMode,
  idleSecret,
  isIdleExpired,
  isIdleProtectedPath,
  isSessionCookie,
  msUntilIdleLogout,
  signActivity,
  verifyActivity,
} from '../idle-session';

const SECRET = 'test-secret-at-least-sixteen-chars-long';
const NOW = 1_760_000_000_000;

describe('idle timeout window', () => {
  it('terminates after 30 minutes of inactivity', () => {
    expect(IDLE_TIMEOUT_MS).toBe(30 * 60 * 1000);
    expect(isIdleExpired(NOW - (IDLE_TIMEOUT_MS - 1), NOW)).toBe(false);
    expect(isIdleExpired(NOW - (IDLE_TIMEOUT_MS + 1), NOW)).toBe(true);
  });

  it('warns before it terminates, not after', () => {
    expect(IDLE_WARNING_MS).toBeGreaterThan(0);
    expect(IDLE_WARNING_MS).toBeLessThan(IDLE_TIMEOUT_MS);
  });

  it('FAILS CLOSED on an unknown last-activity', () => {
    // No stamp means we cannot prove recent activity. The safe reading is
    // "expired", never "must be fine".
    expect(isIdleExpired(null, NOW)).toBe(true);
    expect(isIdleExpired(Number.NaN, NOW)).toBe(true);
    expect(isIdleExpired(Number.POSITIVE_INFINITY, NOW)).toBe(true);
  });

  it('tolerates small clock skew but rejects a far-future stamp', () => {
    // Real clocks drift; a stamp a few seconds ahead is not an attack.
    expect(isIdleExpired(NOW + 5_000, NOW)).toBe(false);
    // Hours ahead is either a broken clock or a forgery attempt. Either way it
    // must not buy an unbounded session.
    expect(isIdleExpired(NOW + IDLE_TIMEOUT_MS * 10, NOW)).toBe(true);
  });

  it('counts down to zero and never below', () => {
    expect(msUntilIdleLogout(NOW, NOW)).toBe(IDLE_TIMEOUT_MS);
    expect(msUntilIdleLogout(NOW - IDLE_TIMEOUT_MS / 2, NOW)).toBe(IDLE_TIMEOUT_MS / 2);
    expect(msUntilIdleLogout(NOW - IDLE_TIMEOUT_MS * 5, NOW)).toBe(0);
    expect(msUntilIdleLogout(null, NOW)).toBe(0);
  });
});

describe('signed activity stamp', () => {
  it('round-trips a timestamp', async () => {
    const value = await signActivity(NOW, SECRET);
    expect(await verifyActivity(value, SECRET)).toBe(NOW);
  });

  it('REJECTS a forged timestamp — the whole point of signing', async () => {
    const real = await signActivity(NOW - IDLE_TIMEOUT_MS * 2, SECRET);
    const signature = real.slice(real.lastIndexOf('.') + 1);

    // The attack: keep the valid signature, swap in a fresh timestamp to look
    // like you were just active. Unsigned, this renews the session forever.
    const forged = `${NOW}.${signature}`;
    expect(await verifyActivity(forged, SECRET)).toBeNull();

    // And a rejected stamp expires rather than extending.
    expect(isIdleExpired(await verifyActivity(forged, SECRET), NOW)).toBe(true);
  });

  it('rejects a stamp signed with a different secret', async () => {
    const value = await signActivity(NOW, SECRET);
    expect(await verifyActivity(value, 'a-completely-different-secret!!')).toBeNull();
  });

  it('rejects malformed values without throwing', async () => {
    for (const bad of ['', 'nodot', '.', 'abc.def', `${NOW}.`, `.${NOW}`, 'NaN.aaaa']) {
      expect(await verifyActivity(bad, SECRET)).toBeNull();
    }
    expect(await verifyActivity(undefined, SECRET)).toBeNull();
    expect(await verifyActivity(null, SECRET)).toBeNull();
  });

  it('produces a value with no raw secret in it', async () => {
    const value = await signActivity(NOW, SECRET);
    expect(value).not.toContain(SECRET);
  });
});

describe('which paths are idle-protected', () => {
  it('covers every signed-in surface', () => {
    for (const p of [
      '/command-center',
      '/command-center/settings',
      '/partner',
      '/partner/clients/abc',
      '/console',
      '/console/security',
      '/admin',
    ]) {
      expect(isIdleProtectedPath(p), p).toBe(true);
    }
  });

  it('NEVER touches the public /partners marketing pages', () => {
    // `/partner` and `/partners` differ by one character. A bare startsWith
    // would sign prospects out of the page that sells the partner program.
    for (const p of ['/partners', '/partners/kit', '/partners/apply']) {
      expect(isIdleProtectedPath(p), p).toBe(false);
    }
  });

  it('leaves the rest of the marketing site alone', () => {
    for (const p of ['/', '/pricing', '/login', '/signup', '/report/thank-you', '/security']) {
      expect(isIdleProtectedPath(p), p).toBe(false);
    }
  });
});

describe('what counts as user activity', () => {
  it('counts real navigation', () => {
    expect(countsAsActivity('/command-center', 'GET')).toBe(true);
    expect(countsAsActivity('/command-center/settings', 'POST')).toBe(true);
  });

  it('does NOT let our own polling keep a session alive', () => {
    // Without this the control defeats itself: a dashboard poll every 60s
    // would refresh the stamp forever while the human is at lunch.
    expect(countsAsActivity('/api/auth/session-status', 'GET')).toBe(false);
    expect(countsAsActivity('/api/health', 'GET')).toBe(false);
    expect(countsAsActivity('/api/metrics/live', 'GET')).toBe(false);
    expect(countsAsActivity('/api/cron/email-drip', 'GET')).toBe(false);
  });

  it('does not count a link prefetch as an interaction', () => {
    expect(countsAsActivity('/command-center', 'HEAD')).toBe(false);
  });
});

describe('session cookies cleared on termination', () => {
  it('matches Supabase chunked cookies by prefix', () => {
    // sb-<ref>-auth-token.0 / .1 — a name list would leave a resumable session.
    expect(isSessionCookie('sb-qifynzuyrdxmxlumpsrq-auth-token')).toBe(true);
    expect(isSessionCookie('sb-qifynzuyrdxmxlumpsrq-auth-token.0')).toBe(true);
    expect(isSessionCookie('sb-qifynzuyrdxmxlumpsrq-auth-token.1')).toBe(true);
  });

  it('matches Better Auth cookies, secure variant included', () => {
    expect(isSessionCookie('better-auth.session_token')).toBe(true);
    expect(isSessionCookie('__Secure-better-auth.session_token')).toBe(true);
  });

  it('leaves unrelated cookies alone', () => {
    for (const c of ['ph_posthog', 'cookie_consent', 'theme', IDLE_COOKIE]) {
      expect(isSessionCookie(c), c).toBe(false);
    }
  });
});

describe('enforcement mode is reported, never faked', () => {
  it('enforces when any server secret is available', () => {
    expect(idleEnforcementMode({ BETTER_AUTH_SECRET: SECRET })).toBe('enforced');
    expect(idleEnforcementMode({ SUPABASE_SERVICE_ROLE_KEY: SECRET })).toBe('enforced');
    expect(idleEnforcementMode({ STRIPE_WEBHOOK_SECRET: SECRET })).toBe('enforced');
  });

  it('reports unavailable rather than pretending, when there is no secret', () => {
    // The TURNSTILE_SECRET_KEY lesson: a security layer that looks configured
    // and silently passes everything is worse than one that says it is off.
    expect(idleEnforcementMode({})).toBe('unavailable');
    expect(idleEnforcementMode({ BETTER_AUTH_SECRET: '   ' })).toBe('unavailable');
  });

  it('ignores a secret too short to be real', () => {
    expect(idleSecret({ BETTER_AUTH_SECRET: 'short' })).toBeNull();
  });
});
