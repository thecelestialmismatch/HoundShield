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
import Stripe from 'stripe';
import { STRIPE_API_VERSION, REVIEWED_API_VERSION } from '@/lib/stripe/api-version';

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
  it('scans a real tree (sanity: the known client routes are present)', () => {
    const names = sourceFiles.map((f) => path.relative(APP_ROOT, f));
    expect(names).toContain(path.join('app', 'api', 'stripe', 'webhook', 'route.ts'));
    // The canonical revenue route. (The old subscription `stripe/checkout` route
    // was removed once /pricing collapsed to the single $499 offer — it had no
    // caller and sold tiers the site no longer lists.)
    expect(names).toContain(path.join('app', 'api', 'stripe', 'report-checkout', 'route.ts'));
    expect(names.length).toBeGreaterThan(100);
  });

  it('the pinned version has the Stripe release shape', () => {
    expect(STRIPE_API_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}\.[a-z]+$/);
  });

  it('tracks the installed SDK rather than a hand-written literal', () => {
    // The property that makes a dependabot stripe bump a green PR instead of
    // `TS2322` at the bottom of a build log. If someone re-hardcodes the
    // string, this is where it is caught.
    expect(STRIPE_API_VERSION).toBe(Stripe.API_VERSION);
  });

  it('the SDK has not moved past the reviewed API version', () => {
    // THE TRIPWIRE, relocated from tsc so its failure is readable.
    //
    // When this fails, a stripe SDK bump changed the API version this
    // integration talks to. That is a real thing to look at — Stripe moved
    // `invoice.subscription` to `invoice.parent.subscription_details
    // .subscription` in 2025-04-30.basil and silently killed two webhook
    // handlers. To clear it:
    //   1. Read https://docs.stripe.com/changelog for every version between
    //      REVIEWED_API_VERSION and Stripe.API_VERSION.
    //   2. Confirm nothing this integration reads has moved. The surfaces are
    //      checkout.sessions (list + the webhook payload), subscriptions,
    //      and invoices — see app/api/stripe/**.
    //   3. Set REVIEWED_API_VERSION in lib/stripe/api-version.ts to
    //      Stripe.API_VERSION's current value, in the same PR as the bump.
    // Nothing about production is broken while this is red: the wire version
    // is the SDK's either way. It is a review gate, not an outage.
    expect(
      `${REVIEWED_API_VERSION} (reviewed) vs ${Stripe.API_VERSION} (installed SDK)`,
    ).toBe(`${Stripe.API_VERSION} (reviewed) vs ${Stripe.API_VERSION} (installed SDK)`);
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
    // Four sites since the orphaned subscription checkout route was removed.
    expect(clientSites.length).toBeGreaterThanOrEqual(4);
    const missingPin = clientSites.filter(
      (file) => !fs.readFileSync(file, 'utf8').includes('STRIPE_API_VERSION')
    );
    expect(missingPin.map((f) => path.relative(APP_ROOT, f))).toEqual([]);
  });
});
