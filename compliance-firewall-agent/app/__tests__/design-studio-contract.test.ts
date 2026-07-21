import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'

/**
 * Design Studio contract (2026-07-18; hero narrowed 2026-07-21).
 *
 * ONE registry (lib/dashboard/design-themes) still feeds BOTH surfaces, but the
 * founder later removed the hero's design switcher: the marketing hero now wears
 * ONLY Aurora (the signature skin), no carousel. The after-login console keeps
 * the full, paywall-free design picker + customize/reorder. These tests pin:
 *
 *  1. ONE registry (lib/dashboard/design-themes) feeds BOTH surfaces.
 *  2. The hero renders Aurora only — no design switcher (2026-07-21).
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

describe('hero — Aurora only, no design switcher (2026-07-21)', () => {
  const hero = read('components/landing/HeroDemoDashboard.tsx')
  it('still consumes the shared registry, pinned to Aurora (index 0)', () => {
    expect(hero).toMatch(/style=\{heroThemeVars\(activeTheme\)/)
    expect(hero).toMatch(/const activeTheme = DESIGN_THEMES\[0\]/)
  })
  it('has NO switcher — no carousel control, no cycling state', () => {
    for (const token of ['hd-switch', 'hd-dot', 'goTheme', 'setThemeIdx', 'themeIdx', 'pausedRef']) {
      expect(hero).not.toContain(token)
    }
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
