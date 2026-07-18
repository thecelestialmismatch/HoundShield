'use client'

/**
 * useDashboardPrefs — the console's personal, per-device preferences: which
 * design theme is active and how the Overview sections are ordered / hidden.
 *
 * These are FREE for every user (founder direction, 2026-07-18: "flexible, not
 * rigid… for everyone, not gated by the subscription"). They persist to
 * localStorage on the operator's own device — no server, no account required,
 * and nothing about layout choices leaves the browser.
 *
 * SSR-safe: the first render always uses the defaults (so server and client
 * markup match), then a mount effect hydrates from storage. Stored data is
 * validated against the current section registry, so adding a new section later
 * (it appears, un-hidden, at the end) or removing one never corrupts a saved
 * layout.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DEFAULT_THEME_ID, getThemeById } from './design-themes'

/** The Overview sections a user can reorder / hide. Order here is the default
 *  order; the identity band + status strip above them are fixed anchors. */
export const OVERVIEW_SECTIONS: { id: string; label: string }[] = [
  { id: 'kpis', label: 'KPI tiles' },
  { id: 'brain', label: 'Ask Brain AI' },
  { id: 'charts', label: 'Overview charts' },
  { id: 'throughput', label: 'Throughput & detection mix' },
  { id: 'feed', label: 'Threat feed & SPRS posture' },
  { id: 'checklist', label: 'First-run checklist' },
  { id: 'engines', label: 'Detections by engine' },
]

const SECTION_IDS = OVERVIEW_SECTIONS.map((s) => s.id)
const THEME_KEY = 'hs.console.theme'
const LAYOUT_KEY = 'hs.console.layout'

interface StoredLayout {
  order: string[]
  hidden: string[]
}

/** Reconcile a stored order with the live registry: keep known ids in their
 *  saved order, then append any sections added since (so new features surface),
 *  and drop ids that no longer exist. */
function normalizeOrder(stored: string[] | undefined): string[] {
  const known = (stored ?? []).filter((id) => SECTION_IDS.includes(id))
  const missing = SECTION_IDS.filter((id) => !known.includes(id))
  return [...known, ...missing]
}

function normalizeHidden(stored: string[] | undefined): string[] {
  return (stored ?? []).filter((id) => SECTION_IDS.includes(id))
}

export interface DashboardPrefs {
  themeId: string
  /** Section ids in display order. */
  order: string[]
  /** Hidden section ids. */
  hidden: string[]
  /** True once hydrated from storage (before that, defaults render). */
  ready: boolean
  setTheme: (id: string) => void
  /** Move a section up (-1) or down (+1) among the VISIBLE sections. */
  move: (id: string, dir: -1 | 1) => void
  toggleHidden: (id: string) => void
  isHidden: (id: string) => boolean
  /** Display index for `order` CSS — smaller renders first. */
  orderOf: (id: string) => number
  reset: () => void
}

export function useDashboardPrefs(): DashboardPrefs {
  const [themeId, setThemeId] = useState<string>(DEFAULT_THEME_ID)
  const [order, setOrder] = useState<string[]>(SECTION_IDS)
  const [hidden, setHidden] = useState<string[]>([])
  const [ready, setReady] = useState(false)

  // Hydrate once on mount.
  useEffect(() => {
    try {
      const t = localStorage.getItem(THEME_KEY)
      if (t) setThemeId(getThemeById(t).id)
      const raw = localStorage.getItem(LAYOUT_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as StoredLayout
        setOrder(normalizeOrder(parsed.order))
        setHidden(normalizeHidden(parsed.hidden))
      }
    } catch {
      /* corrupt / unavailable storage → keep defaults */
    }
    setReady(true)
  }, [])

  // Persist theme.
  const setTheme = useCallback((id: string) => {
    const resolved = getThemeById(id).id
    setThemeId(resolved)
    try { localStorage.setItem(THEME_KEY, resolved) } catch { /* ignore */ }
  }, [])

  const persistLayout = useCallback((nextOrder: string[], nextHidden: string[]) => {
    try { localStorage.setItem(LAYOUT_KEY, JSON.stringify({ order: nextOrder, hidden: nextHidden })) } catch { /* ignore */ }
  }, [])

  const move = useCallback((id: string, dir: -1 | 1) => {
    setOrder((cur) => {
      const i = cur.indexOf(id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= cur.length) return cur
      const next = cur.slice()
      ;[next[i], next[j]] = [next[j], next[i]]
      persistLayout(next, hidden)
      return next
    })
  }, [hidden, persistLayout])

  const toggleHidden = useCallback((id: string) => {
    setHidden((cur) => {
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
      persistLayout(order, next)
      return next
    })
  }, [order, persistLayout])

  const reset = useCallback(() => {
    setOrder(SECTION_IDS)
    setHidden([])
    persistLayout(SECTION_IDS, [])
  }, [persistLayout])

  const orderOf = useCallback((id: string) => {
    const i = order.indexOf(id)
    return i < 0 ? OVERVIEW_SECTIONS.length : i
  }, [order])

  const isHidden = useCallback((id: string) => hidden.includes(id), [hidden])

  return useMemo(
    () => ({ themeId, order, hidden, ready, setTheme, move, toggleHidden, isHidden, orderOf, reset }),
    [themeId, order, hidden, ready, setTheme, move, toggleHidden, isHidden, orderOf, reset],
  )
}
