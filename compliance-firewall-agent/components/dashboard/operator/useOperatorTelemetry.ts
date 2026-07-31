'use client'

/**
 * The operator dashboard's data layer — one hook that assembles the three
 * genuinely different sources behind the Command Center overview:
 *
 *   1. GATEWAY TELEMETRY  — server, `/api/dashboard/overview`, scoped to the
 *      session's own `compliance_events`.
 *   2. SPRS POSTURE       — the operator's DEVICE. The 110-control assessment
 *      lives in localStorage and is never uploaded, so the radar and the score
 *      are computed here, in the browser, from their own answers.
 *   3. POSTURE HISTORY    — server, `/api/customer/status/snapshot`, the sparse
 *      series of consented posture snapshots that backs the trend chart.
 *
 * None of the three has a seeded fallback. Every one reports "empty" honestly
 * and lets the panels render an empty state, because the dashboard this
 * replaces was deleted precisely for filling those gaps with invented numbers.
 *
 * SSR-safe: localStorage is only touched inside effects, so the first render
 * matches the server's.
 */

import { useCallback, useEffect, useState } from 'react'
import { ALL_CONTROLS } from '@/lib/shieldready/controls'
import { getAssessmentResponses } from '@/lib/shieldready/storage'
import { ASSESSMENT_UPDATED_EVENT } from '@/lib/shieldready/events'
import { buildSprsPosture, type SprsPosture } from '@/lib/dashboard/sprs-posture'
import {
  emptyTelemetry,
  type OverviewTelemetry,
  type RecentEvent,
} from '@/lib/dashboard/overview-telemetry'

export interface SprsHistoryPoint {
  score: number
  completion: number
  at: string
}

export type TelemetryWindow = 1 | 7 | 30

export interface OperatorTelemetry {
  tel: OverviewTelemetry
  recent: RecentEvent[]
  posture: SprsPosture
  history: SprsHistoryPoint[]
  /** True while the first (or a manually triggered) fetch is in flight. */
  loading: boolean
  /** Set when the telemetry request failed. Distinct from "no data": the UI
   *  must not render an empty dashboard when the truth is "we could not ask". */
  error: string | null
  /** True once the query returned the row cap, so the UI can disclose it
   *  instead of silently under-reporting. */
  truncated: boolean
  windowDays: TelemetryWindow
  setWindowDays: (d: TelemetryWindow) => void
  refresh: () => void
  /** ISO timestamp of the last successful telemetry fetch, or null. */
  lastUpdated: string | null
}

/** Read the on-device assessment. Safe to call only in the browser. */
function readPosture(): SprsPosture {
  return buildSprsPosture(ALL_CONTROLS, getAssessmentResponses())
}

export function useOperatorTelemetry(): OperatorTelemetry {
  const [tel, setTel] = useState<OverviewTelemetry>(() => emptyTelemetry())
  const [recent, setRecent] = useState<RecentEvent[]>([])
  const [history, setHistory] = useState<SprsHistoryPoint[]>([])
  // The server render and the first client render must agree, so posture starts
  // from an empty assessment and hydrates in the mount effect below.
  const [posture, setPosture] = useState<SprsPosture>(() => buildSprsPosture(ALL_CONTROLS, []))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [truncated, setTruncated] = useState(false)
  const [windowDays, setWindowDays] = useState<TelemetryWindow>(7)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  const refresh = useCallback(() => setNonce((n) => n + 1), [])

  // ── On-device posture: hydrate on mount, and stay in sync when the operator
  //    answers controls on the Assessment tab (same-tab custom event) or in
  //    another tab (storage event). ────────────────────────────────────────────
  useEffect(() => {
    const sync = () => setPosture(readPosture())
    sync()
    window.addEventListener(ASSESSMENT_UPDATED_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(ASSESSMENT_UPDATED_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  // ── Gateway telemetry ──────────────────────────────────────────────────────
  useEffect(() => {
    const ac = new AbortController()
    ;(async () => {
      // Inside the async body, not the effect body: a synchronous setState here
      // would queue a second render before the fetch even starts.
      setLoading(true)
      try {
        const res = await fetch(`/api/dashboard/overview?days=${windowDays}`, {
          signal: ac.signal,
          cache: 'no-store',
        })
        if (!res.ok) throw new Error(`overview ${res.status}`)
        const body = await res.json()
        const { recent: rows = [], truncated: cap = false, ...telemetry } = body
        setTel(telemetry as OverviewTelemetry)
        setRecent(rows as RecentEvent[])
        setTruncated(Boolean(cap))
        setLastUpdated(new Date().toISOString())
        setError(null)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        // Keep the previous good data on screen rather than blanking it; the
        // banner says the refresh failed.
        setError('Could not load your gateway telemetry.')
      } finally {
        if (!ac.signal.aborted) setLoading(false)
      }
    })()
    return () => ac.abort()
  }, [windowDays, nonce])

  // ── Posture history (trend). Failure is silent by design: an unavailable
  //    history is indistinguishable from "no snapshots yet" to the operator,
  //    and both render the same honest "not enough history" panel. ────────────
  useEffect(() => {
    const ac = new AbortController()
    ;(async () => {
      try {
        const res = await fetch('/api/customer/status/snapshot', { signal: ac.signal, cache: 'no-store' })
        if (!res.ok) return
        const body = await res.json()
        if (Array.isArray(body.points)) setHistory(body.points as SprsHistoryPoint[])
      } catch {
        /* leave history empty */
      }
    })()
    return () => ac.abort()
  }, [nonce])

  return {
    tel, recent, posture, history, loading, error, truncated,
    windowDays, setWindowDays, refresh, lastUpdated,
  }
}
