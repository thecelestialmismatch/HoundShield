/**
 * Tests for POST /api/customer/status/snapshot — consent-gated, own-row,
 * deduped posture snapshots for the progress trend.
 */

const { mockIsConfigured, mockGetUser, mockProfile, mockLatest, mockInsert } = vi.hoisted(() => ({
  mockIsConfigured: vi.fn(() => true),
  mockGetUser: vi.fn(),
  mockProfile: vi.fn(),
  mockLatest: vi.fn(),
  mockInsert: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: () => mockIsConfigured(),
  createServiceClient: () => ({ from: () => ({ insert: (row: unknown) => mockInsert(row) }) }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: () => mockGetUser() },
    from: (_table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => mockProfile(),
          order: () => ({ limit: () => mockLatest() }),
        }),
      }),
    }),
  }),
}));

import { POST } from '@/app/api/customer/status/snapshot/route';
import { NextRequest } from 'next/server';

const SPRS = {
  score: 72,
  completionPercent: 100,
  totalControls: 110,
  metCount: 100,
  partialCount: 0,
  unmetCount: 10,
  assessedCount: 110,
  topGaps: [],
};

function req(body: unknown) {
  return new NextRequest('http://localhost/api/customer/status/snapshot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/customer/status/snapshot', () => {
  beforeEach(() => {
    mockIsConfigured.mockReset();
    mockIsConfigured.mockReturnValue(true);
    mockGetUser.mockReset();
    mockProfile.mockReset();
    mockLatest.mockReset();
    mockInsert.mockReset();
    mockInsert.mockResolvedValue({ error: null });
    mockLatest.mockResolvedValue({ data: [] });
  });

  it('does not store in demo mode', async () => {
    mockIsConfigured.mockReturnValue(false);
    const res = await POST(req({ sprs: SPRS }));
    expect((await res.json()).stored).toBe(false);
  });

  it('requires auth', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await POST(req({ sprs: SPRS }));
    expect(res.status).toBe(401);
  });

  it('fails closed without consent — never writes', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockProfile.mockResolvedValue({ data: { brain_ai_data_consent: false, tier: 'pro' } });
    const res = await POST(req({ sprs: SPRS }));
    const body = await res.json();
    expect(body.stored).toBe(false);
    expect(body.reason).toBe('no_consent');
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('stores the first snapshot under consent and returns a trend', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockProfile.mockResolvedValue({ data: { brain_ai_data_consent: true, tier: 'pro' } });
    mockLatest.mockResolvedValue({ data: [] });
    const res = await POST(req({ sprs: SPRS }));
    const body = await res.json();
    expect(body.stored).toBe(true);
    expect(body.trend.direction).toBe('none'); // no prior → none
    expect(mockInsert).toHaveBeenCalledTimes(1);
    // the row is stamped with the authenticated user's id
    expect(mockInsert.mock.calls[0][0].user_id).toBe('u1');
  });

  it('computes an up-trend versus a lower prior snapshot', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockProfile.mockResolvedValue({ data: { brain_ai_data_consent: true, tier: 'pro' } });
    mockLatest.mockResolvedValue({
      data: [{ sprs_score: 54, stage: 'remediating', captured_at: '2026-07-01T00:00:00Z' }],
    });
    const res = await POST(req({ sprs: SPRS }));
    const body = await res.json();
    expect(body.stored).toBe(true); // score changed → insert
    expect(body.trend.direction).toBe('up');
    expect(body.trend.sprsDelta).toBe(18);
  });

  it('dedupes an unchanged recent snapshot (no write)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockProfile.mockResolvedValue({ data: { brain_ai_data_consent: true, tier: 'pro' } });
    mockLatest.mockResolvedValue({
      data: [{ sprs_score: 72, stage: 'remediating', captured_at: new Date().toISOString() }],
    });
    const res = await POST(req({ sprs: SPRS }));
    const body = await res.json();
    expect(body.stored).toBe(false);
    expect(body.reason).toBe('deduped');
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('returns 500 when the insert errors', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockProfile.mockResolvedValue({ data: { brain_ai_data_consent: true, tier: 'pro' } });
    mockInsert.mockResolvedValue({ error: { message: 'boom' } });
    const res = await POST(req({ sprs: SPRS }));
    expect(res.status).toBe(500);
  });
});
