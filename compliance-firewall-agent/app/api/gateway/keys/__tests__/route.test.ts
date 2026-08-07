/**
 * /api/gateway/keys — issuance, listing, revocation.
 *
 * This route mints the credential that lets a customer's traffic reach the
 * gateway at all. Until it existed, `generateApiKey()` had no caller, the
 * `api_keys` table had no rows, and Settings displayed a `kls_<user-id>` string
 * that `resolveApiKey` rejected with 401 — so no prompt could be scanned, no
 * compliance event could be written, and the dashboard could never fill.
 *
 * What must never regress:
 *   - identity comes from the SESSION, never from input;
 *   - the raw key is returned exactly once and is never re-readable;
 *   - only the SHA-256 hash is persisted;
 *   - revocation cannot reach another tenant's key;
 *   - a key is never issued to a plan the gateway will reject.
 */

const { mockRequireUser, mockIsConfigured, mockInsert, mockSelectList, mockCount, mockUpdate } =
  vi.hoisted(() => ({
    mockRequireUser: vi.fn(),
    mockIsConfigured: vi.fn(() => true),
    mockInsert: vi.fn(),
    mockSelectList: vi.fn(),
    mockCount: vi.fn(),
    mockUpdate: vi.fn(),
  }));

/** Every filter and payload the route applied, for assertion. */
const applied: Record<string, unknown> = {};

vi.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: () => mockIsConfigured(),
  createServiceClient: () => ({
    from: (table: string) => {
      applied.table = table;
      const chain: Record<string, unknown> = {
        select: (cols: string, opts?: { head?: boolean }) => {
          applied.select = cols;
          // head:true is the count probe; otherwise it's a list/returning read.
          return opts?.head ? { eq: chainEq(() => mockCount()) } : chainList();
        },
        insert: (payload: unknown) => {
          applied.insert = payload;
          return {
            select: () => ({ single: () => mockInsert() }),
          };
        },
        update: (payload: unknown) => {
          applied.update = payload;
          return chainUpdate();
        },
      };
      return chain;

      function chainList() {
        const c: Record<string, unknown> = {
          eq: (col: string, val: unknown) => {
            applied[`eq:${col}`] = val;
            return c;
          },
          order: () => mockSelectList(),
        };
        return c;
      }

      function chainEq(done: () => unknown) {
        const c = (col: string, val: unknown) => {
          applied[`eq:${col}`] = val;
          return { eq: c, then: undefined, ...wrap(done) };
        };
        return c;
      }

      function wrap(done: () => unknown) {
        // The count probe is awaited directly after the last .eq()
        return {
          then: (res: (v: unknown) => unknown) => Promise.resolve(done()).then(res),
        };
      }

      function chainUpdate() {
        const c: Record<string, unknown> = {
          eq: (col: string, val: unknown) => {
            applied[`upd-eq:${col}`] = val;
            return c;
          },
          select: () => ({ maybeSingle: () => mockUpdate() }),
        };
        return c;
      }
    },
  }),
}));

vi.mock('@/lib/auth/api-guard', () => ({
  requireUser: () => mockRequireUser(),
}));

const { mockRateLimit } = vi.hoisted(() => ({ mockRateLimit: vi.fn(async () => null) }));
vi.mock('@/lib/rate-limit-shared', () => ({
  enforceRateLimit: () => mockRateLimit(),
  LLM_RATE_LIMITS: { authenticated: { limit: 20, windowMs: 60_000 } },
}));

// Only the TIER lookup is faked — `canAccessGateway` stays real, so these cases
// exercise the same predicate `/api/v1/chat/completions` enforces rather than a
// copy of it. Default to a paid tier so the issuance cases keep testing issuance.
const { mockTier } = vi.hoisted(() => ({ mockTier: vi.fn(async () => 'pro') }));
vi.mock('@/lib/subscription/check', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/subscription/check')>()),
  getUserSubscription: () => mockTier(),
}));

import { createHash } from 'crypto';
import { NextRequest } from 'next/server';
import { GET, POST, DELETE } from '@/app/api/gateway/keys/route';

const AUTHED = { user: { id: 'user-abc', email: 'a@b.com', role: 'user' }, response: null };
const ANON = {
  user: null,
  response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
};

