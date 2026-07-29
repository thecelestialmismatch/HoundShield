import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  FOUNDER_TIER,
  founderEmails,
  isFounderAccessConfigured,
  isFounderEmail,
  resolveEffectiveTier,
} from '@/lib/billing/founder-access';
import { getEntitlements, FEATURE_LABELS, type FeatureKey } from '@/lib/billing/entitlements';
import { buildConsoleSections } from '@/lib/billing/console-sections';

/**
 * Founder access is env-only now — nothing personal is committed to this public
 * repo — so these tests must configure the identity they assert on.
 */
const FOUNDER = 'founder@houndshield.com';

beforeEach(() => {
  process.env.FOUNDER_EMAIL = FOUNDER;
});

afterEach(() => {
  delete process.env.FOUNDER_ACCESS_EMAILS;
  delete process.env.FOUNDER_EMAIL;
});

describe('isFounderEmail — the founder always matches, nobody else does', () => {
  it('matches the canonical founder address', () => {
    expect(isFounderEmail('founder@houndshield.com')).toBe(true);
  });

  it('is case- and whitespace-insensitive (OAuth providers vary casing)', () => {
    expect(isFounderEmail('founder@houndshield.com')).toBe(true);
    expect(isFounderEmail('  FOUNDER@HOUNDSHIELD.COM  ')).toBe(true);
  });

  it('rejects everyone else — including lookalikes', () => {
    expect(isFounderEmail('founder@houndshield.co')).toBe(false);
    expect(isFounderEmail('notfounder@houndshield.com')).toBe(false);
    expect(isFounderEmail('someone@gmail.com')).toBe(false);
    expect(isFounderEmail('')).toBe(false);
    expect(isFounderEmail(null)).toBe(false);
    expect(isFounderEmail(undefined)).toBe(false);
  });

  it('grants NOBODY the override when unconfigured — fail-closed', () => {
    // The security direction that matters: with no env set the list is empty, so
    // a missing variable cannot silently hand top-tier access to anyone.
    delete process.env.FOUNDER_EMAIL;
    expect(founderEmails()).toEqual([]);
    expect(isFounderEmail(FOUNDER)).toBe(false);
    expect(isFounderAccessConfigured()).toBe(false);
  });

  it('reports itself configured once env is set', () => {
    expect(isFounderAccessConfigured()).toBe(true);
  });

  it('can be extended (never replaced) via FOUNDER_ACCESS_EMAILS', () => {
    process.env.FOUNDER_ACCESS_EMAILS = ' Second@HoundShield.com , ,third@x.io';
    expect(isFounderEmail('second@houndshield.com')).toBe(true);
    expect(isFounderEmail('third@x.io')).toBe(true);
    // The configured founder address survives alongside the extra list.
    expect(isFounderEmail('founder@houndshield.com')).toBe(true);
    expect(founderEmails()).toContain('founder@houndshield.com');
  });
});

describe('resolveEffectiveTier — founder gets the top tier, no payment required', () => {
  it('founder resolves to the top tier regardless of stored tier', () => {
    expect(resolveEffectiveTier('founder@houndshield.com', 'free')).toBe(FOUNDER_TIER);
    expect(resolveEffectiveTier('founder@houndshield.com', null)).toBe(FOUNDER_TIER);
    expect(resolveEffectiveTier('founder@houndshield.com', 'pro')).toBe(FOUNDER_TIER);
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
