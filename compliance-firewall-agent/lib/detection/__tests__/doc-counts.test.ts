import { describe, it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { ENGINE_COUNT, PATTERN_COUNT } from '../engines'

const APP = join(__dirname, '..', '..', '..')
const REPO = join(APP, '..')

/* ──────────────────────────────────────────────────────────────────
 * Documentation count drift.
 *
 * engines.test.ts already stops a stale engine count appearing in
 * app/, components/ or lib/. Documentation was the one surface nobody
 * scanned — so while every code-facing claim stayed accurate, the docs
 * quietly rotted:
 *
 *   .claude/rules/stack.md  "16-pattern detector"  (really 53)
 *   .claude/rules/stack.md  "001-004 locally"      (really 001-030, applied)
 *   CLAUDE.md               "16 patterns"          (really 33)
 *   CLAUDE.md               "through 011"          (really through 030)
 *   .claude/rules/api.md    "minimum 16 patterns"  (really 33 / 53)
 *
 * That matters more here than in most repos: CLAUDE.md and .claude/rules
 * are the operating instructions every agent session reads first. A
 * wrong floor in api.md is a wrong floor enforced by whoever reads it —
 * "never reduce below 16" would have permitted deleting seventeen live
 * detection rules.
 *
 * Counts are computed from the shipped product, never hardcoded here.
 * ────────────────────────────────────────────────────────────────── */

const MIGRATION_COUNT = readdirSync(join(APP, 'supabase', 'migrations')).filter((f) =>
  f.endsWith('.sql'),
).length

/** Patterns actually exported by the proxy registry. */
const PROXY_PATTERN_COUNT = (
  readFileSync(join(REPO, 'proxy', 'patterns', 'index.ts'), 'utf8').match(
    /^\s*name:\s*"/gm,
  ) ?? []
).length

/**
 * The load-bearing docs — deliberately a short, explicit list.
 *
 * Scoping matters more than reach here. An earlier draft of this guard
 * scanned every tracked *.md and flagged "12 Agentic AI Harness Patterns"
 * and "19 patterns" from a React skill: real matches, zero relevance.
 * A guard that reports noise gets deleted, which is precisely how this
 * repo ended up with four gates that did nothing.
 *
 * These five are where a wrong count actually causes harm: CLAUDE.md and
 * .claude/rules are the operating instructions every agent session reads
 * first, and the proxy docs are what a customer reads before deploying.
 * Planning docs and changelogs are historical records — they should keep
 * saying what was true when written.
 */
const GUARDED_DOCS = [
  'CLAUDE.md',
  '.claude/rules/stack.md',
  '.claude/rules/api.md',
  // Added 2026-08-14. Both had drifted and neither was scanned:
  //   database.md  "migrations 001-004 applied"  (really 001-027 + 028/031/032)
  //   frontend.md  "Dark mode always ... never bg-white" for a landing page that
  //                has been LIGHT for months — app/layout.tsx has no `dark`
  //                class. An agent obeying it would repaint the live site.
  '.claude/rules/database.md',
  '.claude/rules/frontend.md',
  'proxy/README.md',
  'proxy/PATTERNS.md',
] as const

/** Only the guarded docs that are actually tracked by git. */
function trackedDocs(): string[] {
  const tracked = new Set(
    execFileSync('git', ['ls-files', '*.md'], { cwd: REPO, encoding: 'utf8' })
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean),
  )
  return GUARDED_DOCS.filter((f) => tracked.has(f))
}

describe('shipped counts are what the tests believe', () => {
  it('knows the real numbers', () => {
    expect(PROXY_PATTERN_COUNT).toBeGreaterThanOrEqual(33)
    expect(MIGRATION_COUNT).toBeGreaterThanOrEqual(30)
    expect(ENGINE_COUNT).toBe(16)
    expect(PATTERN_COUNT).toBeGreaterThanOrEqual(53)
  })
})

describe('docs state no stale pattern count', () => {
  it('no doc claims a pattern count that no registry produces', () => {
    /*
     * Matches "16 patterns", "16-pattern", "16 CMMC/HIPAA detection patterns".
     *
     * Deliberately does NOT match "16 engines" — that claim is correct and
     * guarded by engines.test.ts. And "pattern" is an overloaded word: this
     * repo also documents React patterns, recsys patterns and agentic
     * harness patterns, none of which are detection rules. The DETECTION
     * context check below is what keeps this guard from crying wolf and
     * being deleted, which is how the last set of dead guards died.
     */
    const CLAIM = /(\d+)[- ](?:[A-Za-z/]+ ){0,3}(?:detection )?patterns?\b/gi
    const DETECTION_CONTEXT = /CUI|CMMC|HIPAA|PHI|classifier|detection|scanner|proxy/i
    const valid = new Set([PROXY_PATTERN_COUNT, PATTERN_COUNT])
    const violations: string[] = []

    for (const rel of trackedDocs()) {
      const src = readFileSync(join(REPO, rel), 'utf8')
      for (const m of src.matchAll(CLAIM)) {
        const claimed = Number(m[1])
        // Ignore small numbers that are obviously prose ("2 patterns above").
        if (claimed < 10) continue
        // Only judge counts that are talking about OUR detection engine.
        const around = src.slice(Math.max(0, m.index! - 150), m.index! + 150)
        if (!DETECTION_CONTEXT.test(around)) continue
        if (!valid.has(claimed)) violations.push(`${rel}: "${m[0]}"`)
      }
    }

    expect(
      violations,
      `pattern counts must be ${PROXY_PATTERN_COUNT} (proxy) or ${PATTERN_COUNT} (app):\n${violations.join('\n')}`,
    ).toEqual([])
  })
})

