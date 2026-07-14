/**
 * getUserSubscription — the tier every server gate bills against (PDF 402,
 * gateway access). Pins the founder override: a founder's profile email
 * resolves to the top tier with NO subscription row required, while everyone
 * else keeps reading their real subscription.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockIsConfigured, mockSub, mockProfile } = vi.hoisted(() => ({
  mockIsConfigured: vi.fn(() => true),
  mockSub: vi.fn(),
  mockProfile: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: () => mockIsConfigured(),
  createServiceClient: () => ({
    from: (table: string) =>
      table === 'profiles'
        ? { select: () => ({ eq: () => ({ maybeSingle: () => mockProfile() }) }) }
        : {
            select: () => ({
              eq: () => ({
                in: () => ({
                  order: () => ({ limit: () => ({ maybeSingle: () => mockSub() }) }),
                }),
              }),
            }),
          },
  }),
}));

import { getUserSubscription } from '@/lib/subscription/check';

describe('getUserSubscription', () => {
  beforeEach(() => {
    mockIsConfigured.mockReset();
    mockIsConfigured.mockReturnValue(true);
    mockSub.mockReset();
    mockProfile.mockReset();
  });

  it('demo mode (no Supabase) → free', async () => {
    mockIsConfigured.mockReturnValue(false);
    expect(await getUserSubscription('u1')).toBe('free');
  });

  it('anonymous/blank user → free without querying', async () => {
    expect(await getUserSubscription('')).toBe('free');
    expect(await getUserSubscription('anonymous')).toBe('free');
    expect(mockSub).not.toHaveBeenCalled();
  });

  it('founder profile email → top tier even with NO subscription row', async () => {
    mockSub.mockResolvedValue({ data: null, error: null });
    mockProfile.mockResolvedValue({ data: { email: 'Gaurav@HoundShield.com' }, error: null });
    expect(await getUserSubscription('founder-id')).toBe('agency');
  });

  it('founder override beats a lower active subscription', async () => {
    mockSub.mockResolvedValue({ data: { tier: 'pro', status: 'active' }, error: null });
    mockProfile.mockResolvedValue({ data: { email: 'gaurav@houndshield.com' }, error: null });
    expect(await getUserSubscription('founder-id')).toBe('agency');
  });

  it('non-founder reads their real subscription tier', async () => {
    mockSub.mockResolvedValue({ data: { tier: 'growth', status: 'active' }, error: null });
    mockProfile.mockResolvedValue({ data: { email: 'jordan@vector.com' }, error: null });
    expect(await getUserSubscription('u2')).toBe('growth');
  });

  it('non-founder with no subscription row → free', async () => {
    mockSub.mockResolvedValue({ data: null, error: null });
    mockProfile.mockResolvedValue({ data: { email: 'rachel@clinic.com' }, error: null });
    expect(await getUserSubscription('u3')).toBe('free');
  });

  it('a failed profile lookup fails CLOSED (non-founder), never breaking the sub check', async () => {
    mockSub.mockResolvedValue({ data: { tier: 'pro', status: 'active' }, error: null });
    mockProfile.mockResolvedValue({ data: null, error: { code: '42P01' } });
    expect(await getUserSubscription('u4')).toBe('pro');
  });

  it('missing subscriptions table still returns free (migrations pending)', async () => {
    mockSub.mockResolvedValue({ data: null, error: { code: '42P01' } });
    mockProfile.mockResolvedValue({ data: null, error: null });
    expect(await getUserSubscription('u5')).toBe('free');
  });
});
