import { describe, it, expect, afterEach } from 'vitest';
import {
  FOUNDER_TIER,
  founderEmails,
  isFounderEmail,
  resolveEffectiveTier,
} from '@/lib/billing/founder-access';
import { getEntitlements, FEATURE_LABELS, type FeatureKey } from '@/lib/billing/entitlements';
import { buildConsoleSections } from '@/lib/billing/console-sections';

afterEach(() => {
  delete process.env.FOUNDER_ACCESS_EMAILS;
});

describe('isFounderEmail — the founder always matches, nobody else does', () => {
  it('matches the canonical founder address', () => {
    expect(isFounderEmail('gaurav@houndshield.com')).toBe(true);
  });

  it('is case- and whitespace-insensitive (OAuth providers vary casing)', () => {
    expect(isFounderEmail('Gaurav@HoundShield.com')).toBe(true);
    expect(isFounderEmail('  GAURAV@HOUNDSHIELD.COM  ')).toBe(true);
  });

  it('rejects everyone else — including lookalikes', () => {
    expect(isFounderEmail('gaurav@houndshield.co')).toBe(false);
    expect(isFounderEmail('notgaurav@houndshield.com')).toBe(false);
    expect(isFounderEmail('gaurav@gmail.com')).toBe(false);
    expect(isFounderEmail('')).toBe(false);
    expect(isFounderEmail(null)).toBe(false);
    expect(isFounderEmail(undefined)).toBe(false);
  });

  it('can be extended (never replaced) via FOUNDER_ACCESS_EMAILS', () => {
    process.env.FOUNDER_ACCESS_EMAILS = ' Second@HoundShield.com , ,third@x.io';
    expect(isFounderEmail('second@houndshield.com')).toBe(true);
    expect(isFounderEmail('third@x.io')).toBe(true);
    // The canonical founder address survives any env configuration.
    expect(isFounderEmail('gaurav@houndshield.com')).toBe(true);
    expect(founderEmails()).toContain('gaurav@houndshield.com');
  });
});

describe('resolveEffectiveTier — founder gets the top tier, no payment required', () => {
  it('founder resolves to the top tier regardless of stored tier', () => {
    expect(resolveEffectiveTier('gaurav@houndshield.com', 'free')).toBe(FOUNDER_TIER);
    expect(resolveEffectiveTier('gaurav@houndshield.com', null)).toBe(FOUNDER_TIER);
    expect(resolveEffectiveTier('gaurav@houndshield.com', 'pro')).toBe(FOUNDER_TIER);
  });

  it('non-founders keep their stored tier untouched (free fallback)', () => {
    expect(resolveEffectiveTier('rachel@clinic.com', 'growth')).toBe('growth');
    expect(resolveEffectiveTier('rachel@clinic.com', null)).toBe('free');
    expect(resolveEffectiveTier(null, 'pro')).toBe('pro');
  });
});

describe('FOUNDER_TIER — provably unlocks every capability in the grid', () => {
  it('has every feature flag on', () => {
    const ent = getEntitlements(FOUNDER_TIER);
    for (const key of Object.keys(FEATURE_LABELS) as FeatureKey[]) {
      expect(ent.features[key], `founder tier must include ${key}`).toBe(true);
    }
  });

  it('projects onto a console with zero locked tiles', () => {
    const sections = buildConsoleSections(FOUNDER_TIER);
    expect(sections.locked).toEqual([]);
    expect(sections.isPaid).toBe(true);
    expect(sections.unlocked.length).toBeGreaterThan(0);
  });
});
