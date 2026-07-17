/**
 * Stripe API version single-source contract.
 *
 * The 2026-07-16 dependabot breakage (stripe 20→22) failed tsc in five routes
 * at once because each hardcoded its own apiVersion string. The pin now lives
 * in exactly one place — lib/stripe/api-version.ts — and this test makes the
 * consolidation permanent:
 *
 *   1. STRIPE_API_VERSION has the release shape Stripe uses (date.codename).
 *   2. No source file outside api-version.ts carries a quoted apiVersion.
 *   3. Every `new Stripe(` construction site references the shared constant,
 *      so a sixth client can't ship with its own (or a missing) pin.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { STRIPE_API_VERSION } from '@/lib/stripe/api-version';

const APP_ROOT = path.resolve(__dirname, '../../..');
const SCAN_DIRS = ['app', 'lib', 'components'];
const SKIP_DIRS = new Set(['node_modules', '.next', '__tests__', '__mocks__']);
const CANONICAL_FILE = path.join('lib', 'stripe', 'api-version.ts');

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(path.join(dir, entry.name), out);
    } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.(test|spec)\.tsx?$/.test(entry.name)) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

const sourceFiles = SCAN_DIRS.flatMap((d) => {
  const abs = path.join(APP_ROOT, d);
  return fs.existsSync(abs) ? walk(abs) : [];
});

describe('Stripe API version — single-source contract', () => {
  it('scans a real tree (sanity: the five known client routes are present)', () => {
    const names = sourceFiles.map((f) => path.relative(APP_ROOT, f));
    expect(names).toContain(path.join('app', 'api', 'stripe', 'webhook', 'route.ts'));
    expect(names).toContain(path.join('app', 'api', 'stripe', 'checkout', 'route.ts'));
    expect(names.length).toBeGreaterThan(100);
  });

  it('the pinned version has the Stripe release shape', () => {
    expect(STRIPE_API_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}\.[a-z]+$/);
  });

  it('no source file outside api-version.ts hardcodes a quoted apiVersion', () => {
    const offenders = sourceFiles.filter((file) => {
      if (path.relative(APP_ROOT, file) === CANONICAL_FILE) return false;
      const src = fs.readFileSync(file, 'utf8');
      return /apiVersion\s*:\s*['"`]/.test(src);
    });
    expect(offenders.map((f) => path.relative(APP_ROOT, f))).toEqual([]);
  });

  it('every `new Stripe(` construction site uses the shared constant', () => {
    const clientSites = sourceFiles.filter((file) =>
      /new Stripe\(/.test(fs.readFileSync(file, 'utf8'))
    );
    // If this ever reads 0 the scan is broken, not the codebase clean.
    expect(clientSites.length).toBeGreaterThanOrEqual(5);
    const missingPin = clientSites.filter(
      (file) => !fs.readFileSync(file, 'utf8').includes('STRIPE_API_VERSION')
    );
    expect(missingPin.map((f) => path.relative(APP_ROOT, f))).toEqual([]);
  });
});
