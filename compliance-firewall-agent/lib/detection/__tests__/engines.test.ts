import { describe, it, expect } from 'vitest'
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

describe('detection engine counts', () => {
  it('ENGINE_COUNT equals the shipped engine list length', () => {
    expect(ENGINE_COUNT).toBe(ENGINES.length)
  })

  it('advertises 16 engines — change this test only when the list changes', () => {
    expect(ENGINE_COUNT).toBe(16)
  })

  it('PATTERN_COUNT is the sum of every shipped pattern registry', () => {
    expect(PATTERN_COUNT).toBe(
      BUILTIN_PATTERNS.length + CMMC_PATTERNS.length + HIPAA_PATTERNS.length,
    )
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
})
