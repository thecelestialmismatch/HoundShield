import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

/**
 * Grid density on a 375px phone.
 *
 * `mobile-overflow-contract.test.ts` covers the OTHER mobile failure — content
 * pushed past the right edge of the viewport on the `.hermes` marketing pages.
 * This one covers the failure that produces no overflow at all, which is why it
 * survived: a CSS grid never overflows. It shrinks its tracks. `grid-cols-4` on
 * a 375px screen is four 84px columns, perfectly inside the viewport and
 * perfectly unusable — four employee-range buttons, a four-card stat row, a
 * five-cell metrics bar reading "Quarantined" in 75px.
 *
 * Every instance found on 2026-08-22 was BEHIND LOGIN, which is exactly why no
 * marketing-page contract caught any of them.
 *
 * WHY 4 IS THE FLOOR AND 12 IS EXEMPT.
 * Two and three columns of a short stat tile are tight but legible on a phone,
 * and forcing them to stack makes the page longer for no gain — so the guard
 * stays quiet there rather than nagging, which is how a guard earns the right
 * to be believed. `grid-cols-12` is not a density choice at all: it is the
 * twelve-column layout system, where the children carry `col-span-N` and the
 * real question is whether the container scrolls. That question is asked
 * separately below.
 */

const APP = process.cwd()
const SCAN_DIRS = ['app', 'components']
const SKIP = new Set(['node_modules', '.next', '__tests__', 'dist', 'coverage'])

function sources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) sources(full, out)
    else if (entry.endsWith('.tsx')) out.push(full)
  }
  return out
}

const FILES = SCAN_DIRS.flatMap((d) => sources(join(APP, d)))

/** `grid-cols-4` … `grid-cols-9`, with no responsive prefix in front of it. */
const DENSE = /(?<![\w:-])grid-cols-([4-9])\b/g

/** A responsive prefix anywhere in the same class string means it was considered. */
const RESPONSIVE = /(?:sm|md|lg|xl|2xl):grid-cols-\d/

describe('responsive grid density', () => {
  it('finds the files it is supposed to be auditing', () => {
    // A guard that silently scans nothing passes forever. Four gates in this
    // repo did exactly that before anyone noticed (see doc-counts.test.ts).
    expect(FILES.length).toBeGreaterThan(100)
    expect(FILES.some((f) => f.includes('command-center'))).toBe(true)
  })

  it('never sets four or more columns without a phone-sized fallback', () => {
    const offenders: string[] = []

    for (const file of FILES) {
      const src = readFileSync(file, 'utf8')
      // Work per class-attribute value: a responsive prefix only rescues the
      // grid it actually sits next to.
      for (const attr of src.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
        const classes = attr[1] ?? attr[2] ?? ''
        DENSE.lastIndex = 0
        if (!DENSE.test(classes)) continue
        if (RESPONSIVE.test(classes)) continue
        offenders.push(`${relative(APP, file)} :: ${classes.slice(0, 90)}`)
      }
    }

    expect(offenders).toEqual([])
  })

  it('still has teeth — the exact strings that shipped must trip it', () => {
    const trips = (classes: string) => {
      DENSE.lastIndex = 0
      return DENSE.test(classes) && !RESPONSIVE.test(classes)
    }
    // Employee-range buttons, the team stat row, the metrics bar.
    expect(trips('grid grid-cols-4 gap-3')).toBe(true)
    expect(trips('mt-4 grid grid-cols-4 gap-4')).toBe(true)
    expect(trips('grid grid-cols-5 gap-px bg-zinc-800')).toBe(true)
    // The fixes must read as clean.
    expect(trips('grid grid-cols-2 sm:grid-cols-4 gap-3')).toBe(false)
    expect(trips('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px')).toBe(false)
    // Two and three columns are a deliberate non-finding, not an oversight.
    expect(trips('grid grid-cols-3 gap-2')).toBe(false)
    // The twelve-column layout system is a different question entirely.
    expect(trips('grid grid-cols-12 gap-4')).toBe(false)
    // A responsive prefix must not be matched as if it were bare.
    expect(trips('sm:grid-cols-4')).toBe(false)
  })

  it('scrolls a twelve-column table instead of clipping it', () => {
    /*
     * `grid-cols-12` rows sat inside `overflow-hidden` wrappers on the partner
     * client tables. A grid shrinks to fit, so the columns were never pushed
     * out — they were squeezed to ~55px and then CLIPPED, with no way to scroll
     * to them. Both halves are needed: `overflow-x-auto` alone scrolls nothing
     * because the grid has already shrunk, and a `min-w-` alone would be
     * clipped by the wrapper.
     */
    for (const rel of ['app/partner/clients/page.tsx', 'app/partner/clients/[orgId]/page.tsx']) {
      const src = readFileSync(join(APP, rel), 'utf8')
      for (const attr of src.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
        const classes = attr[1] ?? attr[2] ?? ''
        if (!/\bgrid-cols-12\b/.test(classes)) continue
        expect({ rel, classes }).toMatchObject({ classes: expect.stringMatching(/min-w-\[/) })
      }
      expect(src).not.toMatch(/rounded-2xl[^"]*overflow-hidden/)
    }
  })
})
