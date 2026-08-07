import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'

const CFA = path.resolve(__dirname, '../..')
const REPO = path.resolve(CFA, '..')

const designMd = readFileSync(path.join(REPO, 'DESIGN.md'), 'utf8')
const globals = readFileSync(path.join(CFA, 'app/globals.css'), 'utf8')
// The dashboard panel layer declares its own scoped properties (`--f-disp`,
// `--panel`, `--brand`…) inside the `.hs-lcc` stylesheet rather than :root, and
// DESIGN.md documents both surfaces. Checking only globals.css would flag every
// panel token as missing.
const lccStyles = readFileSync(path.join(CFA, 'components/dashboard/lccStyles.ts'), 'utf8')

/**
 * `DESIGN.md` describes the design system that actually exists.
 *
 * It is read by AI coding agents at session start, which makes a stale one
 * worse than none: it does not fail loudly, it just produces confidently wrong
 * UI. And it had gone stale. Between its "last updated 2026-04-11" and
 * 2026-08-07 the product moved to light mode, and the file still described a
 * dark `#07070b` landing page with an indigo brand, contradicting both
 * `CLAUDE.md` and every line of `globals.css`. Four months, nothing to catch it.
 *
 * So the document is now checked against the code. Not its prose — its tokens,
 * which are the part an agent copies verbatim.
 */

/**
 * Every custom property DESIGN.md names, from fenced blocks and inline code.
 *
 * Trailing-dash matches are dropped: the prose refers to the token family as
 * `--hs-*`, and `--hs-` is not a token anyone can define.
 */
function tokensNamedInDesignMd(): string[] {
  const found = designMd.match(/--[a-z][a-z0-9-]*/g) ?? []
  return [...new Set(found)].filter((t) => !t.endsWith('-'))
}

/**
 * Every custom property the stylesheets define.
 *
 * Not line-anchored: globals.css pairs tokens on one line
 * (`--hs-lime: …;   --hs-lime-soft: …;`), and an `^`-anchored match silently
 * saw only the first of each pair — which is exactly the kind of quiet
 * half-truth this suite exists to catch.
 */
function tokensDefined(): Set<string> {
  const out = new Set<string>()
  for (const source of [globals, lccStyles]) {
    for (const m of source.matchAll(/(--[a-z][a-z0-9-]*)\s*:/g)) out.add(m[1])
  }
  return out
}

describe('DESIGN.md documents the tokens that exist', () => {
  it('names a meaningful number of tokens at all', () => {
    // Guards against the file being gutted into prose and this suite passing
    // vacuously.
    expect(tokensNamedInDesignMd().length).toBeGreaterThan(30)
  })

  it('every token it documents is defined in the stylesheets', () => {
    const defined = tokensDefined()
    const missing = tokensNamedInDesignMd().filter((t) => !defined.has(t))
    expect(
      missing,
      `DESIGN.md documents tokens that no longer exist in app/globals.css or ` +
        `components/dashboard/lccStyles.ts: ${missing.join(', ')}. An agent reading this file ` +
        `would generate CSS referencing nothing.`,
    ).toEqual([])
  })

  it('documents the surface and ink scales, which every page depends on', () => {
    for (const token of [
      '--hs-surface-0',
      '--hs-surface-1',
      '--hs-ink',
      '--hs-ink-secondary',
      '--hs-border-ink',
      '--hs-steel',
    ]) {
      expect(designMd, `${token} is undocumented`).toContain(token)
    }
  })
})

describe('DESIGN.md does not describe a product that no longer exists', () => {
  it('does not claim the landing page is dark', () => {
    // The single most misleading claim in the stale version. CLAUDE.md is the
    // authority and says the landing page is light mode.
    expect(designMd).not.toMatch(/Homepage bg:\s*bg-\[#07070b\]/)
    expect(designMd).not.toMatch(/Light backgrounds\s*—\s*dark mode is always on/i)
  })

  it('does not present indigo as the brand', () => {
    // The brand is steel #81A6C6. The Command Center contract test fails the
    // build on indigo in the shell, so documenting it here would send an agent
    // straight into a failing gate.
    expect(designMd).not.toMatch(/Primary:\s*indigo-500/)
    expect(designMd).not.toMatch(/indigo family/)
  })

  it('records the date its token values were verified against the code', () => {
    expect(designMd).toMatch(/verified against .*globals\.css.* on \d{4}-\d{2}-\d{2}/i)
  })
})
