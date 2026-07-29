/**
 * Single-offer contract — enforced on the API SURFACE, not just the page.
 *
 * `/pricing` collapsed to the one $499 offer, and a render test guards the page
 * (app/pricing/__tests__/pricing-single-offer.test.tsx). But the doctrine was
 * only ever half-enforced: `app/api/stripe/checkout/route.ts` survived that
 * collapse as a live POST endpoint that created $199 / $499-mo / $999 / $2,499
 * subscriptions — tiers the site no longer lists — with a 14-day trial. It had
 * ZERO callers anywhere in the repo, not even a test, so nothing failed when the
 * tiers were deleted from the page. A green page test proved nothing about it.
 *
 * That is the 2026-07-22 lesson inverted: there, a tested backend had no caller
 * and the funnel was dead; here, an untested backend had no caller and the
 * pricing rule was quietly false. Both are found the same way — by asking
 * whether anything actually reaches the route.
 *
 * These are source-level scans on purpose: they fail if the route is
 * reintroduced, which a runtime test on a deleted file cannot do.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const APP_ROOT = path.resolve(__dirname, '../../../..');
const STRIPE_ROUTES = path.join(APP_ROOT, 'app', 'api', 'stripe');

describe('Stripe API surface — one offer, no orphaned subscription rail', () => {
  it('exposes no subscription-creating checkout route', () => {
    // /api/stripe/portal stays: it MANAGES existing subscriptions (two real
    // callers) rather than selling new ones. Selling is the rule being enforced.
    expect(fs.existsSync(path.join(STRIPE_ROUTES, 'checkout'))).toBe(false);
  });

  it('keeps the $499 report route as the only checkout rail', () => {
    const routes = fs
      .readdirSync(STRIPE_ROUTES, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith('__'))
      .map((e) => e.name)
      .sort();
    expect(routes).toEqual(['portal', 'report-checkout', 'webhook']);
  });

  it("no Stripe route creates a subscription-mode Checkout Session", () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!entry.name.startsWith('__')) walk(full);
        } else if (entry.name === 'route.ts') {
          const src = fs.readFileSync(full, 'utf8');
          // `mode: 'subscription'` is how a recurring plan gets sold.
          if (/mode:\s*['"`]subscription['"`]/.test(src)) {
            offenders.push(path.relative(APP_ROOT, full));
          }
        }
      }
    };
    walk(STRIPE_ROUTES);
    expect(offenders).toEqual([]);
  });
});
