/**
 * POST /api/auth/login.
 *
 * The route's whole reason to exist is that HoundShield's server never used to
 * see a sign-in. Three properties are asserted here, and each one was
 * unreachable before the route existed:
 *
 *   ENUMERATION — every failure returns a byte-identical 401 body, so an
 *     unknown address and a wrong password are indistinguishable.
 *   TIMING      — every path settles through settleAuthTiming(). A single path
 *     that returns early becomes the oracle the rest of the file closes.
 *   LOCKOUT     — failures are recorded, success clears the streak, and a live
 *     lock refuses even a correct password (AC.2.008).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const {
  mockSignIn,
  mockConfigured,
  mockGuard,
  mockRegisterFailure,
  mockClearFailures,
  mockSettle,
} = vi.hoisted(() => ({
  mockSignIn: vi.fn(),
  mockConfigured: vi.fn().mockReturnValue(true),
  mockGuard: vi.fn(),
  mockRegisterFailure: vi.fn(),
  mockClearFailures: vi.fn(),
  mockSettle: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { signInWithPassword: mockSignIn } }),
}));

vi.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: () => mockConfigured(),
  createServiceClient: () => {
    throw new Error('not used');
  },
}));

vi.mock('@/lib/auth/credential-guard', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('@/lib/auth/credential-guard');
  return { ...actual, guardCredentials: mockGuard };
});

vi.mock('@/lib/auth/lockout', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('@/lib/auth/lockout');
  return {
    ...actual,
    registerFailure: mockRegisterFailure,
    clearFailures: mockClearFailures,
  };
});

// The real floor is 600ms; asserting the CALL is the invariant, and it keeps
// the suite fast. lib/auth/__tests__/timing.test.ts covers the delay itself.
vi.mock('@/lib/auth/timing', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('@/lib/auth/timing');
  return { ...actual, settleAuthTiming: mockSettle };
});

// Keep the real NextResponse; make after() run its callback synchronously
// WITHOUT awaiting it, mirroring production (the audit row is written but never
// blocks the response). Calling the handler directly gives Next no request
// scope, so the real after() throws — same shim as the reset-password suite.
vi.mock('next/server', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('next/server');
  return { ...actual, after: (cb: () => unknown) => { cb(); } };
});

// The audit trail has its own suite (lib/auth/__tests__/audit-log.test.ts).
// Here it is stubbed so a route case never depends on a database.
vi.mock('@/lib/auth/audit-log', () => ({ recordAuthEvent: async () => {} }));

import { NextResponse } from 'next/server';
import { POST } from '@/app/api/auth/login/route';
import { AUTH_INVALID_CREDENTIALS } from '@/lib/auth/auth-error-message';

const UNLOCKED = { locked: false, minutesRemaining: 0, consecutiveFailures: 0, degraded: false };

function req(body: unknown): Request {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '198.51.100.7' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const creds = { email: 'user@acme.com', password: 'correct-horse' };

beforeEach(() => {
  mockSignIn.mockReset().mockResolvedValue({ error: null });
  mockConfigured.mockReturnValue(true);
  mockGuard.mockReset().mockResolvedValue({ blocked: null, lock: UNLOCKED });
  mockRegisterFailure.mockReset().mockResolvedValue(UNLOCKED);
  mockClearFailures.mockReset().mockResolvedValue(undefined);
  mockSettle.mockReset().mockResolvedValue(undefined);
  delete process.env.AUTH_SERVER_ROUTES;
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  delete process.env.AUTH_SERVER_ROUTES;
  vi.restoreAllMocks();
});

describe('enumeration: every failure is indistinguishable', () => {
  /** The exact GoTrue texts that used to separate "exists" from "does not". */
  const FAILURES = [
    { message: 'Invalid login credentials' },
    { message: 'Email not confirmed' },
    { message: 'User not found' },
    { message: 'Invalid login credentials', status: 400 },
    new Error('Database error querying schema'),
  ];

  it('returns the same status and the same body for every one of them', async () => {
    const seen = new Set<string>();
    for (const error of FAILURES) {
      mockSignIn.mockResolvedValueOnce({ error });
      const res = await POST(req(creds));
      expect(res.status).toBe(401);
      seen.add(JSON.stringify(await res.json()));
    }
    expect(seen.size).toBe(1);
    expect([...seen][0]).toBe(JSON.stringify({ error: AUTH_INVALID_CREDENTIALS }));
  });

  it('answers a known-bad password exactly as it answers an unknown address', async () => {
    mockSignIn.mockResolvedValueOnce({ error: { message: 'Invalid login credentials' } });
    const wrongPassword = await POST(req({ email: 'real@acme.com', password: 'nope' }));

    mockSignIn.mockResolvedValueOnce({ error: { message: 'Invalid login credentials' } });
    const unknownEmail = await POST(req({ email: 'ghost@nowhere.test', password: 'nope' }));

    expect(wrongPassword.status).toBe(unknownEmail.status);
    expect(await wrongPassword.json()).toEqual(await unknownEmail.json());
  });

  it('never echoes raw provider text', async () => {
    mockSignIn.mockResolvedValueOnce({ error: { message: 'Email not confirmed' } });
    const body = await (await POST(req(creds))).json();
    expect(JSON.stringify(body)).not.toContain('not confirmed');
  });

  it('answers a malformed body with the same neutral message', async () => {
    const res = await POST(req({ email: 'nope', password: '' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe(AUTH_INVALID_CREDENTIALS);
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('answers unparseable JSON without leaking a parser error', async () => {
    const res = await POST(req('{not json'));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe(AUTH_INVALID_CREDENTIALS);
  });
});

describe('timing: no path may return without settling', () => {
  it('settles on success', async () => {
    await POST(req(creds));
    expect(mockSettle).toHaveBeenCalledTimes(1);
  });

  it('settles on a credential failure', async () => {
    mockSignIn.mockResolvedValue({ error: { message: 'Invalid login credentials' } });
    await POST(req(creds));
    expect(mockSettle).toHaveBeenCalledTimes(1);
  });

  it('settles on a malformed body — the cheapest path, and the easiest to forget', async () => {
    await POST(req({ email: 'nope', password: '' }));
    expect(mockSettle).toHaveBeenCalledTimes(1);
  });

  it('settles on unparseable JSON', async () => {
    await POST(req('{not json'));
    expect(mockSettle).toHaveBeenCalledTimes(1);
  });

  it('settles when the guard blocks', async () => {
    mockGuard.mockResolvedValue({
      blocked: NextResponse.json({ error: 'too many' }, { status: 429 }),
      lock: UNLOCKED,
    });
    await POST(req(creds));
    expect(mockSettle).toHaveBeenCalledTimes(1);
  });

  it('settles when Supabase is unconfigured', async () => {
    mockConfigured.mockReturnValue(false);
    await POST(req(creds));
    expect(mockSettle).toHaveBeenCalledTimes(1);
  });

  it('settles when the provider throws', async () => {
    mockSignIn.mockRejectedValue(new Error('ECONNRESET'));
    await POST(req(creds));
    expect(mockSettle).toHaveBeenCalledTimes(1);
  });

  it('starts the clock before any work, so the floor covers the whole request', async () => {
    const before = Date.now();
    await POST(req(creds));
    const startedAt = mockSettle.mock.calls[0][0] as number;
    expect(startedAt).toBeGreaterThanOrEqual(before);
    expect(startedAt).toBeLessThanOrEqual(Date.now());
  });
});

describe('lockout', () => {
  it('records a failure', async () => {
    mockSignIn.mockResolvedValue({ error: { message: 'Invalid login credentials' } });
    await POST(req(creds));
    expect(mockRegisterFailure).toHaveBeenCalledWith('user@acme.com');
  });

  it('clears the streak on success — what makes the count consecutive', async () => {
    await POST(req(creds));
    expect(mockClearFailures).toHaveBeenCalledWith('user@acme.com');
    expect(mockRegisterFailure).not.toHaveBeenCalled();
  });

  it('answers 429 with Retry-After once the failure trips the lock', async () => {
    mockSignIn.mockResolvedValue({ error: { message: 'Invalid login credentials' } });
    mockRegisterFailure.mockResolvedValue({
      locked: true,
      minutesRemaining: 15,
      consecutiveFailures: 5,
      degraded: false,
    });
    const res = await POST(req(creds));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('900');
    expect((await res.json()).error).toMatch(/15 minutes/);
  });

  it('refuses a CORRECT password while the lock holds — the AC.2.008 property', async () => {
    mockGuard.mockResolvedValue({
      blocked: NextResponse.json({ error: 'locked' }, { status: 429 }),
      lock: { locked: true, minutesRemaining: 9, consecutiveFailures: 5, degraded: false },
    });
    const res = await POST(req(creds));
    expect(res.status).toBe(429);
    // Never reached the provider: a correct password cannot unlock the account.
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('normalizes the address before keying, so case-flipping cannot reset the streak', async () => {
    mockSignIn.mockResolvedValue({ error: { message: 'Invalid login credentials' } });
    await POST(req({ email: '  User@ACME.com ', password: 'x' }));
    expect(mockRegisterFailure).toHaveBeenCalledWith('user@acme.com');
  });
});

describe('rollback and configuration', () => {
  it('answers 501 when AUTH_SERVER_ROUTES=off, without touching the provider', async () => {
    process.env.AUTH_SERVER_ROUTES = 'off';
    const res = await POST(req(creds));
    expect(res.status).toBe(501);
    expect(mockSignIn).not.toHaveBeenCalled();
    expect(mockGuard).not.toHaveBeenCalled();
  });

  it('says so plainly when the deployment has no Supabase credentials', async () => {
    mockConfigured.mockReturnValue(false);
    const res = await POST(req(creds));
    // 503, not 401: a correct password on an unconfigured deployment is an
    // infrastructure fault, and "invalid credentials" would be a lie.
    expect(res.status).toBe(503);
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('never surfaces provider internals when the call throws', async () => {
    mockSignIn.mockRejectedValue(new Error('postgres://user:pw@host down'));
    const res = await POST(req(creds));
    expect(res.status).toBe(503);
    expect(JSON.stringify(await res.json())).not.toContain('postgres://');
  });
});

describe('success', () => {
  it('returns ok and lets the SSR client set the session cookie', async () => {
    const res = await POST(req(creds));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(mockSignIn).toHaveBeenCalledWith({ email: 'user@acme.com', password: 'correct-horse' });
  });

  it('never returns the password or a token in the body', async () => {
    const body = JSON.stringify(await (await POST(req(creds))).json());
    expect(body).not.toContain('correct-horse');
    expect(body.toLowerCase()).not.toContain('token');
  });
});
