import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { PATTERN_COUNT } from '../engines'
import { BUILTIN_PATTERNS } from '@/lib/classifier/patterns'
import { CMMC_PATTERNS } from '@/lib/classifier/cmmc-patterns'
import { HIPAA_PATTERNS } from '@/lib/classifier/hipaa-patterns'
import { scanForSnapshot } from '@/lib/reports/snapshot-from-scan'
import { scanLocal } from '@/lib/scan/local-engine'

/* ──────────────────────────────────────────────────────────────────
 * ONE registry. One count. One place to change it.
 *
 * `lib/classifier/patterns.ts` spreads `...CMMC_PATTERNS` and
 * `...HIPAA_PATTERNS` into `BUILTIN_PATTERNS`, so BUILTIN_PATTERNS is
 * the complete 53-pattern set, not a 16-pattern base to add them to.
 *
 * Both browser scan consumers added them a second time anyway:
 *
 *   lib/reports/snapshot-from-scan.ts  LOCAL_ENGINES
 *   lib/scan/local-engine.ts           ALL_PATTERNS
 *
 * Ninety entries for fifty-three patterns. `scanForSnapshot` keys
 * findings by pattern NAME and SUMS collisions (`existing.count +=
 * count`), so the duplicates were not deduped — every CUI and PHI
 * finding was reported at exactly 2x, and those doubled numbers were
 * POSTed to `/api/report/snapshot-lead` as the lead's risk profile.
 * `local-engine.ts` published the array length to the UI as
 * `patternsChecked`, so `/demo` printed "90" while `/demo`'s own header,
 * which imports PATTERN_COUNT, printed "53" three paragraphs above it.
 *
 * `lib/detection/engines.ts` was written to delete that exact 90, and
 * `engines.test.ts` locks the CONSTANT. Nothing locked the CONSUMERS.
 * That is this file's job, and it holds the line three ways: on the
 * shipped arrays, on observed scan output, and on the source text so a
 * future re-concatenation fails the build before anyone measures it.
 *
 * NEVER-DO (CLAUDE.md): publish fictional metrics — buyers verify
 * everything. The pattern files are in the public repo. A buyer who
 * counts them arrives at 53.
 * ────────────────────────────────────────────────────────────────── */

const APP_ROOT = join(__dirname, '..', '..', '..')

/** Every shipped .ts/.tsx under `dir`, excluding tests and dotfiles. */
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

/** Strip block and line comments so the guard reads code, not the prose above. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
}

describe('detection registry has a single source of truth', () => {
  it('BUILTIN_PATTERNS already contains every CMMC and HIPAA pattern', () => {
    // The precondition every assertion below rests on. If this inverts,
    // the consumers were right to concatenate and this file is wrong.
    const builtin = new Set(BUILTIN_PATTERNS.map((p) => p.name))
    for (const p of [...CMMC_PATTERNS, ...HIPAA_PATTERNS]) {
      expect(builtin.has(p.name), `${p.name} is missing from BUILTIN_PATTERNS`).toBe(true)
    }
  })

  it('the arithmetic that produced 90 is what a re-concatenation still costs', () => {
    // Pinned so the regression is legible, not folklore: this is the
    // exact overcount the two consumers shipped.
    const reconcatenated = [...BUILTIN_PATTERNS, ...CMMC_PATTERNS, ...HIPAA_PATTERNS]
    expect(reconcatenated.length).toBe(PATTERN_COUNT + CMMC_PATTERNS.length + HIPAA_PATTERNS.length)
    expect(reconcatenated.length).toBeGreaterThan(PATTERN_COUNT)
    expect(new Set(reconcatenated.map((p) => p.name)).size).toBe(PATTERN_COUNT)
  })

  it('no source file re-concatenates a registry that is already inside BUILTIN_PATTERNS', () => {
    /*
     * The source-text half of the guard. The runtime assertions below
     * only see the two consumers this file imports; this one sees every
     * shipped file, including the next one somebody writes.
     */
    const violations: string[] = []
    const RECONCAT = /\.\.\.\s*BUILTIN_PATTERNS[\s\S]{0,200}?\.\.\.\s*(?:CMMC|HIPAA)_PATTERNS/g

    for (const file of sourceFiles(join(APP_ROOT, 'app'))
      .concat(sourceFiles(join(APP_ROOT, 'components')), sourceFiles(join(APP_ROOT, 'lib')))) {
      const src = stripComments(readFileSync(file, 'utf8'))
      if (RECONCAT.test(src)) violations.push(file.replace(APP_ROOT + '/', ''))
      RECONCAT.lastIndex = 0
    }

    expect(
      violations,
      `BUILTIN_PATTERNS already holds the CMMC and HIPAA sets — spreading them alongside it ` +
        `double-counts every CUI and PHI finding. Import BUILTIN_PATTERNS alone in: ${violations.join(', ')}`,
    ).toEqual([])
  })

  it('scanForSnapshot reports each CMMC match once, not twice', () => {
    // The demo script's own prompt, verbatim from CLAUDE.md.
    const findings = scanForSnapshot('Summarize our CAGE code 1ABC2 contract for the Navy.')
    const cage = findings.find((f) => f.patternName === 'CAGE code')

    expect(cage, 'the CAGE code pattern must still fire on the demo prompt').toBeDefined()
    expect(cage!.count).toBe(1)
  })

  it('scanForSnapshot reports each HIPAA match once, not twice', () => {
    const findings = scanForSnapshot('Patient ZIP code 02139 — please summarize the chart.')
    const zip = findings.find((f) => f.patternName === 'ZIP code (5-digit or ZIP+4)')

    expect(zip, 'the ZIP pattern must still fire').toBeDefined()
    expect(zip!.count).toBe(1)
  })

  it('a pattern present in only one registry is unaffected by the fix', () => {
    // Guards the other direction: removing the duplicates must not have
    // removed a base pattern that was never in CMMC_PATTERNS or
    // HIPAA_PATTERNS to begin with.
    const findings = scanForSnapshot('Reach me at engineer@contractor.example for the drawings.')
    expect(findings.some((f) => f.patternName === 'Email addresses')).toBe(true)
  })

  it('the demo publishes the number of patterns it actually ran', () => {
    // `patternsChecked` is rendered on the public /demo surface. It read
    // 90 while the page header, which imports PATTERN_COUNT, read 53.
    const result = scanLocal('CUI//SP-CTI — internal only.')
    expect(result.patternsChecked).toBe(PATTERN_COUNT)
  })

  it('the scan still detects CUI markings after the deduplication', () => {
    const result = scanLocal('CUI//SP-CTI — internal only.')
    expect(result.findings.some((f) => f.patternName === 'CUI marking')).toBe(true)
  })
})
