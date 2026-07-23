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

/**
 * Default hidden set for a SIGNED-IN operator: the simulated telemetry panels
 * (KPI tiles, charts, throughput/detection-mix, threat feed, engine bars) start
 * hidden so a logged-in user lands on a stripped, real dashboard — their next
 * actions (Ask Brain AI + the activation checklist that ends on the PDF), not a
 * wall of demo numbers. Anything here can be brought back via Customize. The
 * anonymous public demo passes NOTHING (keeps every panel — it's a marketing
 * preview). Founder direction 2026-07-23: "strip it way down."
 */
export const SIGNED_IN_STRIPPED_HIDDEN = ['kpis', 'charts', 'throughput', 'feed', 'engines']

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

export function useDashboardPrefs(defaultHidden: string[] = []): DashboardPrefs {
  const [themeId, setThemeId] = useState<string>(DEFAULT_THEME_ID)
  const [order, setOrder] = useState<string[]>(SECTION_IDS)
  // Initial hidden = the caller's default (stripped set for signed-in operators,
  // [] for the public demo). Same on server and client because it derives from a
  // prop, so no hydration mismatch; a stored per-device layout overrides on mount.
  const [hidden, setHidden] = useState<string[]>(() => normalizeHidden(defaultHidden))
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
    // Reset returns to the caller's baseline (the stripped default for a
    // signed-in operator, empty for the demo) — not a blanket "show everything".
    const base = normalizeHidden(defaultHidden)
    setOrder(SECTION_IDS)
    setHidden(base)
    persistLayout(SECTION_IDS, base)
  }, [persistLayout, defaultHidden])

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
