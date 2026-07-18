import { describe, it, expect } from 'vitest'
import {
  DESIGN_THEMES,
  DEFAULT_THEME_ID,
  getThemeById,
  heroThemeVars,
  consoleThemeVars,
} from '../design-themes'

// The hero window's --a-* token set every theme must fully define, and the
// console's token subset. If a surface gains a token, add it here so a new
// theme can't ship a half-themed surface.
const HERO_KEYS = [
  '--a-stage', '--a-win', '--a-bar', '--a-card', '--a-line',
  '--a-ink', '--a-mut', '--a-mut2',
  '--a-steel', '--a-lime', '--a-lime-2', '--a-peach', '--a-peri', '--a-green', '--a-action',
]
const CONSOLE_KEYS = [
  '--bg', '--panel', '--panel2', '--line', '--line2',
  '--text', '--mut', '--mut2', '--brand', '--bright', '--cream', '--track',
  '--lime', '--peach', '--peri', '--topbar',
]

describe('design theme registry', () => {
  it('ships an extensible set (5–6+ to start) with unique ids', () => {
    expect(DESIGN_THEMES.length).toBeGreaterThanOrEqual(5)
    const ids = DESIGN_THEMES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('leads with aurora (the default) in light mode', () => {
    expect(DESIGN_THEMES[0].id).toBe('aurora')
    expect(DEFAULT_THEME_ID).toBe('aurora')
    expect(DESIGN_THEMES[0].mode).toBe('light')
  })

  it('includes at least one dark and multiple light designs', () => {
    expect(DESIGN_THEMES.some((t) => t.mode === 'dark')).toBe(true)
    expect(DESIGN_THEMES.filter((t) => t.mode === 'light').length).toBeGreaterThanOrEqual(3)
  })

  it('every theme fully defines both surfaces + a 4-slice donut', () => {
    for (const t of DESIGN_THEMES) {
      expect(t.name.length).toBeGreaterThan(0)
      expect(t.blurb.length).toBeGreaterThan(0)
      expect(t.swatch).toHaveLength(3)
      for (const k of HERO_KEYS) expect(t.hero, `${t.id} hero ${k}`).toHaveProperty(k)
      for (const k of CONSOLE_KEYS) expect(t.console, `${t.id} console ${k}`).toHaveProperty(k)
      expect(t.viz.donut, `${t.id} donut`).toHaveLength(4)
      expect(t.viz.stroke).toMatch(/^#|rgb/)
      expect(t.viz.accent).toMatch(/^#|rgb/)
      expect(t.viz.grid).toMatch(/^#|rgb/)
    }
  })

  it('the default theme is the exact aurora pastel skin both surfaces launched with', () => {
    const a = getThemeById('aurora')
    expect(a.hero['--a-lime']).toBe('#B6D94E')
    expect(a.hero['--a-peach']).toBe('#F0B880')
    expect(a.hero['--a-peri']).toBe('#A9C7EE')
    expect(a.console['--brand']).toBe('#5A86A8')
    expect(a.viz.donut).toEqual(['#B6D94E', '#F0B880', '#A9C7EE', '#81A6C6'])
  })

  it('getThemeById falls back to the default for unknown / nullish ids', () => {
    expect(getThemeById('nope').id).toBe('aurora')
    expect(getThemeById(null).id).toBe('aurora')
    expect(getThemeById(undefined).id).toBe('aurora')
    expect(getThemeById('midnight').id).toBe('midnight')
  })

  it('the surface mappers return the theme var maps', () => {
    const m = DESIGN_THEMES[1]
    expect(heroThemeVars(m)).toBe(m.hero)
    expect(consoleThemeVars(m)).toBe(m.console)
  })
})
