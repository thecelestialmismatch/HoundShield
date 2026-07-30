/**
 * Shared-state rate limiting — the limiter that actually limits.
 *
 * The properties worth pinning are the ones that were silently false before:
 *   • the count lives in Postgres, so it is shared across function instances
 *     (the pre-existing in-memory limiters counted per-instance and therefore
 *     never bounded anything on Vercel Fluid Compute);
 *   • a raw IP NEVER reaches the database — it is hashed at the boundary;
 *   • when the shared store is unreachable the paid product endpoint keeps
 *     serving (fail-open to a local limiter) instead of 429-ing customers.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockIsConfigured, mockRpc } = vi.hoisted(() => ({
  mockIsConfigured: vi.fn(() => true),
  mockRpc: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: () => mockIsConfigured(),
  createServiceClient: () => ({
    rpc: (fn: string, args: Record<string, unknown>) => mockRpc(fn, args),
  }),
}));

import {
  consumeRateLimit,
  enforceRateLimit,
  identifierFor,
  clientIp,
  rateLimitHeaders,
  LLM_RATE_LIMITS,
} from '@/lib/rate-limit-shared';

/** A permissive RPC reply. */
function allow(remaining = 19) {
  return {
    data: [{ allowed: true, remaining, reset_at: new Date(Date.now() + 60_000).toISOString() }],
    error: null,
  };
}

/** A denying RPC reply. */
function deny() {
  return {
    data: [{ allowed: false, remaining: 0, reset_at: new Date(Date.now() + 30_000).toISOString() }],
    error: null,
  };
}

const OPTS = { limit: 20, windowMs: 60_000 };

/** Unique namespace per test so the local fallback's module state cannot bleed. */
let n = 0;
const ns = () => `test-ns-${n++}`;

beforeEach(() => {
  mockIsConfigured.mockReturnValue(true);
  mockRpc.mockReset();
});

describe('identifierFor', () => {
  it('prefers a user id, which is already opaque', () => {
    expect(identifierFor({ userId: 'user-123', ip: '203.0.113.9' })).toBe('u:user-123');
  });

  it('hashes an IP and never returns it in the clear', () => {
    const raw = '203.0.113.9';
    const id = identifierFor({ ip: raw });
    expect(id).toMatch(/^i:[0-9a-f]{32}$/);
    expect(id).not.toContain(raw);
  });

  it('is stable for the same IP and distinct for different IPs', () => {
    expect(identifierFor({ ip: '203.0.113.9' })).toBe(identifierFor({ ip: '203.0.113.9' }));
    expect(identifierFor({ ip: '203.0.113.9' })).not.toBe(identifierFor({ ip: '203.0.113.10' }));
  });

  it('falls back to a constant when nothing identifies the caller', () => {
    expect(identifierFor({})).toBe('anon');
    expect(identifierFor({ ip: '   ' })).toBe('anon');
  });
});

describe('clientIp', () => {
  it('takes the first hop of x-forwarded-for, matching middleware.ts', () => {
    const req = { headers: { get: () => '198.51.100.7, 10.0.0.1, 10.0.0.2' } };
    expect(clientIp(req)).toBe('198.51.100.7');
  });

  it('degrades to "unknown" rather than throwing when the header is absent', () => {
    expect(clientIp({ headers: { get: () => null } })).toBe('unknown');
  });
});

describe('consumeRateLimit — shared path', () => {
  it('counts in Postgres and reports the decision', async () => {
    mockRpc.mockResolvedValue(allow(19));
    const d = await consumeRateLimit(ns(), 'u:abc', OPTS);

    expect(mockRpc).toHaveBeenCalledOnce();
    expect(d.allowed).toBe(true);
    expect(d.remaining).toBe(19);
    expect(d.degraded).toBe(false);
  });

  it('sends a route-scoped key so one endpoint cannot drain another', async () => {
    mockRpc.mockResolvedValue(allow());
    await consumeRateLimit('brain-v3', 'u:abc', OPTS);

    const [fn, args] = mockRpc.mock.calls[0];
    expect(fn).toBe('consume_rate_limit');
    expect(args.p_key).toBe('brain-v3:u:abc');
  });

  it('never sends a raw IP to the database', async () => {
    mockRpc.mockResolvedValue(allow());
    const raw = '203.0.113.9';
    await consumeRateLimit('brain-query', identifierFor({ ip: raw }), OPTS);

    expect(JSON.stringify(mockRpc.mock.calls[0][1])).not.toContain(raw);
  });

  it('converts the window to whole seconds for Postgres', async () => {
    mockRpc.mockResolvedValue(allow());
    await consumeRateLimit(ns(), 'u:abc', { limit: 5, windowMs: 60_000 });
    expect(mockRpc.mock.calls[0][1].p_window_seconds).toBe(60);
  });

  it('reports a denial when the bucket is exhausted', async () => {
    mockRpc.mockResolvedValue(deny());
    const d = await consumeRateLimit(ns(), 'u:abc', OPTS);
    expect(d.allowed).toBe(false);
    expect(d.remaining).toBe(0);
  });
});

