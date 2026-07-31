/**
 * GET /api/dashboard/overview — auth boundary and honesty contract.
 *
 * This route reads through the SERVICE-ROLE client, which bypasses row-level
 * security. Tenant isolation therefore rests entirely on one thing: the
 * `user_id` filter being the SESSION's id. These tests exist so that can never
 * silently regress into a client-supplied value — that would hand any signed-in
 * customer another customer's security posture.
 */

const { mockIsConfigured, mockRequireUser, mockQuery } = vi.hoisted(() => ({
  mockIsConfigured: vi.fn(() => true),
  mockRequireUser: vi.fn(),
  mockQuery: vi.fn(),
}));

/** Records every filter applied, so the test can assert what was scoped. */
const applied: Record<string, unknown> = {};

vi.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: () => mockIsConfigured(),
  createServiceClient: () => ({
    from: (table: string) => {
      applied.table = table;
      const chain = {
        select: (cols: string) => { applied.select = cols; return chain; },
        eq: (col: string, val: unknown) => { applied[`eq:${col}`] = val; return chain; },
        gte: (col: string, val: unknown) => { applied[`gte:${col}`] = val; return chain; },
        order: () => chain,
        limit: () => mockQuery(),
      };
      return chain;
    },
  }),
}));

vi.mock('@/lib/auth/api-guard', () => ({
  requireUser: () => mockRequireUser(),
}));

import { GET } from '@/app/api/dashboard/overview/route';
import { NextRequest } from 'next/server';

const req = (qs = '') => new NextRequest(`http://localhost/api/dashboard/overview${qs}`);
const AUTHED = { user: { id: 'user-abc', email: 'a@b.com', role: 'user' }, response: null };

describe('GET /api/dashboard/overview', () => {
  beforeEach(() => {
    for (const k of Object.keys(applied)) delete applied[k];
    mockIsConfigured.mockReset().mockReturnValue(true);
    mockRequireUser.mockReset();
    mockQuery.mockReset().mockResolvedValue({ data: [], error: null });
  });

  it('401s without a session — telemetry is never anonymous', async () => {
    mockRequireUser.mockResolvedValue({
      user: null,
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    });
    expect((await GET(req())).status).toBe(401);
  });

  it('scopes the query to the SESSION user id', async () => {
    mockRequireUser.mockResolvedValue(AUTHED);
    await GET(req());
    expect(applied.table).toBe('compliance_events');
    expect(applied['eq:user_id']).toBe('user-abc');
  });

  it('IGNORES a client-supplied user_id — the tenant boundary is not a parameter', async () => {
    mockRequireUser.mockResolvedValue(AUTHED);
    await GET(req('?user_id=victim&days=7'));
    expect(applied['eq:user_id']).toBe('user-abc');
    expect(applied['eq:user_id']).not.toBe('victim');
  });

  it('never selects the prompt hash — the dashboard has no use for it', async () => {
    mockRequireUser.mockResolvedValue(AUTHED);
    await GET(req());
    expect(applied.select).not.toContain('prompt_hash');
    expect(applied.select).not.toContain('*');
  });

  it('reports connected:false for a customer with no events — never sample data', async () => {
    mockRequireUser.mockResolvedValue(AUTHED);
    const body = await (await GET(req())).json();
    expect(body.connected).toBe(false);
    expect(body.totals.events).toBe(0);
    expect(body.recent).toEqual([]);
    expect(body.providers).toEqual([]);
  });

  it('clamps an out-of-range window instead of erroring the dashboard blank', async () => {
    mockRequireUser.mockResolvedValue(AUTHED);
    for (const qs of ['?days=999', '?days=abc', '']) {
      const body = await (await GET(req(qs))).json();
      expect(body.windowDays).toBe(7);
    }
  });

  it('honours the windows the UI offers', async () => {
    mockRequireUser.mockResolvedValue(AUTHED);
    for (const days of [1, 7, 30]) {
      const body = await (await GET(req(`?days=${days}`))).json();
      expect(body.windowDays).toBe(days);
    }
  });

  it('aggregates the caller’s rows', async () => {
    mockRequireUser.mockResolvedValue(AUTHED);
    mockQuery.mockResolvedValue({
      data: [{
        id: 'abc123de-0000-4000-8000-000000000000',
        created_at: new Date().toISOString(),
        destination_provider: 'openai',
        risk_level: 'CRITICAL',
        classifications: ['CUI'],
        action_taken: 'BLOCKED',
        processing_time_ms: 7,
      }],
      error: null,
    });
    const body = await (await GET(req())).json();
    expect(body.connected).toBe(true);
    expect(body.totals.blocked).toBe(1);
    expect(body.scanP50Ms).toBe(7);
    expect(body.recent[0].ref).toBe('evt_abc123');
  });

  it('500s on a query failure rather than faking an empty dashboard', async () => {
    // `connected: false` means "no traffic yet". Returning it when the query
    // merely broke would tell a customer their gateway is idle when it isn't.
    mockRequireUser.mockResolvedValue(AUTHED);
    mockQuery.mockResolvedValue({ data: null, error: { message: 'boom' } });
    const res = await GET(req());
    expect(res.status).toBe(500);
    expect((await res.json()).connected).toBeUndefined();
  });

  it('still requires a session in demo mode', async () => {
    mockIsConfigured.mockReturnValue(false);
    mockRequireUser.mockResolvedValue({
      user: null,
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    });
    expect((await GET(req())).status).toBe(401);
  });
});
