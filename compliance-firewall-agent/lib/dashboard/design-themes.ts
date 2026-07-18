/**
 * Design themes — ONE extensible registry that both the marketing hero window
 * (`.hs-demo`) and the after-login console (`.hs-lcc`) consume, so "the dashboard
 * can wear many looks" is a single source of truth, not two drifting copies.
 *
 * Founder direction (2026-07-18): the hero should cycle LIVE through several
 * dashboard designs (light → dark → light, charts still animating), and the
 * after-login console should let ANY user (no paywall) switch design and
 * rearrange their sections. Adding a new design later = one entry in
 * DESIGN_THEMES; it appears in the hero carousel AND the console picker
 * automatically.
 *
 * Each theme carries explicit CSS-variable maps for BOTH surfaces (rather than a
 * lossy semantic mapping) so every design is pixel-deliberate on each surface,
 * plus a `viz` block for the console's JS-painted canvas throughput chart and
 * conic donut (those can't read a CSS var at paint time). The hero's SVG marks
 * read the `--a-*` vars directly, so they retheme for free.
 *
 * Guarded by lib/dashboard/__tests__/design-themes.test.ts (shape + coverage +
 * light/dark balance) and app/__tests__/aurora-redesign-contract.test.ts (the
 * default theme still is the aurora pastel skin both surfaces launched with).
 */

export interface ThemeViz {
  /** Throughput line-chart stroke (console canvas). */
  stroke: string
  /** Leading "live" pulse dot (console canvas). */
  accent: string
  /** Canvas gridline colour. */
  grid: string
  /** Detection-mix donut sweep + legend dots: [CUI, Secrets, PII, PHI]. */
  donut: [string, string, string, string]
}

export interface DesignTheme {
  id: string
  name: string
  mode: 'light' | 'dark'
  /** One-line descriptor for the picker. */
  blurb: string
  /** Three dots previewed in the picker chip. */
  swatch: [string, string, string]
  /** CSS custom properties applied inline to the hero window root (`.hs-demo`). */
  hero: Record<string, string>
  /** CSS custom properties applied inline to the console root (`.hs-lcc`). */
  console: Record<string, string>
  /** Colours for the console's imperatively-painted marks. */
  viz: ThemeViz
}

/**
 * The registry. Aurora is index 0 and MUST equal the values baked into
 * globals.css / hermes.css / lccStyles.ts so the default render is unchanged;
 * the others reskin around the same token vocabulary.
 */
