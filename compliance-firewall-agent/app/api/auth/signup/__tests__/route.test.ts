/**
 * POST /api/auth/signup.
 *
 * Sign-up was the loudest of the three enumeration oracles: app/signup/page.tsx
 * answered "That email is already registered", which for a compliance product
 * tells an anonymous caller whether a given company is a HoundShield customer.
 *
 * The contract asserted here is stronger than "the wording matches" — it is
 * that a fresh address and an existing one produce a BYTE-IDENTICAL response.
 * Comparing the two serialized bodies is the only assertion that cannot pass
 * while a subtle difference (a field, a flag, a status) survives.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockSignUp, mockConfigured, mockGuard, mockSettle } = vi.hoisted(() => ({
  mockSignUp: vi.fn(),
  mockConfigured: vi.fn().mockReturnValue(true),
  mockGuard: vi.fn(),
  mockSettle: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { signUp: mockSignUp } }),
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

// The real floor is 600ms; asserting the CALL is the invariant and keeps the
// suite fast. lib/auth/__tests__/timing.test.ts covers the delay itself.
vi.mock('@/lib/auth/timing', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('@/lib/auth/timing');
  return { ...actual, settleAuthTiming: mockSettle };
});

import { NextResponse } from 'next/server';
import { POST } from '@/app/api/auth/signup/route';
import { AUTH_SIGNUP_CHECK_EMAIL, AUTH_RATE_LIMITED } from '@/lib/auth/auth-error-message';

function req(body: unknown): Request {
  return new Request('http://localhost/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '198.51.100.7' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const creds = { email: 'new@acme.com', password: 'correct-horse-battery' };

/** Status + exact body text, which is what an attacker can actually observe. */
async function fingerprint(res: Response) {
  return { status: res.status, body: await res.text() };
}

beforeEach(() => {
  mockSignUp.mockReset().mockResolvedValue({ data: { user: {}, session: null }, error: null });
  mockConfigured.mockReturnValue(true);
  mockGuard.mockReset().mockResolvedValue({ blocked: null });
  mockSettle.mockReset().mockResolvedValue(undefined);
  delete process.env.AUTH_SERVER_ROUTES;
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  delete process.env.AUTH_SERVER_ROUTES;
  vi.restoreAllMocks();
});

describe('enumeration: an existing address is indistinguishable from a fresh one', () => {
  /** The GoTrue/Postgres texts that used to separate "exists" from "does not". */
  const DUPLICATE_ERRORS = [
    { message: 'User already registered' },
    { message: 'user already exists' },
    { message: 'duplicate key value violates unique constraint "users_email_key"' },
  ];

  it('returns a byte-identical response for a fresh and an existing address', async () => {
    const fresh = await fingerprint(await POST(req(creds)));

    for (const error of DUPLICATE_ERRORS) {
      mockSignUp.mockResolvedValueOnce({ data: { user: null, session: null }, error });
      const existing = await fingerprint(await POST(req(creds)));
      expect(existing).toEqual(fresh);
    }
  });

  it('never echoes the duplicate wording back to the caller', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'User already registered' },
    });
    const body = await (await POST(req(creds))).text();
    // Note: the neutral copy does contain the word "registered", in the
    // CONDITIONAL "If that email can be registered…". That phrasing is the
    // point — it is true for both cases and so distinguishes neither. What must
    // never appear is an assertion that the address *is* taken.
    expect(body).not.toMatch(/already/i);
    expect(body).not.toMatch(/exists/i);
    expect(body).not.toMatch(/duplicate/i);
    expect(body).not.toMatch(/taken|in use/i);
  });

  it('answers 200 with the neutral check-your-email body', async () => {
    const res = await POST(req(creds));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, message: AUTH_SIGNUP_CHECK_EMAIL });
  });

  it('does not leak the address into the server log line', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    mockSignUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'User already registered' },
    });
    await POST(req(creds));
    for (const call of info.mock.calls) {
      expect(String(call.join(' '))).not.toContain('new@acme.com');
    }
  });

  it('is identical whether or not Supabase returned a user object', async () => {
    // The empty-`identities` inference was the second way the old page derived
    // "this address already exists". Neither shape may change the response.
    mockSignUp.mockResolvedValueOnce({
      data: { user: { identities: [] }, session: null },
      error: null,
    });
    const withEmptyIdentities = await fingerprint(await POST(req(creds)));

    mockSignUp.mockResolvedValueOnce({
      data: { user: { identities: [{ provider: 'email' }] }, session: null },
      error: null,
    });
    const withIdentity = await fingerprint(await POST(req(creds)));

    expect(withEmptyIdentities).toEqual(withIdentity);
  });
});