describe('consumeRateLimit — availability', () => {
  it('falls back to a local limiter when the RPC errors, and flags it', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'connection refused' } });
    const d = await consumeRateLimit(ns(), 'u:abc', OPTS);

    // Serving continues — the paid endpoint must not 429 on an infra blip.
    expect(d.allowed).toBe(true);
    expect(d.degraded).toBe(true);
  });

  it('falls back when the RPC throws', async () => {
    mockRpc.mockRejectedValue(new Error('socket hang up'));
    const d = await consumeRateLimit(ns(), 'u:abc', OPTS);
    expect(d.allowed).toBe(true);
    expect(d.degraded).toBe(true);
  });

  it('falls back when the RPC returns no decision row', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    const d = await consumeRateLimit(ns(), 'u:abc', OPTS);
    expect(d.degraded).toBe(true);
  });

  it('uses the local limiter entirely when Supabase is not configured', async () => {
    mockIsConfigured.mockReturnValue(false);
    const d = await consumeRateLimit(ns(), 'u:abc', OPTS);

    expect(mockRpc).not.toHaveBeenCalled();
    expect(d.degraded).toBe(true);
  });

  it('the local fallback still bounds a flood rather than ignoring it', async () => {
    mockIsConfigured.mockReturnValue(false);
    const namespace = ns();
    const opts = { limit: 3, windowMs: 60_000 };

    const results = [];
    for (let i = 0; i < 5; i++) {
      results.push((await consumeRateLimit(namespace, 'u:flood', opts)).allowed);
    }
    // Degraded means "per-instance", not "unlimited".
    expect(results).toEqual([true, true, true, false, false]);
  });
});

describe('enforceRateLimit', () => {
  it('returns null while the caller is within budget', async () => {
    mockRpc.mockResolvedValue(allow());
    expect(await enforceRateLimit(ns(), 'u:abc', OPTS)).toBeNull();
  });

  it('returns a 429 carrying Retry-After and X-RateLimit-* once exhausted', async () => {
    mockRpc.mockResolvedValue(deny());
    const res = await enforceRateLimit(ns(), 'u:abc', OPTS);

    expect(res).not.toBeNull();
    expect(res!.status).toBe(429);
    expect(res!.headers.get('X-RateLimit-Limit')).toBe('20');
    expect(res!.headers.get('X-RateLimit-Remaining')).toBe('0');

    const retryAfter = Number(res!.headers.get('Retry-After'));
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(60);
  });

  it('never emits a non-positive Retry-After even if the window already closed', async () => {
    mockRpc.mockResolvedValue({
      data: [{ allowed: false, remaining: 0, reset_at: new Date(Date.now() - 5_000).toISOString() }],
      error: null,
    });
    const res = await enforceRateLimit(ns(), 'u:abc', OPTS);
    expect(Number(res!.headers.get('Retry-After'))).toBeGreaterThanOrEqual(1);
  });
});

describe('rateLimitHeaders', () => {
  it('reports reset as epoch seconds, not milliseconds', () => {
    const resetAt = Date.now() + 60_000;
    const h = rateLimitHeaders({ allowed: true, limit: 20, remaining: 5, resetAt, degraded: false });
    expect(h['X-RateLimit-Reset']).toBe(String(Math.ceil(resetAt / 1_000)));
  });
});

describe('LLM_RATE_LIMITS', () => {
  it('shares the 60s window used by middleware.ts so both layers mean the same unit', () => {
    for (const cfg of Object.values(LLM_RATE_LIMITS)) {
      expect(cfg.windowMs).toBe(60_000);
      expect(cfg.limit).toBeGreaterThan(0);
    }
  });

  it('keeps the paid gateway roomier than the per-user LLM budget', () => {
    expect(LLM_RATE_LIMITS.gateway.limit).toBeGreaterThan(LLM_RATE_LIMITS.authenticated.limit);
  });
});
