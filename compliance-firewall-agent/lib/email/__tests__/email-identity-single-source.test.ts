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

/** Any mailbox literal on the product domain. */
const MAILBOX_RE = /[a-z0-9._%+-]+@houndshield\.com/i;

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

  it('no API route or lib module hardcodes a mailbox literal', () => {
    // Code paths must resolve addresses through identity.ts. Published PAGES are
    // handled by the next test — they legitimately print a contact address.
    const codePaths = SOURCE_FILES.filter(
      (f) =>
        f !== IDENTITY_MODULE &&
        !f.startsWith(join(LIB_DIR, 'brain-ai')) && // FAQ answer prose
        (f.startsWith(join(APP_DIR, 'api')) || f.startsWith(LIB_DIR)),
    );
    const offenders = codePaths.filter((f) => MAILBOX_RE.test(read(f)));
    expect(
      offenders.map((f) => f.replace(process.cwd(), '')),
      'import the address from lib/email/identity instead of writing the literal',
    ).toEqual([]);
  });

  it('pages only ever publish a GENERIC mailbox, never a personal one', () => {
    // Legal and marketing pages must print a contact address — security.txt is
    // required to. What they must never print is an individual's mailbox, which
    // is why founder identity is env-only and this asserts the whole surface.
    const GENERIC = new Set([
      'contact', 'info', 'noreply', 'no-reply', 'support', 'security',
      'privacy', 'legal', 'dpa', 'abuse', 'partners', 'sales', 'hello',
    ]);
    const violations: string[] = [];
    for (const f of SOURCE_FILES) {
      for (const m of read(f).matchAll(new RegExp(MAILBOX_RE.source, 'gi'))) {
        const local = m[0].split('@')[0].toLowerCase();
        if (!GENERIC.has(local)) {
          violations.push(`${f.replace(process.cwd(), '')} → ${local}@`);
        }
      }
    }
    expect(
      violations,
      'a non-generic mailbox literal looks like a personal address; put it in FOUNDER_EMAIL instead',
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
    /*
     * UPDATE 2026-08-20: /demo now IMPORTS these from engines.ts rather than
     * hardcoding them, and is a server component, so the bundle concern this
     * comment used to describe no longer applies. The assertion is kept and
     * broadened below — it now accepts either the literal or the interpolation,
     * because what matters is that the page cannot state a number the product
     * does not produce, however it renders it.
     *
     * It previously asserted `PATTERN_COUNT === 90` — and did its job
     * perfectly, right up to the point where the number itself was wrong.
     * engines.ts summed BUILTIN + CMMC + HIPAA while BUILTIN already contained
     * the other two, so 53 real patterns were published as 90 here, on the
     * homepage stat row, and in the detection-engines card. The literal 90 in
     * this file is what made the inflated figure look deliberate.
     *
     * Only ENGINE_COUNT keeps a hardcoded expectation now: it is a curated
     * list a human maintains. The pattern count is derived, so pinning a
     * second copy of it here just creates another thing to be wrong.
     */
    expect(ENGINE_COUNT).toBe(16);
    const statesEngines =
      demo.includes(`${ENGINE_COUNT} detection engines`) ||
      demo.includes("{ENGINE_COUNT} detection engines");
    const statesPatterns =
      demo.includes(`${PATTERN_COUNT} patterns`) ||
      demo.includes("{PATTERN_COUNT} patterns") ||
      demo.includes("{PATTERN_COUNT} detection patterns");
    expect(statesEngines, "/demo must state the engine count from engines.ts").toBe(true);
    expect(statesPatterns, "/demo must state the pattern count from engines.ts").toBe(true);
    // Whichever form it uses, a WRONG literal must still fail. engines.test.ts
    // owns that check across every surface; assert here that /demo carries no
    // stale hardcoded count of its own.
    //
    // Comments stripped first: the page's own header comment explains the "90
    // local patterns" bug it was written to fix, and naming the bug must not
    // trip the check that exists because of it.
    const demoCode = demo
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
    expect(demoCode).not.toMatch(/\b(?:90|9)\s+(?:local |shipped |detection )?patterns?\b/);
  });

  it('funnels to the one purchasable offer', () => {
    expect(demo).toContain('$499');
    expect(demo).toContain('/assessment');
  });
});