export const DESIGN_THEMES: DesignTheme[] = [
  {
    id: 'aurora',
    name: 'Aurora',
    mode: 'light',
    blurb: 'Soft slate-blue → pale-sage, pastel accents. The signature look.',
    swatch: ['#B6D94E', '#F0B880', '#A9C7EE'],
    hero: {
      '--a-stage': 'linear-gradient(155deg,#C9D1DB 0%,#D3D8D5 44%,#DFE6D2 100%)',
      '--a-win': '#EEF2F6', '--a-bar': '#F5F7F9', '--a-card': '#FFFFFF', '--a-line': 'rgba(30,42,55,.08)',
      '--a-ink': '#1E2A37', '--a-mut': '#5A6675', '--a-mut2': '#8A94A2',
      '--a-steel': '#81A6C6', '--a-lime': '#B6D94E', '--a-lime-2': '#D7EC95',
      '--a-peach': '#F0B880', '--a-peri': '#A9C7EE', '--a-green': '#37A05A', '--a-action': '#2F6BF0',
    },
    console: {
      '--bg': 'linear-gradient(155deg,#C9D1DB 0%,#D3D8D5 44%,#DFE6D2 100%)',
      '--panel': '#FFFFFF', '--panel2': 'rgba(255,255,255,.66)', '--line': 'rgba(15,30,46,.10)', '--line2': 'rgba(129,166,198,.30)',
      '--text': '#0F1E2E', '--mut': '#3D5166', '--mut2': '#6B8299',
      '--brand': '#5A86A8', '--bright': '#81A6C6', '--cream': '#F3E3D0', '--track': 'rgba(15,30,46,.07)',
      '--lime': '#B6D94E', '--peach': '#F0B880', '--peri': '#A9C7EE', '--topbar': 'rgba(250,252,255,.82)',
    },
    viz: { stroke: '#5A86A8', accent: '#E07B39', grid: 'rgba(15,30,46,.06)', donut: ['#B6D94E', '#F0B880', '#A9C7EE', '#81A6C6'] },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    mode: 'dark',
    blurb: 'Deep navy dark mode — easy on the eyes for long shifts.',
    swatch: ['#0F1829', '#7FB0E6', '#BFE05A'],
    hero: {
      '--a-stage': 'linear-gradient(160deg,#0A1120 0%,#0D1524 52%,#101B2E 100%)',
      '--a-win': '#0F1829', '--a-bar': '#0C1322', '--a-card': '#15223A', '--a-line': 'rgba(255,255,255,.09)',
      '--a-ink': '#EAF1FB', '--a-mut': '#AAB8CE', '--a-mut2': '#748699',
      '--a-steel': '#7FB0E6', '--a-lime': '#BFE05A', '--a-lime-2': '#8FB84A',
      '--a-peach': '#F4C08C', '--a-peri': '#8FB4F0', '--a-green': '#45C97F', '--a-action': '#3B82F6',
    },
    console: {
      '--bg': 'linear-gradient(160deg,#0A1120 0%,#0D1524 52%,#101B2E 100%)',
      '--panel': '#121E33', '--panel2': 'rgba(18,30,51,.72)', '--line': 'rgba(255,255,255,.10)', '--line2': 'rgba(127,176,230,.26)',
      '--text': '#EAF1FB', '--mut': '#AAB8CE', '--mut2': '#748699',
      '--brand': '#7FB0E6', '--bright': '#A9C7EE', '--cream': '#20304a', '--track': 'rgba(255,255,255,.08)',
      '--lime': '#BFE05A', '--peach': '#F4C08C', '--peri': '#8FB4F0', '--topbar': 'rgba(12,20,35,.82)',
    },
    viz: { stroke: '#7FB0E6', accent: '#F4C08C', grid: 'rgba(255,255,255,.07)', donut: ['#BFE05A', '#F4C08C', '#8FB4F0', '#6E93C7'] },
  },
  {
    id: 'editorial',
    name: 'Editorial',
    mode: 'light',
    blurb: 'Crisp white, ink-black type, one confident blue. Minimal.',
    swatch: ['#111827', '#2563EB', '#9CA3AF'],
    hero: {
      '--a-stage': 'linear-gradient(165deg,#F4F5F7 0%,#EDEFF2 100%)',
      '--a-win': '#FFFFFF', '--a-bar': '#FBFBFC', '--a-card': '#FFFFFF', '--a-line': 'rgba(17,24,39,.10)',
      '--a-ink': '#0B1220', '--a-mut': '#3F4A5A', '--a-mut2': '#8A93A0',
      '--a-steel': '#6B7280', '--a-lime': '#111827', '--a-lime-2': '#6B7280',
      '--a-peach': '#9CA3AF', '--a-peri': '#2563EB', '--a-green': '#059669', '--a-action': '#111827',
    },
    console: {
      '--bg': 'linear-gradient(165deg,#F4F5F7 0%,#EDEFF2 100%)',
      '--panel': '#FFFFFF', '--panel2': 'rgba(255,255,255,.7)', '--line': 'rgba(17,24,39,.10)', '--line2': 'rgba(17,24,39,.16)',
      '--text': '#0B1220', '--mut': '#3F4A5A', '--mut2': '#8A93A0',
      '--brand': '#111827', '--bright': '#2563EB', '--cream': '#EEF2FF', '--track': 'rgba(17,24,39,.07)',
      '--lime': '#111827', '--peach': '#9CA3AF', '--peri': '#2563EB', '--topbar': 'rgba(255,255,255,.85)',
    },
    viz: { stroke: '#111827', accent: '#2563EB', grid: 'rgba(17,24,39,.06)', donut: ['#111827', '#9CA3AF', '#2563EB', '#6B7280'] },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    mode: 'light',
    blurb: 'Warm cream and terracotta — the softest, calmest surface.',
    swatch: ['#E4572E', '#EE7B4E', '#E4B33F'],
    hero: {
      '--a-stage': 'linear-gradient(155deg,#FCEBDD 0%,#F7E2D8 46%,#F3D9CE 100%)',
      '--a-win': '#FFF6EF', '--a-bar': '#FDEFE4', '--a-card': '#FFFFFF', '--a-line': 'rgba(120,60,30,.10)',
      '--a-ink': '#3A241A', '--a-mut': '#7A5A48', '--a-mut2': '#A98A78',
      '--a-steel': '#E8905A', '--a-lime': '#E4B33F', '--a-lime-2': '#F0CE7C',
      '--a-peach': '#EE7B4E', '--a-peri': '#D98C6A', '--a-green': '#3F9E63', '--a-action': '#E4572E',
    },
    console: {
      '--bg': 'linear-gradient(155deg,#FCEBDD 0%,#F7E2D8 46%,#F3D9CE 100%)',
      '--panel': '#FFFFFF', '--panel2': 'rgba(255,248,242,.7)', '--line': 'rgba(120,60,30,.12)', '--line2': 'rgba(232,144,90,.30)',
      '--text': '#3A241A', '--mut': '#7A5A48', '--mut2': '#A98A78',
      '--brand': '#E4572E', '--bright': '#EE7B4E', '--cream': '#FBE0CE', '--track': 'rgba(120,60,30,.08)',
      '--lime': '#E4B33F', '--peach': '#EE7B4E', '--peri': '#D98C6A', '--topbar': 'rgba(255,246,239,.85)',
    },
    viz: { stroke: '#E4572E', accent: '#E4B33F', grid: 'rgba(120,60,30,.07)', donut: ['#E4B33F', '#EE7B4E', '#D98C6A', '#C96A28'] },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    mode: 'light',
    blurb: 'Cool blues and teal — a bright, focused command feel.',
    swatch: ['#1E6FE0', '#2BB6A6', '#7FA8E8'],
    hero: {
      '--a-stage': 'linear-gradient(155deg,#DCEAF4 0%,#D2E6F0 48%,#CFEDEA 100%)',
      '--a-win': '#EEF6FB', '--a-bar': '#F3F9FC', '--a-card': '#FFFFFF', '--a-line': 'rgba(15,50,80,.10)',
      '--a-ink': '#0E2A3D', '--a-mut': '#3D6076', '--a-mut2': '#6E93A6',
      '--a-steel': '#3E8FB0', '--a-lime': '#2BB6A6', '--a-lime-2': '#8FD9D0',
      '--a-peach': '#5AB4E0', '--a-peri': '#7FA8E8', '--a-green': '#0E9F8E', '--a-action': '#1E6FE0',
    },
    console: {
      '--bg': 'linear-gradient(155deg,#DCEAF4 0%,#D2E6F0 48%,#CFEDEA 100%)',
      '--panel': '#FFFFFF', '--panel2': 'rgba(240,248,252,.7)', '--line': 'rgba(15,50,80,.11)', '--line2': 'rgba(62,143,176,.30)',
      '--text': '#0E2A3D', '--mut': '#3D6076', '--mut2': '#6E93A6',
      '--brand': '#1E6FE0', '--bright': '#3E8FB0', '--cream': '#D6ECF5', '--track': 'rgba(15,50,80,.07)',
      '--lime': '#2BB6A6', '--peach': '#5AB4E0', '--peri': '#7FA8E8', '--topbar': 'rgba(240,248,252,.85)',
    },
    viz: { stroke: '#1E6FE0', accent: '#2BB6A6', grid: 'rgba(15,50,80,.06)', donut: ['#2BB6A6', '#5AB4E0', '#7FA8E8', '#3E8FB0'] },
  },
  {
    id: 'forest',
    name: 'Forest',
    mode: 'light',
    blurb: 'Sage and moss greens — a natural, low-glare palette.',
    swatch: ['#2F8F4E', '#8CBF3F', '#E0B36A'],
    hero: {
      '--a-stage': 'linear-gradient(155deg,#DDE7D6 0%,#D6E4CC 48%,#E4EAD2 100%)',
      '--a-win': '#F0F5EC', '--a-bar': '#F4F8EF', '--a-card': '#FFFFFF', '--a-line': 'rgba(30,55,30,.10)',
      '--a-ink': '#1E2E1C', '--a-mut': '#4E6247', '--a-mut2': '#7E9174',
      '--a-steel': '#6FA05A', '--a-lime': '#8CBF3F', '--a-lime-2': '#C2DE93',
      '--a-peach': '#E0B36A', '--a-peri': '#9BBE86', '--a-green': '#2E9E58', '--a-action': '#2F8F4E',
    },
    console: {
      '--bg': 'linear-gradient(155deg,#DDE7D6 0%,#D6E4CC 48%,#E4EAD2 100%)',
      '--panel': '#FFFFFF', '--panel2': 'rgba(244,248,239,.7)', '--line': 'rgba(30,55,30,.11)', '--line2': 'rgba(111,160,90,.30)',
      '--text': '#1E2E1C', '--mut': '#4E6247', '--mut2': '#7E9174',
      '--brand': '#2F8F4E', '--bright': '#6FA05A', '--cream': '#E1EBCF', '--track': 'rgba(30,55,30,.07)',
      '--lime': '#8CBF3F', '--peach': '#E0B36A', '--peri': '#9BBE86', '--topbar': 'rgba(244,248,239,.85)',
    },
    viz: { stroke: '#2F8F4E', accent: '#8CBF3F', grid: 'rgba(30,55,30,.06)', donut: ['#8CBF3F', '#E0B36A', '#9BBE86', '#6FA05A'] },
  },
]

export const DEFAULT_THEME_ID = 'aurora'

/** Resolve a theme id to its definition, falling back to the default. */
export function getThemeById(id: string | null | undefined): DesignTheme {
  return DESIGN_THEMES.find((t) => t.id === id) ?? DESIGN_THEMES[0]
}

/** CSS-var map for the hero window root (`.hs-demo`). */
export function heroThemeVars(t: DesignTheme): Record<string, string> {
  return t.hero
}

/** CSS-var map for the console root (`.hs-lcc`). */
export function consoleThemeVars(t: DesignTheme): Record<string, string> {
  return t.console
}
