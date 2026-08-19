/**
 * Partner-offer coherence guard.
 *
 * THE DEFECT THIS LOCKS DOWN. Three public numbers answered "what do I make?":
 * "20% revenue share" and "$299 wholesale" on a $499 report (a 40% cut) on the
 * SAME /partners page, plus a third figure in `CLAUDE.md` — 40–50% — matching
 * neither. `docs/gtm/MSP-CHANNEL-RESEARCH.md` flagged it as a blocking
 * inconsistency and deliberately left the margin call to the founder.
 *
 * Founder ruling (2026-08-19): retail pays $499, partners pay $399 — a FLAT
 * $100 discount, modelled in dollars rather than as a percentage. A percentage
 * forces a rounding call on every price ($499 × 0.80 = $399.20) and whichever
 * way it rounds, the realised cut misses the published figure. Dollars are
 * exact, so there is nothing left to drift.
 *
 * No money ever leaves: the $100 is a discount, not a payout. A revenue-share
 * model would mean collecting $499 and owing $100 back, with the tracking and
 * payout machinery that implies. Here the $100 simply never arrives.
 *
 * Retail stays $499 and NOT $500. The sub-$500 figure is load-bearing: it keeps
 * a purchase under the common $500 procurement-approval threshold, which is the
 * report's whole positioning ("a $499 PO bypasses procurement review"), and it
 * keeps the live Stripe price (unit_amount 49900) matching the site.
 *
 * These are source-level scans on purpose: a rendering test cannot fail when a
 * stale number reappears in a doc, an email template, or a page that no test
 * renders — which is exactly how "40–50%" survived.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  PARTNER_DISCOUNT_USD,
  PARTNER_DISCOUNT_LABEL,
  PARTNER_DISCOUNT_PCT,
  RISK_REPORT,
  RISK_REPORT_WHOLESALE_CENTS,
  RISK_REPORT_RETAIL_CENTS,
  partnerMarginPct,
} from '../plans';

const APP_ROOT = path.resolve(__dirname, '../../..');
const REPO_ROOT = path.resolve(APP_ROOT, '..');

/** Every surface that quotes partner economics to a human. */
const PARTNER_SURFACES = [
  'app/partners/page.tsx',
  'app/partners/kit/page.tsx',
  'app/partners/apply/page.tsx',
  'app/partners/apply/PartnerApplyForm.tsx',
  'lib/email/outreach.ts',
  'lib/email/templates/contact-received.ts',
];

describe('partner offer — one revenue share, one wholesale price', () => {
  it('prices retail at $499 and partners at $399', () => {
    expect(RISK_REPORT.oneTimePrice).toBe(499);
    expect(RISK_REPORT.wholesalePrice).toBe(399);
  });

  it('derives wholesale from the discount so the two cannot disagree', () => {
    expect(PARTNER_DISCOUNT_USD).toBe(100);
    expect(RISK_REPORT.wholesalePrice).toBe(RISK_REPORT.oneTimePrice - PARTNER_DISCOUNT_USD);
    expect(PARTNER_DISCOUNT_LABEL).toBe('$100 off');
    expect(PARTNER_DISCOUNT_PCT).toBe(20);
  });

  it('keeps retail at $499 — never $500, never lower', () => {
    // Below $499 drops the value anchor. AT $500 the purchase crosses the common
    // procurement-approval threshold the whole product is positioned under, and
    // stops matching the live Stripe price (unit_amount 49900).
    expect(RISK_REPORT.oneTimePrice).toBe(499);
    expect(RISK_REPORT.oneTimePrice).toBeLessThan(500);
  });

  it('leaves the partner a real margin at their own retail', () => {
    expect(partnerMarginPct(RISK_REPORT.resaleLow)).toBe(20);
    // Kitecyber via docs/gtm/MSP-CHANNEL-RESEARCH.md: MSPs target 60–70% gross
    // margin on managed DLP. The resale ceiling reaches the bottom of that band.
    expect(partnerMarginPct(RISK_REPORT.resaleHigh)).toBe(60);
  });

  it('exposes cents that match the dollar figures Stripe will charge', () => {
    // The checkout route and the webhook both import these. A drift here means a
    // card charged a different amount than the page advertised.
    expect(RISK_REPORT_WHOLESALE_CENTS).toBe(39900);
    expect(RISK_REPORT_RETAIL_CENTS).toBe(49900);
  });

  it('never resurrects the 40–50% figure anywhere in the repo', () => {
    const offenders: string[] = [];
    const skip = new Set(['node_modules', '.next', '.git', 'coverage', 'dist']);
    // Dated audit archives are written history and are read as records, not as
    // instructions — they legitimately quote the number that was wrong then.
    const ARCHIVES = /(AUDIT-\d|VALIDATION-\d|PRE-LAUNCH-AUDIT|LIVE-PRODUCTION-AUDIT|lessons\.md|todo\.md|MSP-CHANNEL-RESEARCH)/;
    // "40-50%" in an unrelated domain (carrier bid weighting, code-quality docs)
    // is not this claim. Only flag it when it is talking about OUR revenue share.
    const CLAIM = /40[-–]50\s*%\s*(revenue\s*share|rev[- ]?share)/i;

    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (skip.has(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (/\.(ts|tsx|md)$/.test(entry.name) && !ARCHIVES.test(entry.name)) {
          if (CLAIM.test(fs.readFileSync(full, 'utf8'))) {
            offenders.push(path.relative(REPO_ROOT, full));
          }
        }
      }
    };
    walk(REPO_ROOT);
    expect(offenders).toEqual([]);
  });

  it('quotes only the canonical wholesale price on every partner surface', () => {
    const wrongPrices: string[] = [];
    // Any other $NNN in the low hundreds on a partner page is a stale wholesale
    // quote — $299 above all, plus every intermediate figure this ruling passed
    // through while it was being settled.
    const STALE = /\$(199|249|299|300|349|400|449)\b/;
    for (const rel of PARTNER_SURFACES) {
      const full = path.join(APP_ROOT, rel);
      if (!fs.existsSync(full)) continue;
      const src = fs.readFileSync(full, 'utf8');
      if (STALE.test(src)) wrongPrices.push(rel);
    }
    expect(wrongPrices).toEqual([]);
  });
});
