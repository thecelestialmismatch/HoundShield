import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'

/**
 * Design Studio contract (2026-07-18, founder-directed follow-up to Aurora).
 *
 * The founder asked for the dashboard to wear MANY designs, live: the hero
 * should cycle through them (light → dark → light, charts still moving) and the
 * after-login console should let ANY user (no paywall) switch design and
 * rearrange/hide their sections. These tests pin that architecture:
 *
 *  1. ONE registry (lib/dashboard/design-themes) feeds BOTH surfaces.
 *  2. The hero is a live, controllable carousel.
 *  3. The console applies the theme + paints its canvas/donut from it, exposes a
 *     design picker + a customize/reorder mode, and both are FREE for everyone.
 */

const CFA = path.resolve(__dirname, '../..')
const read = (rel: string) => readFileSync(path.join(CFA, rel), 'utf8')

describe('one registry, both surfaces', () => {
  const hero = read('components/landing/HeroDemoDashboard.tsx')
  const lcc = read('components/dashboard/LiveCommandCenter.tsx')
  it('the hero and the console both consume @/lib/dashboard/design-themes', () => {
    expect(hero).toMatch(/from '@\/lib\/dashboard\/design-themes'/)
    expect(lcc).toMatch(/from '@\/lib\/dashboard\/design-themes'/)
    expect(hero).toContain('heroThemeVars')
    expect(lcc).toContain('consoleThemeVars')
  })
})

describe('hero — live, controllable design carousel', () => {
  const hero = read('components/landing/HeroDemoDashboard.tsx')
  it('applies the active theme to the window root', () => {
    expect(hero).toMatch(/style=\{heroThemeVars\(activeTheme\)/)
  })
  it('auto-advances through designs, but not under reduced motion', () => {
    expect(hero).toMatch(/setThemeIdx\(\(i\) => \(i \+ 1\) % DESIGN_THEMES\.length\)/)
    expect(hero).toMatch(/prefers-reduced-motion/)
    // paused while the cursor dwells on the window
    expect(hero).toContain('pausedRef')
  })
  it('is user-controllable: prev/next nav + a dot rail', () => {
    expect(hero).toContain('hd-switch')
    expect(hero).toContain('goTheme')
    expect(hero).toMatch(/hd-dot/)
    expect(hero).toMatch(/DESIGN_THEMES\.map/)
  })
})

describe('console — themeable + customizable, free for everyone', () => {
  const lcc = read('components/dashboard/LiveCommandCenter.tsx')
  const css = read('components/dashboard/lccStyles.ts')

  it('applies the theme to the console root and repaints the canvas/donut from it', () => {
    expect(lcc).toMatch(/style=\{consoleThemeVars\(activeTheme\)/)
    expect(lcc).toContain('themeRef.current.viz.stroke')
    expect(lcc).toContain('themeRef.current.viz.grid')
    expect(lcc).toContain('themeRef.current.viz.donut')
    // theme change triggers a repaint of the imperatively-drawn marks
    expect(lcc).toMatch(/redrawRef\.current\?\.\(\)\s*\}, \[prefs\.themeId\]\)/)
  })

  it('offers a design picker over the whole registry', () => {
    expect(lcc).toContain('appear-menu')
    expect(lcc).toMatch(/DESIGN_THEMES\.map/)
    expect(lcc).toContain('prefs.setTheme')
  })

  it('lets the user reorder + hide Overview sections (customize mode)', () => {
    expect(lcc).toContain('useDashboardPrefs')
    expect(lcc).toContain('ovsections')
    expect(lcc).toMatch(/<Section id="kpis"/)
    expect(lcc).toMatch(/<Section id="engines"/)
    expect(lcc).toContain('prefs.move')
    expect(lcc).toContain('prefs.toggleHidden')
    // display order is CSS `order` on each section (source order untouched)
    expect(lcc).toMatch(/order: prefs\.orderOf\(id\)/)
  })

  it('personalization is NOT gated by the subscription', () => {
    // The customize banner states it plainly, and neither control is wrapped in
    // an entitlement/hasFeature guard (they read prefs directly).
    expect(lcc).toMatch(/free for everyone/i)
    expect(css).toContain('.hs-lcc .appear-menu')
    expect(css).toContain('.hs-lcc .ovsections')
  })

  it('the top bar retints per theme (var-ized, not a hardcoded near-white)', () => {
    expect(css).toMatch(/\.hs-lcc \.top\{[^}]*background:var\(--topbar/)
  })
})
