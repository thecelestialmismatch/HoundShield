import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Horizontal-overflow contract for the .hermes pages.
 *
 * Two distinct bugs put content past the right edge of a 375px viewport, and
 * both are invisible to a class-list reading — you only see them in computed
 * style in a real browser. This file locks the fixes so they cannot rot:
 *
 *  1. THE PADDING-SHORTHAND TRAP. `.hermes .container` supplies the 24px side
 *     gutter at specificity (0,2,0). Any later rule at equal specificity that
 *     uses the `padding` SHORTHAND on an element which also carries `container`
 *     silently resets padding-left/right to whatever the shorthand says —
 *     usually 0. `.hero-grid` did exactly that, so the hero sat flush against
 *     the viewport edge on every page width. Use `padding-block` instead.
 *     The check below is self-auditing: it re-derives the list of classes that
 *     ship alongside `container` from the JSX, so a future `container foo-grid`
 *     is covered the day it is written.
 *
 *  2. UNSHRINKABLE FLEX/GRID CHILDREN. Flex and grid items default to
 *     `min-width: auto`, and `.hermes .btn` is `white-space: nowrap`. A button
 *     whose label cannot wrap therefore sets a min-content floor that no
 *     amount of available width can talk down — the nav CTA row measured 239px
 *     against 327px of usable space and pushed the document to 409px wide.
 *
 * Measured on the built bundle at 375 / 768 / 1200:
 * documentElement.scrollWidth === clientWidth at all three, and
 * `.hero .container` reports paddingLeft: 24px.
 */

const root = process.cwd()
const css = readFileSync(join(root, 'app/hermes.css'), 'utf8')

/** Every rule block in the stylesheet, as { selector, body } pairs. */
const RULES = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => ({
  selector: m[1].replace(/\/\*[\s\S]*?\*\//g, '').trim(),
  body: m[2],
}))

/** True when the declaration block sets the `padding` shorthand itself. */
const setsPaddingShorthand = (body: string) => /(?:^|;)\s*padding\s*:/.test(body)

/** Source files that can contain JSX class names. */
function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next' || entry.startsWith('.')) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) sourceFiles(full, acc)
    else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) acc.push(full)
  }
  return acc
}

describe('hermes: the `container` gutter survives every companion class', () => {
  /**
   * Classes seen in the JSX on the same element as `container`, e.g. the
   * `hero-grid` in `className="container hero-grid"`.
   */
  const companions = new Set<string>()
  for (const file of sourceFiles(join(root, 'app')).concat(sourceFiles(join(root, 'components')))) {
    const src = readFileSync(file, 'utf8')
    for (const m of src.matchAll(/className="([^"]*)"/g)) {
      const classes = m[1].split(/\s+/).filter(Boolean)
      if (!classes.includes('container')) continue
      for (const c of classes) if (c !== 'container') companions.add(c)
    }
  }

  it('finds the companion classes it is supposed to be auditing', () => {
    // Guards the guard: if the JSX scan silently matches nothing, every
    // assertion below passes vacuously.
    expect(companions.size).toBeGreaterThan(0)
    expect([...companions]).toContain('hero-grid')
  })

  it('no rule uses the `padding` shorthand on a class that ships with `container`', () => {
    const offenders: string[] = []
    for (const companion of companions) {
      for (const rule of RULES) {
        if (!new RegExp(`\\.${companion}(?![\\w-])`).test(rule.selector)) continue
        if (setsPaddingShorthand(rule.body)) offenders.push(`${rule.selector} { ${rule.body.trim()} }`)
      }
    }
    // A shorthand here wins on source order over `.hermes .container` and
    // zeroes the 24px side gutter. Use padding-block / padding-inline.
    expect(offenders).toEqual([])
  })

  it('.container itself still supplies the 24px side gutter', () => {
    const container = RULES.find(r => r.selector === '.hermes .container')
    expect(container?.body).toContain('padding: 0 24px')
  })

  it('the hero keeps its vertical rhythm through padding-block', () => {
    const heroRules = RULES.filter(r => r.selector === '.hermes .hero-grid')
    expect(heroRules).toHaveLength(2) // base + the <=900px stack
    expect(heroRules[0].body).toContain('padding-block: 72px 84px')
    expect(heroRules[1].body).toContain('padding-block: 48px 56px')
  })
})