describe('docs state no stale migration count', () => {
  it('no doc claims migrations only run "through" an old number', () => {
    /*
     * Catches "through 011 applied to prod" and "migrations through 004".
     * The real tell is a migration ordinal lower than what ships.
     */
    const CLAIM = /(?:through|up to)\s+0*(\d{1,3})\b/gi
    const violations: string[] = []

    for (const rel of trackedDocs()) {
      const src = readFileSync(join(REPO, rel), 'utf8')
      for (const m of src.matchAll(CLAIM)) {
        const claimed = Number(m[1])
        // Only migration-shaped ordinals; ignore years, percentages, prices.
        if (claimed > 999 || claimed === 0) continue
        if (!/migration/i.test(src.slice(Math.max(0, m.index! - 120), m.index! + 60))) continue
        if (claimed < MIGRATION_COUNT) violations.push(`${rel}: "${m[0]}" (ships ${MIGRATION_COUNT})`)
      }
    }

    expect(
      violations,
      `migration count is ${MIGRATION_COUNT}:\n${violations.join('\n')}`,
    ).toEqual([])
  })
})

describe('docs never claim every migration is applied', () => {
  it('no doc says a migration range is "all applied to prod"', () => {
    /*
     * .claude/rules/stack.md said "001-030, all applied to prod". Two things
     * were wrong and only one of them is a number: 029 and 030 have never been
     * applied, and unlike a stale count that claim tells a reader a TABLE
     * EXISTS when it does not — which is how you get code written against a
     * missing table.
     *
     * The sibling check above already catches a stale full-set claim
     * ("through 011"), so this deliberately does NOT re-check the range: an
     * earlier draft did, and flagged "Applied to production: 001-027, plus 028,
     * 031, 032" — legitimately partial and correct as written. Two overlapping
     * checks where one of them false-positives is worse than one that
     * discriminates; pushing the docs to round 027 up would have made them lie.
     */
    const violations = trackedDocs().flatMap((rel) =>
      readFileSync(join(REPO, rel), 'utf8')
        .split('\n')
        .filter((line) => /migration/i.test(line) && /all applied to prod/i.test(line))
        .map((line) => `${rel}: "${line.trim()}" — name the unapplied ones`),
    )

    expect(violations, violations.join('\n')).toEqual([])
  })
})

describe('the frontend rulebook matches the theme that ships', () => {
  it('does not order dark mode for a landing page that renders light', () => {
    /*
     * frontend.md said "Homepage bg: bg-[#07070b] — never bg-white" and "Dark
     * mode always: <html className='dark scroll-smooth'>". app/layout.tsx has
     * carried no `dark` class for months. These files are instructions, so the
     * drift was not cosmetic: the next agent to read it would have repainted
     * the live marketing site.
     *
     * Asserted against the LAYOUT rather than against a copy of the rule, so
     * the day the app genuinely goes dark this flips on its own instead of
     * pinning a stale answer.
     */
    const layout = readFileSync(join(APP, 'app', 'layout.tsx'), 'utf8')
    const htmlTag = layout.match(/<html[\s\S]*?>/)?.[0] ?? ''
    const shipsDark = /className=[^>]*\bdark\b/.test(htmlTag)

    // Blockquote lines are the correction note, which QUOTES the old rule in
    // order to retire it. Reading them would make the note look like the
    // directive — the same trap that made the CSP guard diff comment prose and
    // the accessibility guard read a disclaimer as a claim. Judge what the file
    // INSTRUCTS, which is everything outside the quote.
    const rules = readFileSync(join(REPO, '.claude', 'rules', 'frontend.md'), 'utf8')
    const directives = rules
      .split('\n')
      .filter((line) => !line.trimStart().startsWith('>'))
      .join('\n')
    const ordersDarkAlways = /Dark mode always/i.test(directives)

    expect(
      ordersDarkAlways,
      shipsDark
        ? 'app ships dark but frontend.md no longer says so'
        : 'frontend.md orders "Dark mode always" while app/layout.tsx has no dark class',
    ).toBe(shipsDark)
  })
})

describe('the agent rulebook states an accurate floor', () => {
  it('api.md does not authorise reducing below the real pattern count', () => {
    /*
     * This line is an instruction, not a description. It said "minimum 16
     * patterns — never reduce" while 33 shipped, which read as permission
     * to delete seventeen of them.
     */
    const src = readFileSync(join(REPO, '.claude', 'rules', 'api.md'), 'utf8')
    const line = src.split('\n').find((l) => /minimum.*pattern/i.test(l))

    expect(line, 'api.md lost its pattern-floor rule').toBeTruthy()
    const numbers = (line!.match(/\d+/g) ?? []).map(Number)
    expect(numbers).toContain(PROXY_PATTERN_COUNT)
    expect(Math.min(...numbers)).toBeGreaterThanOrEqual(PROXY_PATTERN_COUNT)
  })
})
