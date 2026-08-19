import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockGuard,
  mockConsume,
  mockUpdateUserById,
  mockRegisterFailure,
  mockClearFailures,
} = vi.hoisted(() => ({
  mockGuard: vi.fn(),
  mockConsume: vi.fn(),
  mockUpdateUserById: vi.fn(),
  mockRegisterFailure: vi.fn(),
  mockClearFailures: vi.fn(),
}));

vi.mock('@/lib/auth/credential-guard', () => ({
  AUTH_LIMITS: { resetCompleteIp: {}, resetCompleteEmail: {} },
  guardCredentials: (...args: unknown[]) => mockGuard(...args),
}));
vi.mock('@/lib/auth/password-reset-codes', () => ({
  consumePasswordResetCode: (...args: unknown[]) => mockConsume(...args),
}));
vi.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: () => true,
  createServiceClient: () => ({ auth: { admin: { updateUserById: mockUpdateUserById } } }),
}));
vi.mock('@/lib/auth/lockout', () => ({
  registerFailure: (...args: unknown[]) => mockRegisterFailure(...args),
  clearFailures: (...args: unknown[]) => mockClearFailures(...args),
}));
vi.mock('@/lib/auth/audit-log', () => ({ recordAuthEvent: async () => {} }));
vi.mock('@/lib/rate-limit-shared', () => ({ clientIp: () => '203.0.113.9' }));
vi.mock('@/lib/auth/timing', () => ({ settleAuthTiming: async () => {} }));
vi.mock('@/lib/auth/auth-error-message', () => ({ lockedOutMessage: () => 'Try again later.' }));
vi.mock('next/server', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('next/server');
  return { ...actual, after: (cb: () => unknown) => { void cb(); } };
});

import { POST } from '@/app/api/auth/reset-password/complete/route';

const good = {
  email: 'user@acme.com',
  code: 'A'.repeat(32),
  password: 'StrongPassword2026',
};

function req(body: unknown): Request {
  return new Request('http://localhost/api/auth/reset-password/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mockGuard.mockReset();
  mockGuard.mockResolvedValue({ blocked: null });
  mockConsume.mockReset();
  mockConsume.mockResolvedValue({ ok: true, userId: '11111111-1111-4111-8111-111111111111' });
  mockUpdateUserById.mockReset();
  mockUpdateUserById.mockResolvedValue({ error: null });
  mockRegisterFailure.mockReset();
  mockRegisterFailure.mockResolvedValue({ locked: false, minutesRemaining: 0 });
  mockClearFailures.mockReset();
});

describe('POST /api/auth/reset-password/complete', () => {
  it('requires the server-side password policy before consuming a code', async () => {
    const res = await POST(req({ ...good, password: 'short' }));
    expect(res.status).toBe(400);
    expect(mockConsume).not.toHaveBeenCalled();
    expect(mockUpdateUserById).not.toHaveBeenCalled();
  });

  it('consumes a valid code once and delegates password hashing to Supabase Auth', async () => {
    const res = await POST(req(good));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(mockConsume).toHaveBeenCalledWith(good.email, good.code);
    expect(mockUpdateUserById).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111', {
      password: good.password,
    });
    expect(mockClearFailures).toHaveBeenCalledWith(good.email);
  });

  it('returns a neutral invalid-code result and never calls the provider for an expired or used code', async () => {
    mockConsume.mockResolvedValue({ ok: false, reason: 'invalid-or-expired' });
    const res = await POST(req(good));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'This reset request is invalid, expired, or already used.' });
    expect(mockUpdateUserById).not.toHaveBeenCalled();
    expect(mockRegisterFailure).toHaveBeenCalledWith(good.email);
  });

  it('locks after repeated invalid code attempts without disclosing a provider cause', async () => {
    mockConsume.mockResolvedValue({ ok: false, reason: 'invalid-or-expired' });
    mockRegisterFailure.mockResolvedValue({ locked: true, minutesRemaining: 15 });
    const res = await POST(req(good));
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: 'Try again later.' });
    expect(mockUpdateUserById).not.toHaveBeenCalled();
  });

  it('returns a fixed unavailable message when the privileged provider update fails', async () => {
    mockUpdateUserById.mockResolvedValue({ error: { message: 'provider-internal-detail' } });
    const res = await POST(req(good));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'Password reset is unavailable right now. Please request a new code later.' });
  });

  it('returns a ready blocked response before consuming the code', async () => {
    mockGuard.mockResolvedValue({ blocked: new Response(null, { status: 429 }) });
    const res = await POST(req(good));
    expect(res.status).toBe(429);
    expect(mockConsume).not.toHaveBeenCalled();
  });
});
