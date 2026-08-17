import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockIssue,
  mockSend,
  mockEnforce,
  mockVerifyCaptcha,
} = vi.hoisted(() => ({
  mockIssue: vi.fn(),
  mockSend: vi.fn().mockResolvedValue(undefined),
  mockEnforce: vi.fn().mockResolvedValue(null),
  mockVerifyCaptcha: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/rate-limit-shared', () => ({
  enforceRateLimit: (ns: string, id: string, opts: unknown) => mockEnforce(ns, id, opts),
  identifierFor: ({ ip }: { ip?: string | null }) => `i:${ip ?? 'anon'}`,
  clientIp: (req: { headers: { get(n: string): string | null } }) =>
    req.headers.get('x-forwarded-for') ?? '127.0.0.1',
}));

vi.mock('@/lib/auth/password-reset-codes', () => ({
  PASSWORD_RESET_CODE_TTL_MINUTES: 60,
  issuePasswordResetCode: (email: string) => mockIssue(email),
}));

vi.mock('@/lib/auth/auth-emails', () => ({
  sendPasswordResetCodeEmail: (to: string, code: string) => mockSend(to, code),
}));

vi.mock('@/lib/auth/captcha', () => ({
  verifyCaptcha: (...args: unknown[]) => mockVerifyCaptcha(...args),
}));

vi.mock('next/server', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('next/server');
  return { ...actual, after: (cb: () => unknown) => { void cb(); } };
});

vi.mock('@/lib/auth/audit-log', () => ({ recordAuthEvent: async () => {} }));

import { POST } from '@/app/api/auth/reset-password/route';

function req(body: unknown, ip = '203.0.113.9'): Request {
  return new Request('http://localhost/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  mockIssue.mockReset();
  mockIssue.mockResolvedValue({ result: 'issued', code: 'A'.repeat(32) });
  mockSend.mockClear();
  mockEnforce.mockReset();
  mockEnforce.mockResolvedValue(null);
  mockVerifyCaptcha.mockReset();
  mockVerifyCaptcha.mockResolvedValue(true);
});

describe('POST /api/auth/reset-password — code-only recovery', () => {
  it('sends a one-time code, never a recovery URL, for a resolvable account', async () => {
    const res = await POST(req({ email: 'user@acme.com' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(mockIssue).toHaveBeenCalledWith('user@acme.com');
    expect(mockSend).toHaveBeenCalledWith('user@acme.com', 'A'.repeat(32));
    for (const value of mockSend.mock.calls.flat()) {
      expect(String(value)).not.toContain('?');
      expect(String(value)).not.toContain('token_hash');
      expect(String(value)).not.toContain('/auth/confirm');
    }
  });

  it('keeps an unknown address indistinguishable and sends no email', async () => {
    mockIssue.mockResolvedValue({ result: 'unknown-or-unavailable', code: null });
    const res = await POST(req({ email: 'ghost@acme.com' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('keeps an unavailable issuer indistinguishable and sends no email', async () => {
    mockIssue.mockResolvedValue({ result: 'unknown-or-unavailable', code: null });
    const res = await POST(req({ email: 'user@acme.com' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('normalizes email before issuance and delivery', async () => {
    await POST(req({ email: '  User@Acme.COM ' }));
    expect(mockIssue).toHaveBeenCalledWith('user@acme.com');
    expect(mockSend).toHaveBeenCalledWith('user@acme.com', 'A'.repeat(32));
  });

  it('rejects malformed body without issuing a code', async () => {
    const res = await POST(req({ email: 'not-an-email' }));
    expect(res.status).toBe(400);
    expect(mockIssue).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON without issuing a code', async () => {
    const res = await POST(req('{not json'));
    expect(res.status).toBe(400);
    expect(mockIssue).not.toHaveBeenCalled();
  });
});

describe('POST /api/auth/reset-password — abuse controls', () => {
  it('applies per-IP, hashed-email, and CAPTCHA-escalation counters', async () => {
    await POST(req({ email: 'user@acme.com' }));
    const namespaces = mockEnforce.mock.calls.map((call) => call[0]);
    expect(namespaces).toContain('auth:reset-ip');
    expect(namespaces).toContain('auth:reset-email');
    expect(namespaces).toContain('auth:reset-captcha:ip');
    const emailCall = mockEnforce.mock.calls.find((call) => call[0] === 'auth:reset-email');
    expect(emailCall?.[1]).toMatch(/^e:[0-9a-f]{32}$/);
    expect(emailCall?.[1]).not.toContain('acme');
  });

  it('does not issue or send when the IP bucket is exhausted', async () => {
    mockEnforce.mockResolvedValueOnce(new Response(null, { status: 429 }));
    const res = await POST(req({ email: 'user@acme.com' }));
    expect(res.status).toBe(429);
    expect(mockIssue).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('requires CAPTCHA after a burst without using account existence as input', async () => {
    mockEnforce.mockImplementation((namespace: string) =>
      namespace === 'auth:reset-captcha:ip' ? Promise.resolve(new Response(null, { status: 429 })) : Promise.resolve(null),
    );
    mockVerifyCaptcha.mockResolvedValue(false);
    const res = await POST(req({ email: 'ghost@acme.com' }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ captchaRequired: true });
    expect(mockIssue).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
  });
});
