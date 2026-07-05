/**
 * Tests for GET /api/me — session-derived identity for personalization.
 * Must return the CALLER'S OWN name only, never another account, never email/id.
 */

const { mockIsConfigured, mockGetUser, mockProfile } = vi.hoisted(() => ({
  mockIsConfigured: vi.fn(() => true),
  mockGetUser: vi.fn(),
  mockProfile: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({ isSupabaseConfigured: () => mockIsConfigured() }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: () => mockGetUser() },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => mockProfile() }) }) }),
  }),
}));

import { GET } from '@/app/api/me/route';

describe('GET /api/me', () => {
  beforeEach(() => {
    mockIsConfigured.mockReset();
    mockIsConfigured.mockReturnValue(true);
    mockGetUser.mockReset();
    mockProfile.mockReset();
  });

  it('returns authenticated:false in demo mode', async () => {
    mockIsConfigured.mockReturnValue(false);
    const res = await GET();
    expect((await res.json()).authenticated).toBe(false);
  });

  it('returns authenticated:false for a guest', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await GET();
    expect((await res.json()).authenticated).toBe(false);
  });

  it('returns the caller’s own first name and never the email/id', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockProfile.mockResolvedValue({
      data: { full_name: 'Jordan Mills', company: 'Vector Defense', role: 'admin', tier: 'pro' },
    });
    const res = await GET();
    const body = await res.json();
    expect(body.authenticated).toBe(true);
    expect(body.firstName).toBe('Jordan');
    expect(body.name).toBe('Jordan Mills');
    expect(body.tier).toBe('pro');
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain('u1');
    expect(serialized.toLowerCase()).not.toContain('email');
  });

  it('handles a missing name gracefully', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockProfile.mockResolvedValue({ data: { full_name: '', company: null, role: null, tier: 'free' } });
    const res = await GET();
    const body = await res.json();
    expect(body.authenticated).toBe(true);
    expect(body.firstName).toBeNull();
    expect(body.tier).toBe('free');
  });
});
