/**
 * Tests for GET /api/customer/status — account-level customer status, own-data.
 */

const { mockIsConfigured, mockGetUser, mockProfile, mockOrders } = vi.hoisted(() => ({
  mockIsConfigured: vi.fn(() => true),
  mockGetUser: vi.fn(),
  mockProfile: vi.fn(),
  mockOrders: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: () => mockIsConfigured(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: () => mockGetUser() },
    from: (_table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => mockProfile(),
          order: () => ({ limit: () => mockOrders() }),
        }),
      }),
    }),
  }),
}));

import { GET } from '@/app/api/customer/status/route';

describe('GET /api/customer/status', () => {
  beforeEach(() => {
    mockIsConfigured.mockReset();
    mockIsConfigured.mockReturnValue(true);
    mockGetUser.mockReset();
    mockProfile.mockReset();
    mockOrders.mockReset();
  });

  it('returns a not_started status in demo mode', async () => {
    mockIsConfigured.mockReturnValue(false);
    const res = await GET();
    expect(res.status).toBe(200);
    const { status, configured } = await res.json();
    expect(configured).toBe(false);
    expect(status.stage).toBe('not_started');
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('builds an account status with the latest report order', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockProfile.mockResolvedValue({ data: { tier: 'pro', company: 'Acme' }, error: null });
    mockOrders.mockResolvedValue({
      data: [
        {
          id: 'o1',
          email: 'a@b.com',
          vertical: 'defense',
          amount_cents: 49900,
          currency: 'usd',
          status: 'paid',
          is_wholesale: false,
          stripe_session_id: 'cs_live_abc123def456',
          report_delivered_at: null,
          created_at: '2026-07-04T00:00:00.000Z',
        },
      ],
      error: null,
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const { status } = await res.json();
    // account-only (sprs null) + a paid, undelivered order → report_pending
    expect(status.stage).toBe('report_pending');
    expect(status.order.reference).toMatch(/^HS-[A-Z0-9]{8}$/);
    expect(status.tier).toBe('pro');
  });

  it('returns a not_started status when the user has no orders', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockProfile.mockResolvedValue({ data: { tier: 'free', company: null }, error: null });
    mockOrders.mockResolvedValue({ data: [], error: null });
    const res = await GET();
    expect(res.status).toBe(200);
    const { status } = await res.json();
    expect(status.stage).toBe('not_started');
    expect(status.order).toBeNull();
  });
});
