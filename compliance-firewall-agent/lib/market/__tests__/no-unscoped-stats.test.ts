import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

/**
 * Repo-wide guard against the specific failure that shipped: a Netskope figure
 * quoted without the denominator that makes it true, or — worse — attached to
 * the wrong one.
 *
 * The concrete incident: "43% of healthcare staff use personal genAI accounts
 * at work" appeared on the homepage chat context, in the Brain AI knowledge
 * graph, and in the cold outreach email. Netskope's 43% is the share of
 * organisations EXPERIMENTING WITH LOCAL GENAI INFRASTRUCTURE. The claim was
 * not a rounding error; it described a different thing entirely.
 *
 * These tests scan real source files rather than rendered output, because the
 * copy lives in half a dozen modules that no single page test covers.
 */

/** Source files that carry buyer-facing copy. Tests and the stats module itself are excluded. */
function copyFiles(): string[] {
  const out = execSync(
    `git ls-files 'app/**/*.ts' 'app/**/*.tsx' 'components/**/*.ts' 'components/**/*.tsx' 'lib/**/*.ts' 'lib/**/*.tsx'`,
    { encoding: 'utf8', cwd: process.cwd() },
  );
  return out
    .split('\n')
    .filter(Boolean)
    .filter((f) => !f.includes('__tests__'))
    .filter((f) => !f.startsWith('lib/market/'));
}

const FILES = copyFiles();

describe('no unscoped or misattributed market statistics in buyer-facing copy', () => {
  it('finds source files to scan (guard against a silently empty test)', () => {
    expect(FILES.length).toBeGreaterThan(50);
  });

  /**
   * The exact regression. 43% must never appear within the same sentence as
   * "personal", in any file, ever again.
   */
  it('never pairs 43% with personal accounts', () => {
    const offenders: string[] = [];

    /**
     * A sentence may legitimately mention both — to say 43% is NOT the
     * personal-account figure. That correction is the whole point of the note
     * in the knowledge graph, and banning it would delete the institutional
     * memory that stops the mistake recurring. So the rule is narrower than
     * "these two words never co-occur": it bans ASSERTING the association,
     * and permits explicitly DENYING it.
     */
    const DISCLAIMS = /\b(not|never|isn't|is not|rather than|nothing to do with)\s+(the\s+)?personal/i;

    for (const file of FILES) {
      const text = readFileSync(file, 'utf8');
      // Split on sentence-ish boundaries so a 43% far from "personal" is fine.
      for (const sentence of text.split(/(?<=[.!?])\s+|\n\n/)) {
        if (!/43%/.test(sentence) || !/personal/i.test(sentence)) continue;
        if (DISCLAIMS.test(sentence)) continue;
        offenders.push(`${file}: ${sentence.trim().slice(0, 140)}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('the disclaimer form is recognised, so the guard is not trivially satisfiable', () => {
    // Proves the exemption above matches the corrective phrasing we actually
    // ship, and does NOT match the assertion we are banning.
    const DISCLAIMS = /\b(not|never|isn't|is not|rather than|nothing to do with)\s+(the\s+)?personal/i;
    expect(DISCLAIMS.test('43% is local infrastructure, not personal accounts')).toBe(true);
    expect(DISCLAIMS.test('43% of healthcare staff use personal genAI accounts')).toBe(false);
  });

  /**
   * 89% and 81% are both correct and mean different things. Either may appear,
   * but never naked — the denominator must be within reach of the number.
   */
  it('never states 89% or 81% without a nearby denominator', () => {
    const offenders: string[] = [];
    const DENOMINATOR = /violation|genAI|generative ai|healthcare data|all industries|regulated data/i;

    for (const file of FILES) {
      const text = readFileSync(file, 'utf8');
      for (const pct of ['89%', '81%']) {
        let idx = text.indexOf(pct);
        while (idx !== -1) {
          // Look 160 chars either side — copy is often wrapped across lines.
          const window = text.slice(Math.max(0, idx - 160), idx + 160);
          if (!DENOMINATOR.test(window)) {
            offenders.push(`${file} (${pct}): …${window.replace(/\s+/g, ' ').slice(0, 140)}…`);
          }
          idx = text.indexOf(pct, idx + 1);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  /**
   * Any file quoting a Netskope figure should be traceable to the source
   * module or name the report, so a reader can check it. Buyers verify.
   */
  it('every file quoting a Netskope percentage names the source or imports it', () => {
    const offenders: string[] = [];
    for (const file of FILES) {
      const text = readFileSync(file, 'utf8');
      const quotes = /(89%|81%|71%|31%)/.test(text);
      if (!quotes) continue;
      const attributed =
        /Netskope/i.test(text) || /lib\/market\/netskope/.test(text) || /@\/lib\/market/.test(text);
      if (!attributed) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });
});