const postReq = (body?: unknown) =>
  new NextRequest('http://localhost/api/gateway/keys', {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const delReq = (qs: string) =>
  new NextRequest(`http://localhost/api/gateway/keys${qs}`, { method: 'DELETE' });

describe('/api/gateway/keys', () => {
  beforeEach(() => {
    for (const k of Object.keys(applied)) delete applied[k];
    mockRequireUser.mockReset().mockResolvedValue(AUTHED);
    mockIsConfigured.mockReset().mockReturnValue(true);
    mockSelectList.mockReset().mockResolvedValue({ data: [], error: null });
    mockCount.mockReset().mockResolvedValue({ count: 0, error: null });
    mockUpdate.mockReset().mockResolvedValue({ data: { id: 'key-1' }, error: null });
    mockRateLimit.mockReset().mockResolvedValue(null);
    mockTier.mockReset().mockResolvedValue('pro');
    mockInsert.mockReset().mockResolvedValue({
      data: { id: 'key-1', key_prefix: 'hs_live_abc…', name: 'Gateway key', is_active: true },
      error: null,
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  // ── Auth boundary ──────────────────────────────────────────────────────────
  it.each([
    ['GET', () => GET()],
    ['POST', () => POST(postReq({ name: 'x' }))],
    ['DELETE', () => DELETE(delReq('?id=key-1'))],
  ])('%s 401s without a session', async (_m, call) => {
    mockRequireUser.mockResolvedValue(ANON);
    expect((await call()).status).toBe(401);
  });

  // ── Issuance ───────────────────────────────────────────────────────────────
  it('POST returns a real hs_live_ key and stores ONLY its hash', async () => {
    const res = await POST(postReq({ name: 'CI key' }));
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.key).toMatch(/^hs_live_/);

    const stored = applied.insert as Record<string, string>;
    // The exact hash resolveApiKey will compute for this key.
    expect(stored.key_hash).toBe(createHash('sha256').update(body.key).digest('hex'));
    // The secret itself is never in the stored payload.
    expect(JSON.stringify(stored)).not.toContain(body.key);
  });

  it('POST binds the key to the SESSION user, not to anything in the body', async () => {
    await POST(postReq({ name: 'x', user_id: 'someone-else' }));
    expect((applied.insert as Record<string, string>).user_id).toBe('user-abc');
  });

  it('POST accepts a missing/garbage body rather than failing the mint over a label', async () => {
    const res = await POST(postReq());
    expect(res.status).toBe(201);
    expect((applied.insert as Record<string, string>).name).toBe('Default key');
  });

  it('POST caps the label length', async () => {
    await POST(postReq({ name: 'x'.repeat(500) }));
    expect((applied.insert as Record<string, string>).name.length).toBe(60);
  });

  it('POST is rate limited — revoked rows persist, so mint/revoke/mint would amplify storage', async () => {
    mockRateLimit.mockResolvedValue(
      new Response(JSON.stringify({ error: 'Too many requests.' }), { status: 429 })
    );
    expect((await POST(postReq({ name: 'x' }))).status).toBe(429);
  });

  it('POST refuses past the active-key ceiling instead of minting forever', async () => {
    mockCount.mockResolvedValue({ count: 10, error: null });
    const res = await POST(postReq({ name: 'x' }));
    expect(res.status).toBe(409);
  });

  // ── Plan gate ──────────────────────────────────────────────────────────────
  // The gateway answers free-tier traffic with 402. Minting here without the
  // same check hands a free user a credential that is real, listed, and
  // guaranteed to fail — the same class of defect this route exists to close.
  it('POST refuses on the free plan instead of issuing a key the gateway will reject', async () => {
    mockTier.mockResolvedValue('free');
    const res = await POST(postReq({ name: 'x' }));
    expect(res.status).toBe(402);
    // Nothing was written: no dead row to explain later.
    expect(applied.insert).toBeUndefined();
    expect((await res.json()).error).toMatch(/pro plan/i);
  });

  it.each(['pro', 'growth', 'enterprise', 'agency'])(
    'POST still mints on %s — the gate is free-tier only',
    async (tier) => {
      mockTier.mockResolvedValue(tier);
      expect((await POST(postReq({ name: 'x' }))).status).toBe(201);
    }
  );

  // ── Listing ────────────────────────────────────────────────────────────────
  it('GET scopes to the session user and never selects a secret column', async () => {
    await GET();
    expect(applied.table).toBe('api_keys');
    expect(applied['eq:user_id']).toBe('user-abc');
    expect(applied.select).not.toContain('key_hash');
  });

  it('GET can never re-reveal a raw key', async () => {
    mockSelectList.mockResolvedValue({
      data: [{ id: 'key-1', key_prefix: 'hs_live_abc…', is_active: true }],
      error: null,
    });
    const body = await (await GET()).json();
    expect(JSON.stringify(body)).not.toMatch(/hs_live_[A-Za-z0-9_-]{20,}/);
  });

  // ── Revocation ─────────────────────────────────────────────────────────────
  it('DELETE scopes the update by user_id — the tenant boundary is in the query', async () => {
    await DELETE(delReq('?id=key-1'));
    expect(applied['upd-eq:id']).toBe('key-1');
    expect(applied['upd-eq:user_id']).toBe('user-abc');
    expect(applied.update).toMatchObject({ is_active: false });
  });

  it("DELETE 404s on another tenant's key rather than confirming it exists", async () => {
    mockUpdate.mockResolvedValue({ data: null, error: null });
    expect((await DELETE(delReq('?id=not-mine'))).status).toBe(404);
  });

  it('DELETE 400s without an id', async () => {
    expect((await DELETE(delReq(''))).status).toBe(400);
  });

  // ── Degraded deployment ────────────────────────────────────────────────────
  it('503s rather than pretending, when the database is not configured', async () => {
    mockIsConfigured.mockReturnValue(false);
    expect((await POST(postReq({ name: 'x' }))).status).toBe(503);
    expect((await GET()).status).toBe(503);
  });
});
