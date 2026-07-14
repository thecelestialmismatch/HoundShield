import { describe, it, expect } from 'vitest';
import {
  buildConsoleSections,
  CONSOLE_UPGRADE_HREF,
} from '../console-sections';

/**
 * The console grid is a pure projection of the entitlements ladder. These tests
 * pin the "restricted (free) vs. everything (paid)" contract so the dashboard,
 * pricing page and any future server enforcement can never drift.
 */
describe('buildConsoleSections', () => {
  it('marks Free as restricted (not paid) with the Free plan name', () => {
    const s = buildConsoleSections('free');
    expect(s.isPaid).toBe(false);
    expect(s.planName).toBe('Free');
    expect(s.tier).toBe('free');
  });

  it('gives Free the AI gateway but locks the paid evidence capabilities', () => {
    const s = buildConsoleSections('free');
    const unlockedKeys = s.unlocked.map((t) => t.key);
    const lockedKeys = s.locked.map((t) => t.key);

    expect(unlockedKeys).toContain('aiGateway'); // free tier includes the gateway
    expect(lockedKeys).toContain('pdfReports');
    expect(lockedKeys).toContain('auditExport');
    expect(lockedKeys).toContain('c3paoCoordination');
  });

  it('labels each locked capability with the lowest tier that unlocks it', () => {
    const s = buildConsoleSections('free');
    const byKey = Object.fromEntries(s.locked.map((t) => [t.key, t]));
    expect(byKey.auditExport.availableOnName).toBe('Pro');
    expect(byKey.pdfReports.availableOnName).toBe('Growth');
    expect(byKey.hitlQuarantine.availableOnName).toBe('Enterprise');
  });

  it('prices every locked capability truthfully from the entitlements grid', () => {
    const s = buildConsoleSections('free');
    const byKey = Object.fromEntries(s.locked.map((t) => [t.key, t]));
    expect(byKey.auditExport.availableOnPriceMonthly).toBe(199); // Pro
    expect(byKey.pdfReports.availableOnPriceMonthly).toBe(499); // Growth
    expect(byKey.hitlQuarantine.availableOnPriceMonthly).toBe(999); // Enterprise
    // Every locked tile carries a price (no tier in the grid is price-less).
    for (const tile of s.locked) {
      expect(typeof tile.availableOnPriceMonthly).toBe('number');
    }
  });

  it('points every locked/upgrade CTA at /pricing (the $499 report funnel)', () => {
    const s = buildConsoleSections('free');
    expect(s.upgradeHref).toBe('/pricing');
    expect(CONSOLE_UPGRADE_HREF).toBe('/pricing');
    for (const tile of s.locked) {
      expect(tile.upgradeHref).toBe('/pricing');
      expect(tile.href).toBe('/pricing');
    }
  });

  it('routes every UNLOCKED tile into the command center, never /pricing', () => {
    const s = buildConsoleSections('enterprise');
    expect(s.unlocked.length).toBeGreaterThan(0);
    for (const tile of s.unlocked) {
      expect(tile.href.startsWith('/command-center')).toBe(true);
    }
  });

  it('unlocks PDF reports + C3PAO on Growth, still locks Enterprise-only capabilities', () => {
    const s = buildConsoleSections('growth');
    expect(s.isPaid).toBe(true);
    const unlockedKeys = s.unlocked.map((t) => t.key);
    const lockedKeys = s.locked.map((t) => t.key);
    expect(unlockedKeys).toContain('pdfReports');
    expect(unlockedKeys).toContain('c3paoCoordination');
    expect(lockedKeys).toContain('hitlQuarantine');
    expect(lockedKeys).toContain('onPrem');
  });

  it('unlocks Pro capabilities but keeps Growth-only ones locked', () => {
    const s = buildConsoleSections('pro');
    const unlockedKeys = s.unlocked.map((t) => t.key);
    const lockedKeys = s.locked.map((t) => t.key);
    expect(unlockedKeys).toEqual(
      expect.arrayContaining(['aiGateway', 'slackAlerts', 'apiAccess', 'auditExport']),
    );
    expect(lockedKeys).toContain('pdfReports');
  });

  it('leaves Enterprise and Agency with nothing locked (full superset)', () => {
    expect(buildConsoleSections('enterprise').locked).toHaveLength(0);
    expect(buildConsoleSections('agency').locked).toHaveLength(0);
  });

  it('never drops a capability — unlocked + locked always covers the full grid', () => {
    for (const tier of ['free', 'pro', 'growth', 'enterprise', 'agency']) {
      const s = buildConsoleSections(tier);
      expect(s.unlocked.length + s.locked.length).toBe(11);
    }
  });

  it('resolves marketing aliases and falls back to Free for unknown tiers', () => {
    expect(buildConsoleSections('starter').tier).toBe('pro'); // alias
    expect(buildConsoleSections('MSP').tier).toBe('agency'); // case + alias
    expect(buildConsoleSections('nonsense').tier).toBe('free');
    expect(buildConsoleSections(null).tier).toBe('free');
    expect(buildConsoleSections(undefined).tier).toBe('free');
  });
});