describe('hermes: nothing can force a track wider than the viewport', () => {
  it('hero grid items may shrink below their min-content floor', () => {
    const rule = RULES.find(r => r.selector === '.hermes .hero-grid > *')
    expect(rule?.body).toContain('min-width: 0')
  })

  it('the docs grid keeps the same protection', () => {
    // Pre-existing precedent this fix mirrors — if it disappears, the pattern
    // stopped being the house style and this file should be revisited.
    const rule = RULES.find(r => r.selector === '.hermes .docs-wrap > *')
    expect(rule?.body).toContain('min-width: 0')
  })

  it('small phones drop the wordmark so the nav CTA row fits', () => {
    const small = css.slice(css.indexOf('@media (max-width: 560px)'))
    expect(small).toMatch(/\.hermes \.brand-text \{[^}]*display: none/)
  })

  it('the hero CTA is allowed to wrap on small phones', () => {
    const small = css.slice(css.indexOf('@media (max-width: 560px)'))
    expect(small).toMatch(/\.hermes \.hero-actions \.btn \{[^}]*white-space: normal/)
  })

  it('the open burger menu turns the mega-flyouts into in-flow panels', () => {
    // `.dropdown.wide` is 720px and absolutely positioned — inside the stacked
    // mobile menu that ran from -165px to 540px on a 375px screen.
    const stacked = css.slice(css.indexOf('@media (max-width: 900px)'), css.indexOf('@media (max-width: 560px)'))
    expect(stacked).toMatch(/\.hermes \.nav-links\.open \.dropdown \{[^}]*display: none/)
    const opened = stacked.match(/\.hermes \.nav-links\.open \.nav-item:focus-within \.dropdown[^{]*\{([^}]*)\}/)
    expect(opened, 'focus-within must re-show the panel or keyboard users lose the sub-nav').toBeTruthy()
    expect(opened![1]).toContain('position: static')
    expect(opened![1]).toContain('width: auto')
    expect(opened![1]).toContain('transform: none')
  })

  it('the desktop flyout keeps the fixed width the mobile rule has to undo', () => {
    // If this stops being a fixed width the override above is dead weight.
    expect(RULES.find(r => r.selector === '.hermes .dropdown.wide')?.body).toContain('width: 720px')
  })

  it('the mega-flyout is anchored to the links row, not to its own trigger', () => {
    // `.dropdown.wide` is a fixed 720px centred on its containing block. Its
    // trigger is the FIRST item in the row, so with the item as the containing
    // block the panel opened at left: -118px and its entire first column sat
    // off-screen. A negative left edge never shows up in scrollWidth, which is
    // why the 375px sweep missed it — it was only visible at 1200.
    // `.hermes .nav-links` is declared in more than one block (the base flex row
    // and this containing-block declaration), so check them all, not the first.
    const linksRules = RULES.filter(r => r.selector === '.hermes .nav-links')
    expect(linksRules.some(r => r.body.includes('position: relative'))).toBe(true)
    const escape = RULES.find(r => r.selector === '.hermes .nav-item:has(> .dropdown.wide)')
    expect(escape?.body, 'the wide panel must escape its item to centre on the row').toContain('position: static')
  })

  it('the nav logo still names the link once the wordmark is hidden', () => {
    // The wordmark is the visible brand name; with it hidden the accessible
    // name of the home link comes from the logo's alt text alone.
    const nav = readFileSync(join(root, 'components/layout/NavV3.tsx'), 'utf8')
    expect(nav).toMatch(/className="brand-mark"[\s\S]{0,200}alt="HoundShield"/)
  })
})

describe('hermes: the marketing nav survives the globals.css `.nav-item` collision', () => {
  /**
   * `.nav-item` is declared TWICE in this app, in two stylesheets that are both
   * loaded on every page, and neither declaration is scoped:
   *
   *   globals.css  `.nav-item`          — the dashboard sidebar row
   *   hermes.css   `.hermes .nav-item`  — the marketing nav item
   *
   * The sidebar rule therefore also paints the marketing nav. Its `padding`
   * landed on top of the padding `.nav-link` already carries, so every item was
   * padded twice — 24px of dead space each, ~120px across the five items. That
   * is what spread the links out and squeezed the brand.
   */
  const globals = readFileSync(join(root, 'app/globals.css'), 'utf8')
  // Anchored to line start (allowing indentation — the sidebar block is nested
  // inside a @layer) so `.nav-item` matches but `.hs-lcc .nav-item` would not.
  const sidebarRule = globals.match(/^[ \t]*\.nav-item\s*\{([^}]*)\}/m)

  it('the collision this reset exists for is still real', () => {
    // Self-retiring guard: if someone scopes the sidebar rule to the dashboard
    // (the proper fix), this fails — and the reset below can then be deleted.
    expect(sidebarRule, 'globals.css no longer declares an unscoped .nav-item — the hermes reset is now dead code, remove it').toBeTruthy()
    expect(sidebarRule![1]).toMatch(/padding\s*:/)
  })

  it('hermes neutralises the inherited padding so the row can tighten', () => {
    // The hermes design puts the hover pill and its padding on `.nav-link`.
    const rule = RULES.find(r => r.selector === '.hermes .nav-item')
    expect(rule?.body).toContain('padding: 0')
    expect(rule?.body).toContain('gap: 0')
  })
})
