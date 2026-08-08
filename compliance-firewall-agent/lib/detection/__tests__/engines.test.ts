import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { ENGINES, ENGINE_COUNT, PATTERN_COUNT } from '../engines'
import { BUILTIN_PATTERNS } from '@/lib/classifier/patterns'
import { CMMC_PATTERNS } from '@/lib/classifier/cmmc-patterns'
import { HIPAA_PATTERNS } from '@/lib/classifier/hipaa-patterns'

/* ──────────────────────────────────────────────────────────────────
 * Detection-count contract.
 *
 * The site advertises "16 detection engines" on four pages. That claim
 * was previously a hardcoded string while the real list lived in a
 * component — correct at the time, but free to drift. These tests make
 * the marketing number a property of the shipped code.
 *
 * NEVER-DO (CLAUDE.md): publish fictional metrics. A number on the site
 * that no array in the repo produces is exactly that, even when the
 * error is in our favour.
 * ────────────────────────────────────────────────────────────────── */

const ROOT = join(__dirname, '..', '..', '..')

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '__tests__' || entry.startsWith('.')) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) sourceFiles(full, acc)
    else if ((entry.endsWith('.ts') || entry.endsWith('.tsx')) && !entry.includes('.test.'))
      acc.push(full)
  }
  return acc
}

describe('detection engine counts', () => {
  it('ENGINE_COUNT equals the shipped engine list length', () => {
    expect(ENGINE_COUNT).toBe(ENGINES.length)
  })

  it('advertises 16 engines — change this test only when the list changes', () => {
    expect(ENGINE_COUNT).toBe(16)
  })

  it('PATTERN_COUNT counts each shipped pattern exactly once', () => {
    /*
     * This test used to assert the SUM of the three registries, which is
     * how the double-count survived: BUILTIN_PATTERNS already contains
     * every CMMC and HIPAA pattern, so the sum reported 90 for 53 real
     * patterns and the homepage published it. The test was green the
     * whole time — it faithfully asserted the bug.
     *
     * Count distinct names, not array arithmetic.
     */
    const distinct = new Set(BUILTIN_PATTERNS.map((p) => p.name))
    expect(PATTERN_COUNT).toBe(distinct.size)
  })

  it('BUILTIN_PATTERNS is the superset — the other registries are views into it', () => {
    // If this ever stops holding, PATTERN_COUNT starts UNDER-counting and
    // the sum it replaced becomes right again. Fail loudly if so.
    const builtin = new Set(BUILTIN_PATTERNS.map((p) => p.name))
    for (const p of [...CMMC_PATTERNS, ...HIPAA_PATTERNS]) {
      expect(builtin.has(p.name), `${p.name} is missing from BUILTIN_PATTERNS`).toBe(true)
    }
  })

  it('ships no duplicate pattern names, which is what inflated the count', () => {
    const names = BUILTIN_PATTERNS.map((p) => p.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('ships at least one pattern per advertised engine', () => {
    // Guards the honesty direction that actually matters: we must never
    // advertise more engines than we have patterns to implement them.
    expect(PATTERN_COUNT).toBeGreaterThanOrEqual(ENGINE_COUNT)
  })

  it('has no duplicate or blank engine names', () => {
    expect(new Set(ENGINES).size).toBe(ENGINES.length)
    for (const name of ENGINES) expect(name.trim().length).toBeGreaterThan(0)
  })

  it('every hardcoded engine count in the source agrees with ENGINE_COUNT', () => {
    /*
     * Twenty-plus surfaces state the number as a literal — nav badges, blog
     * HTML, the chat system prompt, dashboard chrome. Interpolating all of
     * them would churn published copy for no reader benefit; what actually
     * matters is that none of them can silently disagree with the shipped
     * list. This asserts the invariant instead of the interpolation: add a
     * 17th engine and every stale "16 engines" string fails the build.
     */
    const violations: string[] = []
    // "16 engines", "16 detection engines", "16-engine detection matrix".
    // The lookbehind keeps "NIST 800-171 Engine" from reading as "171 engines".
    const CLAIM = /(?<![\d-])(\d+)[- ](?:detection )?engines?\b/gi

    for (const file of sourceFiles(join(ROOT, 'app'))
      .concat(sourceFiles(join(ROOT, 'components')), sourceFiles(join(ROOT, 'lib')))) {
      const src = readFileSync(file, 'utf8')
      for (const match of src.matchAll(CLAIM)) {
        const claimed = Number(match[1])
        if (claimed !== ENGINE_COUNT) {
          violations.push(`${file.replace(ROOT + '/', '')}: "${match[0]}"`)
        }
      }
    }

    expect(
      violations,
      `engine count disagrees with ENGINE_COUNT (${ENGINE_COUNT}): ${violations.join(' | ')}`,
    ).toEqual([])
  })
})
