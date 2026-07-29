import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ENGINE_COUNT, PATTERN_COUNT } from '@/lib/detection/engines';

/**
 * SOURCE-LEVEL contract for email identity.
 *
 * Why source-level and not behavioural: the bug this prevents was four routes
 * each hardcoding their own founder-inbox fallback, and two of them disagreeing
 * (contact@ for the $499 sale alert, info@ for the RPO/MSP partner application).
 * A runtime test cannot catch that — it would have to exercise every route with
 * every env permutation, and it would pass happily on a route no caller reaches.
 * The invariant is about what the SOURCE says, so the test reads the source.
 *
 * Same reasoning as `single-offer-api-surface.test.ts` (2026-07-29 lesson: a
 * page-level rule is not enforced until it is enforced on the API surface).
 */

const APP_DIR = join(process.cwd(), 'app');
const LIB_DIR = join(process.cwd(), 'lib');

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules' || entry === '__tests__') continue;
      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

const SOURCE_FILES = [...walk(APP_DIR), ...walk(LIB_DIR)];
const IDENTITY_MODULE = join(LIB_DIR, 'email', 'identity.ts');

function read(f: string): string {
  return readFileSync(f, 'utf8');
}

describe('the founder inbox is resolved in exactly one place', () => {
  it('only identity.ts reads FOUNDER_EMAIL', () => {
    const offenders = SOURCE_FILES.filter(
      (f) => f !== IDENTITY_MODULE && /process\.env\.FOUNDER_EMAIL/.test(read(f)),
    );
    expect(
      offenders.map((f) => f.replace(process.cwd(), '')),
      'FOUNDER_EMAIL must only be read by lib/email/identity.ts — import founderInbox() instead',
    ).toEqual([]);
  });

  it('no file hardcodes an inbox fallback next to FOUNDER_EMAIL', () => {
    // The exact shape of the original bug: `process.env.FOUNDER_EMAIL || "contact@…"`
    const offenders = SOURCE_FILES.filter((f) =>
      /FOUNDER_EMAIL\s*(\?\?|\|\|)\s*['"`]/.test(read(f)),
    );
    expect(offenders.map((f) => f.replace(process.cwd(), ''))).toEqual([]);
  });

  it('only identity.ts defines a houndshield.com mailbox literal', () => {
    // Marketing/contact PAGES may print the published address; API routes and lib
    // modules must not invent one.
    const allowed = new Set<string>([
      IDENTITY_MODULE,
      join(APP_DIR, 'contact', 'page.tsx'), // published contact details
      join(APP_DIR, 'partners', 'apply', 'PartnerApplyForm.tsx'), // published fallback
    ]);
    const offenders = SOURCE_FILES.filter((f) => {
      if (allowed.has(f)) return false;
      if (f.startsWith(join(LIB_DIR, 'brain-ai'))) return false; // FAQ answer text
      return /(contact|info|noreply|gaurav)@houndshield\.com/i.test(read(f));
    });
    expect(
      offenders.map((f) => f.replace(process.cwd(), '')),
      'import the address from lib/email/identity instead of writing the literal',
    ).toEqual([]);
  });

  it('the four human-actionable routes all import founderInbox', () => {
    const routes = [
      join(APP_DIR, 'api', 'stripe', 'webhook', 'route.ts'),
      join(APP_DIR, 'api', 'contact', 'route.ts'),
      join(APP_DIR, 'api', 'report', 'snapshot-lead', 'route.ts'),
      join(APP_DIR, 'api', 'partners', 'apply', 'route.ts'),
    ];
    for (const r of routes) {
      const src = read(r);
      expect(src, `${r} must resolve its recipient through founderInbox()`).toMatch(
        /founderInbox/,
      );
      expect(src).toMatch(/@\/lib\/email\/identity/);
    }
  });

  it('no email template hardcodes its own From header', () => {
    const templates = walk(join(LIB_DIR, 'email', 'templates'));
    expect(templates.length).toBeGreaterThan(0);
    for (const t of templates) {
      const src = read(t);
      expect(src, `${t} must build its From via transactionalFrom()`).not.toMatch(
        /const FROM = ['"`]/,
      );
    }
  });
});

describe('a published address is never the routing address', () => {
  it('routes hand the generic inbox to the browser, not founderInbox()', () => {
    // Setting FOUNDER_EMAIL to a private mailbox must not leak it to visitors.
    for (const r of [
      join(APP_DIR, 'api', 'contact', 'route.ts'),
      join(APP_DIR, 'api', 'report', 'snapshot-lead', 'route.ts'),
    ]) {
      const src = read(r);
      const fallbackLine = src
        .split('\n')
        .find((l) => l.includes('fallbackEmail'));
      expect(fallbackLine, `${r} should return a fallbackEmail`).toBeTruthy();
      expect(fallbackLine, `${r} must publish GENERAL_INBOX, not the routing address`).toMatch(
        /GENERAL_INBOX/,
      );
    }
  });
});

describe('/demo tells the truth about the product', () => {
  const demo = read(join(APP_DIR, 'demo', 'page.tsx'));

  it('does not sell a subscription tier that /pricing no longer lists', () => {
    // "HoundShield Pro" was removed from /pricing in #243; the demo kept pitching
    // it (and pointing "Get Full Protection" at /auth) for months afterwards.
    expect(demo).not.toMatch(/HoundShield Pro/);
  });

  it('does not claim SOC 2, which has not been started', () => {
    expect(demo).not.toMatch(/SOC\s?2/i);
  });

  it('does not claim AI models it does not use', () => {
    // The scan path is local regex — that is the moat. Claiming "13 AI models"
    // both invents a capability and contradicts the local-only architecture.
    expect(demo).not.toMatch(/\d+\s+AI models/i);
  });

  it('quotes the engine and pattern counts that engines.ts computes', () => {
    // Hardcoded in the page on purpose: importing engines.ts would pull all 90
    // pattern regexes into this client bundle. This assertion is what keeps the
    // literal honest, so a 17th engine fails here instead of shipping a lie.
    expect(ENGINE_COUNT).toBe(16);
    expect(PATTERN_COUNT).toBe(90);
    expect(demo).toContain(`${ENGINE_COUNT} detection engines`);
    expect(demo).toContain(`${PATTERN_COUNT} patterns`);
  });

  it('funnels to the one purchasable offer', () => {
    expect(demo).toContain('$499');
    expect(demo).toContain('/assessment');
  });
});
