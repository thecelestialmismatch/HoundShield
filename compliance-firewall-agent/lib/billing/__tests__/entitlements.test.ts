import { describe, it, expect } from 'vitest';
import {
  ENTITLEMENTS,
  getEntitlements,
  normalizeTier,
  formatLimit,
  usagePercent,
  isNearingLimit,
  hasFeature,
  tierThatUnlocks,
  UNLIMITED,
  type TierSlug,
} from '../entitlements';

describe('normalizeTier', () => {
  it('passes through canonical slugs case-insensitively', () => {
    expect(normalizeTier('pro')).toBe('pro');
    expect(normalizeTier('GROWTH')).toBe('growth');
    expect(normalizeTier('  Enterprise ')).toBe('enterprise');
  });
  it('maps friendly aliases to a canonical tier (never silently to Free)', () => {
    expect(normalizeTier('max')).toBe('growth');
    expect(normalizeTier('starter')).toBe('pro');
    expect(normalizeTier('msp')).toBe('agency');
  });
  it('defaults unknown/empty to free', () => {
    expect(normalizeTier(null)).toBe('free');
    expect(normalizeTier('')).toBe('free');
    expect(normalizeTier('bogus')).toBe('free');
  });
});

describe('getEntitlements', () => {
  it('resolves a tier to its full grid', () => {
    const pro = getEntitlements('pro');
    expect(pro.name).toBe('Pro');
    expect(pro.gatewayScans).toBe(50_000);
    expect(pro.seats).toBe(10);
  });
  it('never throws on garbage input', () => {
    expect(() => getEntitlements(undefined)).not.toThrow();
    expect(getEntitlements('👻').tier).toBe('free');
  });
});

describe('the upgrade ladder is a strict superset (truthful upsell)', () => {
  const ladder: TierSlug[] = ['free', 'pro', 'growth', 'enterprise', 'agency'];
  it('every tier gets >= volume than the one below', () => {
    for (let i = 1; i < ladder.length; i++) {
      const lo = ENTITLEMENTS[ladder[i - 1]];
      const hi = ENTITLEMENTS[ladder[i]];
      expect(hi.gatewayScans).toBeGreaterThanOrEqual(lo.gatewayScans);
      expect(hi.brainQueries).toBeGreaterThanOrEqual(lo.brainQueries);
      expect(hi.seats).toBeGreaterThanOrEqual(lo.seats);
      expect(hi.retentionDays).toBeGreaterThanOrEqual(lo.retentionDays);
    }
  });
  it('every tier includes every feature the tier below has', () => {
    for (let i = 1; i < ladder.length; i++) {
      const lo = ENTITLEMENTS[ladder[i - 1]];
      const hi = ENTITLEMENTS[ladder[i]];
      for (const k of Object.keys(lo.features) as (keyof typeof lo.features)[]) {
        if (lo.features[k]) expect(hi.features[k]).toBe(true);
      }
    }
  });
  it('Growth Brain allotment is a big jump over Pro (the "20x" tier)', () => {
    expect(ENTITLEMENTS.growth.brainQueries).toBeGreaterThanOrEqual(
      ENTITLEMENTS.pro.brainQueries * 10,
    );
  });
  it('nextTier chains up the ladder and terminates', () => {
    expect(ENTITLEMENTS.free.nextTier).toBe('pro');
    expect(ENTITLEMENTS.growth.nextTier).toBe('enterprise');
    expect(ENTITLEMENTS.agency.nextTier).toBeNull();
  });
});

describe('formatLimit', () => {
  it('renders unlimited and thousands', () => {
    expect(formatLimit(UNLIMITED)).toBe('Unlimited');
    expect(formatLimit(50_000)).toBe('50,000');
    expect(formatLimit(0)).toBe('0');
  });
});

describe('usagePercent + isNearingLimit', () => {
  it('clamps to 0–100 and rounds', () => {
    expect(usagePercent(25, 100)).toBe(25);
    expect(usagePercent(999, 100)).toBe(100);
    expect(usagePercent(-5, 100)).toBe(0);
  });
  it('unlimited caps read as a healthy small fill, never near-limit', () => {
    expect(usagePercent(9_999_999, UNLIMITED)).toBe(4);
    expect(isNearingLimit(9_999_999, UNLIMITED)).toBe(false);
  });
  it('flags nearing the limit at 85%+', () => {
    expect(isNearingLimit(84, 100)).toBe(false);
    expect(isNearingLimit(90, 100)).toBe(true);
  });
});

describe('feature gating', () => {
  it('Pro lacks PDF reports; Growth unlocks them', () => {
    expect(hasFeature(getEntitlements('pro'), 'pdfReports')).toBe(false);
    expect(hasFeature(getEntitlements('growth'), 'pdfReports')).toBe(true);
  });
  it('tierThatUnlocks points at the lowest tier offering a capability', () => {
    expect(tierThatUnlocks('pdfReports')?.tier).toBe('growth');
    expect(tierThatUnlocks('onPrem')?.tier).toBe('enterprise');
    expect(tierThatUnlocks('aiGateway')?.tier).toBe('free');
  });
});
