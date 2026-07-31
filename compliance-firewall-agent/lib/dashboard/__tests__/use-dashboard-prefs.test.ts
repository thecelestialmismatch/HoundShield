import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useDashboardPrefs, OVERVIEW_SECTIONS, SIGNED_IN_STRIPPED_HIDDEN } from '../use-dashboard-prefs'

const IDS = OVERVIEW_SECTIONS.map((s) => s.id)
const THEME_KEY = 'hs.console.theme'
const LAYOUT_KEY = 'hs.console.layout'

beforeEach(() => localStorage.clear())

describe('useDashboardPrefs — free, per-device console personalization', () => {
  it('defaults to aurora + the registry order, nothing hidden', () => {
    const { result } = renderHook(() => useDashboardPrefs())
    expect(result.current.themeId).toBe('aurora')
    expect(result.current.order).toEqual(IDS)
    expect(result.current.hidden).toEqual([])
    expect(result.current.ready).toBe(true)
  })

  /**
   * REVERSAL, founder direction 2026-07-31 (supersedes 2026-07-23).
   *
   * This set used to be ['kpis','charts','throughput','feed','engines'] — every
   * telemetry panel hidden from a signed-in operator. That was right while those
   * panels were SIMULATED: hiding invented security metrics beat showing them.
   *
   * Signed-in operators now render OperatorOverview, where every panel reads
   * their own gateway events / their own on-device assessment / their own
   * posture history, and shows an explicit empty state when a source is empty.
   * With nothing dishonest left to hide, nothing starts hidden.
   *
   * The two changes are a package: re-introducing a stripped default without
   * also reverting to simulated panels would hide a customer's REAL data from
   * them, which is a different bug wearing the old fix's clothes.
   */
  it('a signed-in operator starts with NOTHING hidden — the panels are real now', () => {
    const { result } = renderHook(() => useDashboardPrefs(SIGNED_IN_STRIPPED_HIDDEN))
    expect(SIGNED_IN_STRIPPED_HIDDEN).toEqual([])
    for (const id of IDS) {
      expect(result.current.isHidden(id), `${id} must not start hidden`).toBe(false)
    }
  })

  it('reset returns to that baseline, and Customize still hides on demand', () => {
    const { result } = renderHook(() => useDashboardPrefs(SIGNED_IN_STRIPPED_HIDDEN))
    // Hiding remains a free, per-device operator choice — only the DEFAULT moved.
    act(() => result.current.toggleHidden('kpis'))
    expect(result.current.isHidden('kpis')).toBe(true)
    act(() => result.current.reset())
    expect(result.current.hidden).toEqual(SIGNED_IN_STRIPPED_HIDDEN)
    expect(result.current.isHidden('kpis')).toBe(false)
  })

  it('carries the sections the operator dashboard adds', () => {
    // `posture` (SPRS trend + risk radar) and `actions` (quick actions) are the
    // panels the founder asked to see at login; they must be reorderable too.
    expect(IDS).toContain('posture')
    expect(IDS).toContain('actions')
  })

  it('a stored per-device layout still overrides the signed-in default', () => {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify({ order: IDS, hidden: ['brain'] }))
    const { result } = renderHook(() => useDashboardPrefs(SIGNED_IN_STRIPPED_HIDDEN))
    // The operator's own saved choice wins over the stripped default.
    expect(result.current.hidden).toEqual(['brain'])
  })

  it('persists a theme choice and resolves unknown ids to the default', () => {
    const { result } = renderHook(() => useDashboardPrefs())
    act(() => result.current.setTheme('midnight'))
    expect(result.current.themeId).toBe('midnight')
    expect(localStorage.getItem(THEME_KEY)).toBe('midnight')
    act(() => result.current.setTheme('does-not-exist'))
    expect(result.current.themeId).toBe('aurora')
  })

  it('reorders sections and persists the new order', () => {
    const { result } = renderHook(() => useDashboardPrefs())
    act(() => result.current.move('kpis', 1))
    expect(result.current.order[0]).toBe(IDS[1]) // brain rose above kpis
    expect(result.current.order[1]).toBe('kpis')
    const stored = JSON.parse(localStorage.getItem(LAYOUT_KEY)!)
    expect(stored.order[1]).toBe('kpis')
  })

  it('clamps moves at the edges (no wrap, no corruption)', () => {
    const { result } = renderHook(() => useDashboardPrefs())
    act(() => result.current.move('kpis', -1)) // already first
    expect(result.current.order).toEqual(IDS)
    act(() => result.current.move(IDS[IDS.length - 1], 1)) // already last
    expect(result.current.order).toEqual(IDS)
  })

  it('hides and shows a section, reflected in isHidden + storage', () => {
    const { result } = renderHook(() => useDashboardPrefs())
    act(() => result.current.toggleHidden('engines'))
    expect(result.current.isHidden('engines')).toBe(true)
    expect(JSON.parse(localStorage.getItem(LAYOUT_KEY)!).hidden).toContain('engines')
    act(() => result.current.toggleHidden('engines'))
    expect(result.current.isHidden('engines')).toBe(false)
  })

  it('reset restores defaults and clears the saved layout', () => {
    const { result } = renderHook(() => useDashboardPrefs())
    act(() => { result.current.move('kpis', 1); result.current.toggleHidden('feed') })
    act(() => result.current.reset())
    expect(result.current.order).toEqual(IDS)
    expect(result.current.hidden).toEqual([])
  })

  it('hydrates a saved layout and reconciles unknown / missing ids', () => {
    // A previously-saved order that references a since-removed section ("ghost")
    // and omits one current section ("engines"): the ghost is dropped and the
    // missing section reappears at the end.
    localStorage.setItem(THEME_KEY, 'ocean')
    localStorage.setItem(
      LAYOUT_KEY,
      JSON.stringify({ order: ['ghost', 'feed', 'kpis'], hidden: ['brain', 'ghost'] }),
    )
    const { result } = renderHook(() => useDashboardPrefs())
    expect(result.current.themeId).toBe('ocean')
    expect(result.current.order).not.toContain('ghost')
    expect(result.current.order[0]).toBe('feed')
    expect(result.current.order).toContain('engines') // missing → appended
    expect(result.current.order).toHaveLength(IDS.length)
    expect(result.current.hidden).toEqual(['brain']) // ghost stripped
  })

  it('survives corrupt stored JSON without throwing', () => {
    localStorage.setItem(LAYOUT_KEY, '{not valid json')
    const { result } = renderHook(() => useDashboardPrefs())
    expect(result.current.order).toEqual(IDS)
    expect(result.current.ready).toBe(true)
  })
})