describe('timing: every path settles before responding', () => {
  it('settles on success', async () => {
    await POST(req(creds));
    expect(mockSettle).toHaveBeenCalledTimes(1);
  });

  it('settles on a swallowed duplicate', async () => {
    mockSignUp.mockResolvedValue({
      data: null,
      error: { message: 'User already registered' },
    });
    await POST(req(creds));
    expect(mockSettle).toHaveBeenCalledTimes(1);
  });

  it('settles on a validation rejection', async () => {
    await POST(req({ email: 'nope', password: 'short' }));
    expect(mockSettle).toHaveBeenCalledTimes(1);
  });

  it('settles on a malformed body', async () => {
    await POST(req('{not json'));
    expect(mockSettle).toHaveBeenCalledTimes(1);
  });

  it('settles when the guard blocks', async () => {
    mockGuard.mockResolvedValue({
      blocked: NextResponse.json({ error: 'Too many requests.' }, { status: 429 }),
    });
    const res = await POST(req(creds));
    expect(res.status).toBe(429);
    expect(mockSettle).toHaveBeenCalledTimes(1);
  });

  it('settles when sign-up throws', async () => {
    mockSignUp.mockRejectedValue(new Error('supabase down'));
    const res = await POST(req(creds));
    expect(res.status).toBe(503);
    expect(mockSettle).toHaveBeenCalledTimes(1);
  });
});

describe('input validation', () => {
  it('rejects a password under 8 characters without calling Supabase', async () => {
    const res = await POST(req({ email: 'a@b.com', password: 'short' }));
    expect(res.status).toBe(400);
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('rejects a malformed email without calling Supabase', async () => {
    const res = await POST(req({ email: 'not-an-email', password: 'correct-horse' }));
    expect(res.status).toBe(400);
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('says nothing about any account when it rejects input', async () => {
    const body = await (await POST(req({ email: 'nope', password: 'x' }))).text();
    expect(body).not.toMatch(/already|exists|registered|account/i);
  });
});

describe('rate limiting and rollback', () => {
  it('runs the guard on the signup namespace before touching Supabase', async () => {
    await POST(req(creds));
    const [args] = mockGuard.mock.calls[0];
    expect(args.namespace).toBe('auth:signup');
    // Sign-up has no wrong answer to repeat, so there is no consecutive-failure
    // streak to count — volume is bounded by the two buckets instead.
    expect(args.useLockout).toBe(false);
  });

  it('surfaces throttling as 429, the one caller-caused failure it may reveal', async () => {
    mockSignUp.mockResolvedValue({
      data: null,
      error: { message: 'email rate limit exceeded' },
    });
    const res = await POST(req(creds));
    expect(res.status).toBe(429);
    await expect(res.json()).resolves.toEqual({ error: AUTH_RATE_LIMITED });
  });

  it('answers 501 when AUTH_SERVER_ROUTES=off so the browser reverts', async () => {
    process.env.AUTH_SERVER_ROUTES = 'off';
    const res = await POST(req(creds));
    expect(res.status).toBe(501);
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('reports 503 rather than a neutral 200 when Supabase is not configured', async () => {
    // A deployment that cannot create accounts must not claim it just did.
    mockConfigured.mockReturnValue(false);
    const res = await POST(req(creds));
    expect(res.status).toBe(503);
    expect(mockSignUp).not.toHaveBeenCalled();
  });
});

describe('auto-confirm is reported, not silently tolerated', () => {
  it('warns loudly when Supabase returns a session (Confirm email is OFF)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockSignUp.mockResolvedValue({
      data: { user: {}, session: { access_token: 't' } },
      error: null,
    });
    const res = await POST(req(creds));
    expect(res.status).toBe(200);
    expect(warn).toHaveBeenCalled();
    expect(String(warn.mock.calls[0].join(' '))).toMatch(/enumerable|Confirm email/i);
  });
});
