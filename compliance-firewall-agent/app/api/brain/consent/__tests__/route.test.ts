/**
 * Tests for /api/brain/consent — the Brain AI account-data consent gate.
 * Validates demo mode, auth, read, and write (grant/revoke), all own-row.
 */

const { mockIsConfigured, mockGetUser, mockMaybeSingle, mockUpdateEq } = vi.hoisted(() => ({
  mockIsConfigured: vi.fn(() => true),
  mockGetUser: vi.fn(),
  mockMaybeSingle: vi.fn(),
  mockUpdateEq: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: () => mockIsConfigured(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: () => mockGetUser() },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: () => mockMaybeSingle() }) }),
      update: () => ({ eq: () => mockUpdateEq() }),
    }),
  }),
}));

import { GET, POST } from '@/app/api/brain/consent/route';
import { NextRequest } from 'next/server';

function postReq(body: unknown) {
  return new NextRequest('http://localhost/api/brain/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/brain/consent', () => {
  beforeEach(() => {
    mockIsConfigured.mockReset();
    mockIsConfigured.mockReturnValue(true);
    mockGetUser.mockReset();
    mockMaybeSingle.mockReset();
    mockUpdateEq.mockReset();
  });

  it('GET returns consent:false in demo mode', async () => {
    mockIsConfigured.mockReturnValue(false);
    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json()).consent).toBe(false);
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('GET returns the stored consent', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockMaybeSingle.mockResolvedValue({
      data: { brain_ai_data_consent: true, brain_ai_consent_updated_at: '2026-07-05T00:00:00Z' },
      error: null,
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.consent).toBe(true);
    expect(body.updatedAt).toBe('2026-07-05T00:00:00Z');
  });

  it('POST requires auth', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await POST(postReq({ consent: true }));
    expect(res.status).toBe(401);
  });

  it('POST rejects a malformed body', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    const res = await POST(postReq({ nope: 1 }));
    expect(res.status).toBe(400);
  });

  it('POST grants consent', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockUpdateEq.mockResolvedValue({ error: null });
    const res = await POST(postReq({ consent: true }));
    expect(res.status).toBe(200);
    expect((await res.json()).consent).toBe(true);
  });

  it('POST revokes consent', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockUpdateEq.mockResolvedValue({ error: null });
    const res = await POST(postReq({ consent: false }));
    expect(res.status).toBe(200);
    expect((await res.json()).consent).toBe(false);
  });

  it('POST returns 500 on a write error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockUpdateEq.mockResolvedValue({ error: { message: 'boom' } });
    const res = await POST(postReq({ consent: true }));
    expect(res.status).toBe(500);
  });
});
