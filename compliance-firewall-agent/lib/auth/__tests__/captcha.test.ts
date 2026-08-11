/**
 * Cloudflare Turnstile verification.
 *
 * Three properties, each of which has a wrong answer that ships silently:
 *   - unconfigured is OPEN, so a missing key never locks customers out and CI
 *     passes before the founder adds the secret;
 *   - configured-and-failing is CLOSED, so a Cloudflare blip is not a bypass;
 *   - the challenge ESCALATES, so a customer who signs in correctly never sees
 *     one.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// lockout.ts is imported below only for LOCKOUT_THRESHOLD (a cross-module
// invariant worth asserting). Stub its Supabase dependency so importing it
// never opens a client.
vi.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: () => false,
  createServiceClient: () => {
    throw new Error('not used in this suite');
  },
}));

import {
  CAPTCHA_AFTER_FAILURES,
  isCaptchaConfigured,
  captchaRequired,
  verifyCaptcha,
} from '@/lib/auth/captcha';
import { LOCKOUT_THRESHOLD } from '@/lib/auth/lockout';

const SECRET = 'TURNSTILE_SECRET_KEY';
const originalSecret = process.env[SECRET];

function configure(value?: string) {
  if (value === undefined) delete process.env[SECRET];
  else process.env[SECRET] = value;
}

beforeEach(() => {
  configure(undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  configure(originalSecret);
  vi.restoreAllMocks();
});

describe('the escalation point is sane', () => {
  it('demands a challenge before the account locks, not after', () => {
    // After the lock trips there is nothing left to protect — the address has
    // already stopped answering. A challenge is only useful before that.
    expect(CAPTCHA_AFTER_FAILURES).toBeLessThan(LOCKOUT_THRESHOLD);
  });

  it('lets an ordinary typo through un-challenged', () => {
    expect(CAPTCHA_AFTER_FAILURES).toBeGreaterThanOrEqual(2);
  });
});

describe('isCaptchaConfigured', () => {
  it('is false with no secret set', () => {
    expect(isCaptchaConfigured()).toBe(false);
  });

  it('is false for a whitespace-only secret (a blanked Vercel variable)', () => {
    configure('   ');
    expect(isCaptchaConfigured()).toBe(false);
  });

  it('is true once a real secret is present', () => {
    configure('0xAAAA');
    expect(isCaptchaConfigured()).toBe(true);
  });
});

describe('captchaRequired', () => {
  it('never demands a challenge while unconfigured — no dead-end for customers', () => {
    for (const n of [0, 1, 3, 50]) expect(captchaRequired(n)).toBe(false);
  });

  it('demands one at and above the threshold once configured', () => {
    configure('0xAAAA');
    expect(captchaRequired(CAPTCHA_AFTER_FAILURES)).toBe(true);
    expect(captchaRequired(CAPTCHA_AFTER_FAILURES + 10)).toBe(true);
  });

  it('does not demand one below the threshold', () => {
    configure('0xAAAA');
    expect(captchaRequired(CAPTCHA_AFTER_FAILURES - 1)).toBe(false);
    expect(captchaRequired(0)).toBe(false);
  });
});

describe('verifyCaptcha', () => {
  it('is a safe no-op when unconfigured — the code ships before the key does', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    expect(await verifyCaptcha(undefined)).toBe(true);
    expect(await verifyCaptcha('anything')).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects a missing token once configured', async () => {
    configure('0xAAAA');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    expect(await verifyCaptcha(undefined)).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('accepts a token Cloudflare confirms', async () => {
    configure('0xAAAA');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    expect(await verifyCaptcha('tok')).toBe(true);
  });

  it('rejects a token Cloudflare denies', async () => {
    configure('0xAAAA');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: false, 'error-codes': ['invalid-input-response'] }), {
        status: 200,
      }),
    );
    expect(await verifyCaptcha('tok')).toBe(false);
  });

  it('rejects a malformed success field rather than coercing it', async () => {
    configure('0xAAAA');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: 'true' }), { status: 200 }),
    );
    expect(await verifyCaptcha('tok')).toBe(false);
  });

  it('fails CLOSED on a non-200 from Cloudflare', async () => {
    configure('0xAAAA');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 502 }));
    expect(await verifyCaptcha('tok')).toBe(false);
  });

  it('fails CLOSED on a network error — a blip is not a free bypass', async () => {
    configure('0xAAAA');
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNRESET'));
    expect(await verifyCaptcha('tok')).toBe(false);
  });

  it('fails CLOSED on unparseable JSON', async () => {
    configure('0xAAAA');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('<html>502</html>', { status: 200 }));
    expect(await verifyCaptcha('tok')).toBe(false);
  });

  it('posts the secret and token form-encoded to Cloudflare', async () => {
    configure('0xSECRET');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    await verifyCaptcha('tok-123', '203.0.113.9');

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('challenges.cloudflare.com');
    expect(init.method).toBe('POST');
    const body = new URLSearchParams(init.body as string);
    expect(body.get('secret')).toBe('0xSECRET');
    expect(body.get('response')).toBe('tok-123');
    expect(body.get('remoteip')).toBe('203.0.113.9');
  });

  it('omits remoteip when the IP is unknown, rather than sending the literal string', async () => {
    configure('0xSECRET');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    await verifyCaptcha('tok', 'unknown');
    const body = new URLSearchParams((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(body.has('remoteip')).toBe(false);
  });

  it('never sends the secret anywhere but Cloudflare', async () => {
    configure('0xSECRET');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    await verifyCaptcha('tok');
    expect(String(fetchSpy.mock.calls[0][0])).toMatch(
      /^https:\/\/challenges\.cloudflare\.com\//,
    );
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
