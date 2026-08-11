/**
 * The shared pre-auth guard: rate limit -> lockout -> CAPTCHA.
 *
 * The ordering is load-bearing and is asserted directly. Per-IP runs first
 * because it is the cheapest check and needs no parsed body; the lockout runs
 * only after both buckets pass, so a flood cannot drive database reads.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockEnforce, mockCheckLockout, mockVerifyCaptcha, mockCaptchaRequired } = vi.hoisted(() => ({
  mockEnforce: vi.fn(),
  mockCheckLockout: vi.fn(),
  mockVerifyCaptcha: vi.fn(),
  mockCaptchaRequired: vi.fn(),
}));

vi.mock('@/lib/rate-limit-shared', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('@/lib/rate-limit-shared');
  return { ...actual, enforceRateLimit: mockEnforce };
});

vi.mock('@/lib/auth/lockout', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('@/lib/auth/lockout');
  return { ...actual, checkLockout: mockCheckLockout };
});

vi.mock('@/lib/auth/captcha', () => ({
  captchaRequired: (n: number) => mockCaptchaRequired(n),
  verifyCaptcha: (t: string | undefined, ip?: string) => mockVerifyCaptcha(t, ip),
  CAPTCHA_AFTER_FAILURES: 3,
  isCaptchaConfigured: () => true,
}));

vi.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: () => false,
  createServiceClient: () => {
    throw new Error('not used');
  },
}));

import { NextResponse } from 'next/server';
import {
  credentialSchema,
  emailOnlySchema,
  AUTH_LIMITS,
  guardCredentials,
  isServerAuthEnabled,
  serverAuthDisabled,
} from '@/lib/auth/credential-guard';
import { lockoutKey } from '@/lib/auth/lockout';

const UNLOCKED = { locked: false, minutesRemaining: 0, consecutiveFailures: 0, degraded: false };

function req(ip = '198.51.100.7'): Request {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'x-forwarded-for': ip },
  });
}

const base = {
  namespace: 'auth:login',
  ipLimit: AUTH_LIMITS.loginIp,
  emailLimit: AUTH_LIMITS.loginEmail,
};

beforeEach(() => {
  mockEnforce.mockReset().mockResolvedValue(null);
  mockCheckLockout.mockReset().mockResolvedValue(UNLOCKED);
  mockVerifyCaptcha.mockReset().mockResolvedValue(true);
  mockCaptchaRequired.mockReset().mockReturnValue(false);
});

afterEach(() => {
  delete process.env.AUTH_SERVER_ROUTES;
});

describe('credentialSchema — the trust boundary', () => {
  it('normalizes the email so one account cannot be attacked under many spellings', () => {
    const parsed = credentialSchema.parse({ email: '  User@ACME.com ', password: 'pw' });
    expect(parsed.email).toBe('user@acme.com');
  });

  it('rejects a malformed email', () => {
    expect(credentialSchema.safeParse({ email: 'nope', password: 'pw' }).success).toBe(false);
  });

  it('rejects an empty password rather than sending it to GoTrue', () => {
    expect(credentialSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });

  it('bounds every field, so a 10MB body cannot become a hashing job', () => {
    expect(
      credentialSchema.safeParse({ email: `${'a'.repeat(320)}@b.com`, password: 'pw' }).success,
    ).toBe(false);
    expect(
      credentialSchema.safeParse({ email: 'a@b.com', password: 'x'.repeat(201) }).success,
    ).toBe(false);
    expect(
      credentialSchema.safeParse({ email: 'a@b.com', password: 'pw', captchaToken: 'x'.repeat(4097) })
        .success,
    ).toBe(false);
  });

  it('treats the captcha token as optional', () => {
    expect(credentialSchema.safeParse({ email: 'a@b.com', password: 'pw' }).success).toBe(true);
  });

  it('emailOnlySchema applies the same normalization', () => {
    expect(emailOnlySchema.parse({ email: ' A@B.COM ' }).email).toBe('a@b.com');
  });
});

describe('AUTH_LIMITS', () => {
  it('bounds every credential surface', () => {
    for (const key of ['loginIp', 'loginEmail', 'signupIp', 'signupEmail', 'otpIp', 'otpEmail'] as const) {
      expect(AUTH_LIMITS[key].limit).toBeGreaterThan(0);
      expect(AUTH_LIMITS[key].windowMs).toBeGreaterThan(0);
    }
  });

  it('keeps the per-email ceiling tighter than the per-IP one', () => {
    // A shared office NAT legitimately bursts; one address does not.
    expect(AUTH_LIMITS.loginEmail.limit).toBeLessThan(AUTH_LIMITS.loginIp.limit);
  });

  it('matches the per-email login window to the 15-minute lockout', () => {
    expect(AUTH_LIMITS.loginEmail.windowMs).toBe(15 * 60_000);
  });
});

describe('guardCredentials', () => {
  it('checks per-IP first, then per-email', async () => {
    await guardCredentials({ ...base, request: req(), email: 'user@acme.com' });
    expect(mockEnforce).toHaveBeenCalledTimes(2);
    expect(mockEnforce.mock.calls[0][0]).toBe('auth:login:ip');
    expect(mockEnforce.mock.calls[1][0]).toBe('auth:login:email');
  });

  it('keys the email bucket on the hash — no address reaches the store', async () => {
    await guardCredentials({ ...base, request: req(), email: 'rachel@clinic.example' });
    const [, identifier] = mockEnforce.mock.calls[1];
    expect(identifier).toBe(`e:${lockoutKey('rachel@clinic.example')}`);
    expect(identifier).not.toContain('rachel');
  });

  it('hashes the IP too — the bucket table never holds an address', async () => {
    await guardCredentials({ ...base, request: req('203.0.113.4'), email: 'a@b.com' });
    expect(mockEnforce.mock.calls[0][1]).not.toContain('203.0.113.4');
  });

  it('short-circuits on the IP bucket without touching the email bucket', async () => {
    const blocked = NextResponse.json({ error: 'nope' }, { status: 429 });
    mockEnforce.mockResolvedValueOnce(blocked);
    const out = await guardCredentials({ ...base, request: req(), email: 'a@b.com' });
    expect(out.blocked).toBe(blocked);
    expect(mockEnforce).toHaveBeenCalledTimes(1);
    expect(mockCheckLockout).not.toHaveBeenCalled();
  });

  it('short-circuits on the email bucket without reading the lockout table', async () => {
    const blocked = NextResponse.json({ error: 'nope' }, { status: 429 });
    mockEnforce.mockResolvedValueOnce(null).mockResolvedValueOnce(blocked);
    const out = await guardCredentials({
      ...base,
      request: req(),
      email: 'a@b.com',
      useLockout: true,
    });
    expect(out.blocked).toBe(blocked);
    expect(mockCheckLockout).not.toHaveBeenCalled();
  });

  it('does not consult the lockout table when useLockout is false', async () => {
    const out = await guardCredentials({
      ...base,
      request: req(),
      email: 'a@b.com',
      useLockout: false,
    });
    expect(mockCheckLockout).not.toHaveBeenCalled();
    expect(out.blocked).toBeNull();
    expect(out.lock.consecutiveFailures).toBe(0);
  });

  it('refuses a locked account with 429 + Retry-After, before any password check', async () => {
    mockCheckLockout.mockResolvedValue({
      locked: true,
      minutesRemaining: 12,
      consecutiveFailures: 5,
      degraded: false,
    });
    const out = await guardCredentials({
      ...base,
      request: req(),
      email: 'a@b.com',
      useLockout: true,
    });
    expect(out.blocked?.status).toBe(429);
    expect(out.blocked?.headers.get('Retry-After')).toBe(String(12 * 60));
    const body = await out.blocked!.json();
    expect(body.error).toMatch(/12 minutes/);
    // The message must not confirm the address exists.
    expect(String(body.error).toLowerCase()).not.toContain('registered');
  });

  it('demands a challenge once the failure count reaches the threshold', async () => {
    mockCheckLockout.mockResolvedValue({ ...UNLOCKED, consecutiveFailures: 3 });
    mockCaptchaRequired.mockReturnValue(true);
    mockVerifyCaptcha.mockResolvedValue(false);
    const out = await guardCredentials({
      ...base,
      request: req(),
      email: 'a@b.com',
      useLockout: true,
    });
    expect(out.blocked?.status).toBe(400);
    const body = await out.blocked!.json();
    expect(body.captchaRequired).toBe(true);
  });

  it('proceeds when the challenge is passed', async () => {
    mockCheckLockout.mockResolvedValue({ ...UNLOCKED, consecutiveFailures: 4 });
    mockCaptchaRequired.mockReturnValue(true);
    mockVerifyCaptcha.mockResolvedValue(true);
    const out = await guardCredentials({
      ...base,
      request: req(),
      email: 'a@b.com',
      captchaToken: 'tok',
      useLockout: true,
    });
    expect(out.blocked).toBeNull();
    expect(mockVerifyCaptcha).toHaveBeenCalledWith('tok', '198.51.100.7');
  });

  it('never challenges a first attempt — the funnel is untouched for real customers', async () => {
    mockCaptchaRequired.mockImplementation((n: number) => n >= 3);
    const out = await guardCredentials({
      ...base,
      request: req(),
      email: 'a@b.com',
      useLockout: true,
    });
    expect(out.blocked).toBeNull();
    expect(mockVerifyCaptcha).not.toHaveBeenCalled();
  });

  it('passes the lock state back so the route can act on the failure count', async () => {
    mockCheckLockout.mockResolvedValue({ ...UNLOCKED, consecutiveFailures: 2 });
    const out = await guardCredentials({
      ...base,
      request: req(),
      email: 'a@b.com',
      useLockout: true,
    });
    expect(out.lock.consecutiveFailures).toBe(2);
  });
});

describe('isServerAuthEnabled — the no-rebuild rollback', () => {
  it('is on by default, so the protections ship enabled', () => {
    delete process.env.AUTH_SERVER_ROUTES;
    expect(isServerAuthEnabled()).toBe(true);
  });

  it('is off only for the exact opt-out value', () => {
    process.env.AUTH_SERVER_ROUTES = 'off';
    expect(isServerAuthEnabled()).toBe(false);
    process.env.AUTH_SERVER_ROUTES = ' OFF ';
    expect(isServerAuthEnabled()).toBe(false);
  });

  it('is not disabled by an unrelated value — no accidental silent rollback', () => {
    for (const v of ['on', 'true', '1', 'disabled', 'false', '']) {
      process.env.AUTH_SERVER_ROUTES = v;
      expect(isServerAuthEnabled()).toBe(true);
    }
  });

  it('reads a server-only variable, never a build-inlined NEXT_PUBLIC_ one', () => {
    const source = String(isServerAuthEnabled);
    expect(source).toContain('AUTH_SERVER_ROUTES');
    expect(source).not.toContain('NEXT_PUBLIC');
  });
});

describe('serverAuthDisabled', () => {
  it('answers 501, the status the browser fallback keys on', async () => {
    const res = serverAuthDisabled();
    expect(res.status).toBe(501);
    expect((await res.json()).error).toMatch(/AUTH_SERVER_ROUTES/);
  });
});
