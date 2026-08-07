import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import path from 'path'
import { readShellRoot, readShellSource } from './helpers/shell-source'

const CFA = path.resolve(__dirname, '../..')

/**
 * The after-login shell works on a phone.
 *
 * On 2026-08-07 it did not, and had never been checked. A grep for
 * `sm:|md:|lg:|xl:|2xl:` across all 427 lines of the tool shell returned
 * NOTHING — not one breakpoint. The sidebar was `fixed w-[260px]`, `<main>` was
 * `ml-[260px]` and the header was `left-[260px]`, all unconditional, so a 375px
 * viewport got a 115px content column — 67px once `p-6` was applied — on every
 * one of the 23 Command Center pages. The only dismissal control was a
 * "Collapse" button at the bottom of a 23-item nav, and it still left a 68px
 * rail.
 *
 * The panels were never the problem: `lccStyles.ts` carries 13 media queries and
 * reflows correctly down to 400px. They were reflowing perfectly inside a column
 * too narrow to read.
 *
 * The behavioural half of this lives in `_shell/__tests__/Sidebar.test.tsx`,
 * which mounts the drawer and drives it. This half is the cheap regression
 * guard: jsdom has no layout engine, so it cannot catch a breakpoint being
 * deleted — only reading the source can.
 */

const SHELL_DIR = 'app/command-center/(tools)'

describe('the tool shell declares responsive behaviour at all', () => {
  const shell = readShellSource()

  it('uses breakpoint prefixes — the whole shell had zero before 2026-08-07', () => {
    const prefixes = shell.match(/\b(sm|md|lg|xl|2xl):/g) ?? []
    expect(prefixes.length).toBeGreaterThan(10)
  })

  it('the sidebar is off-canvas by default and pinned only from lg', () => {
    // `-translate-x-full` + `lg:translate-x-0` is the whole drawer mechanism. If
    // either half goes, the phone layout silently reverts.
    expect(shell).toMatch(/-translate-x-full/)
    expect(shell).toMatch(/lg:translate-x-0/)
  })

  it('the content column does not reserve sidebar width below lg', () => {
    const root = readShellRoot()
    // The killer line was `ml-[260px]` unconditional. Any margin that reserves
    // the rail must now be lg-gated.
    const unconditional = root.match(/(?<!lg:)\bml-\[(260|68)px\]/g) ?? []
    expect(unconditional, 'main still reserves sidebar width on a phone').toEqual([])
    expect(root).toMatch(/lg:ml-\[260px\]/)
  })

  it('the header spans the viewport below lg', () => {
    const shell2 = readShellSource()
    const unconditional = shell2.match(/(?<!lg:)\bleft-\[(260|68)px\]/g) ?? []
    expect(unconditional, 'the header still starts 260px in on a phone').toEqual([])
    expect(shell2).toMatch(/lg:left-\[260px\]/)
  })

  it('there is a control that opens navigation on a phone', () => {
    expect(shell).toMatch(/Open navigation/)
  })

  it('there is a scrim, and it is lg:hidden so it never dims the desktop rail', () => {
    expect(shell).toMatch(/Close navigation/)
    expect(readShellRoot()).toMatch(/lg:hidden/)
  })

  it('page padding steps up with the viewport instead of costing 48px on a phone', () => {
    expect(readShellRoot()).toMatch(/className="p-4 sm:p-6 lg:p-8"/)
  })
})

describe('the panel grids can actually shrink', () => {
  const lcc = readFileSync(path.join(CFA, 'components/dashboard/lccStyles.ts'), 'utf8')

  /**
   * Found in Chromium on 2026-08-07, after the shell fix landed: the page still
   * scrolled sideways, and `.op-actions` was the only reason.
   *
   * A bare `1fr` grid track has an implicit `min-width:auto`, so the track can
   * never be narrower than the card's min-content width (~197px). The overflow
   * was therefore exact and predictable — 4 × 177px = 708px in a 700px column at
   * 1024px, and 2 × 197px = 394px in a 343px column at 375px — which is why it
   * survived every source-grep breakpoint check: the breakpoints were all
   * present and correct, and the tracks still could not shrink.
   *
   * jsdom cannot catch this (no layout engine) and neither can counting
   * breakpoints, so this guards the one property that actually fixed it.
   */
  it('op-actions tracks use minmax(0,1fr) so they can shrink below min-content', () => {
    const bare = lcc.match(/\.op-actions\{[^}]*grid-template-columns:\s*repeat\(\d+,\s*1fr\)/g) ?? []
    expect(bare, '.op-actions is back on bare 1fr tracks — the page will scroll sideways').toEqual([])
    expect(lcc).toMatch(/\.op-actions\{[^}]*repeat\(4,minmax\(0,1fr\)\)/)
    expect(lcc).toMatch(/max-width:900px\)\{\.hs-lcc \.op-actions\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/)
  })

  it('drops to a single column on a phone rather than two cramped ones', () => {
    expect(lcc).toMatch(/max-width:560px\)\{\.hs-lcc \.op-actions\{grid-template-columns:minmax\(0,1fr\)\}/)
  })

  it('the action card and its label may shrink inside the track', () => {
    // Without min-width:0 on both, the flex label re-imposes the min-content
    // floor the grid fix just removed.
    expect(lcc).toMatch(/\.op-action\{[^}]*min-width:0/)
    expect(lcc).toMatch(/\.op-action-label\{[^}]*min-width:0/)
  })
})

describe('the shell recovers visibly', () => {
  it('has an error boundary INSIDE the group, so a crash keeps the sidebar', () => {
    // There was none anywhere under app/command-center until 2026-08-07: a throw
    // in any tool page escaped to the root boundary and took the whole shell
    // with it.
    const errorFile = path.join(CFA, SHELL_DIR, 'error.tsx')
    expect(existsSync(errorFile), `${SHELL_DIR}/error.tsx is missing`).toBe(true)
    const src = readFileSync(errorFile, 'utf8')
    expect(src).toMatch(/^["']use client["']/)
    expect(src).toMatch(/reset/)
  })

  it('has a loading skeleton scoped to the content region', () => {
    // The pre-existing app/command-center/loading.tsx is full-viewport, so
    // navigating between tools blanked the sidebar too.
    expect(existsSync(path.join(CFA, SHELL_DIR, 'loading.tsx'))).toBe(true)
  })

  it('keyboard users can skip the 23-item nav', () => {
    const root = readShellRoot()
    expect(root).toMatch(/Skip to main content/)
    expect(root).toMatch(/id="cc-main"/)
  })
})
