import { describe, it, expect } from 'vitest'
import {
  aggregateOverview,
  emptyTelemetry,
  median,
  outcomeOf,
  toRecentEvents,
  type TelemetryEventRow,
} from '../overview-telemetry'

/**
 * The operator dashboard's aggregation contract.
 *
 * The panels this feeds replaced a mockup whose every number was invented, so
 * the tests that matter most here are the honesty ones: an empty input must
 * produce a visibly empty output (never a plausible shape), and a full window
 * must bucket to exactly the counts that went in.
 */

const HOUR = 3_600_000
const DAY = 86_400_000

/**
 * 2026-07-31T12:30:00Z — a fixed clock so bucketing is deterministic.
 *
 * Deliberately mid-hour. On an exact hour boundary the newest bucket has zero
 * elapsed time, so "5 minutes ago" belongs to the PREVIOUS bucket — correct
 * behaviour, but a confusing fixture to reason about.
 */
const NOW = Date.UTC(2026, 6, 31, 12, 30, 0)

function ev(over: Partial<TelemetryEventRow> & { created_at: string }): TelemetryEventRow {
  return {
    destination_provider: 'openai',
    risk_level: 'LOW',
    classifications: [],
    action_taken: 'ALLOWED',
    processing_time_ms: 8,
    ...over,
  }
}

describe('outcomeOf — three buckets, and QUARANTINED reads as a warning', () => {
  it('maps every stored action', () => {
    expect(outcomeOf('ALLOWED')).toBe('passed')
    expect(outcomeOf('BLOCKED')).toBe('blocked')
    expect(outcomeOf('QUARANTINED')).toBe('warning')
  })

  it('treats an unknown action as passed rather than throwing', () => {
    // A future action value must not blank an operator's dashboard.
    expect(outcomeOf('SOMETHING_NEW')).toBe('passed')
  })
})

describe('median', () => {
  it('is null with no samples — never 0, which would read as "instant"', () => {
    expect(median([])).toBeNull()
  })
  it('picks the middle value', () => {
    expect(median([9, 1, 5])).toBe(5)
  })
  it('takes the lower middle on an even count', () => {
    expect(median([1, 5, 9, 20])).toBe(5)
  })
  it('does not mutate its input', () => {
    const input = [3, 1, 2]
    median(input)
    expect(input).toEqual([3, 1, 2])
  })
})

describe('aggregateOverview — the empty case is the honest case', () => {
  const t = aggregateOverview([], { now: NOW })

  it('reports NOT connected when the customer has no events', () => {
    expect(t.connected).toBe(false)
    expect(t.totals.events).toBe(0)
  })

  it('invents nothing — no providers, no detections, no latency', () => {
    expect(t.providers).toEqual([])
    expect(t.detections).toEqual([])
    expect(t.riskMix).toEqual([])
    expect(t.scanP50Ms).toBeNull()
  })

  it('still returns full-length axes, so an empty chart keeps its shape', () => {
    expect(t.hourly).toHaveLength(24)
    expect(t.daily).toHaveLength(7)
    expect(t.hourly.every((h) => h.events === 0)).toBe(true)
  })

  it('emptyTelemetry() agrees with aggregating nothing', () => {
    expect(emptyTelemetry().connected).toBe(false)
    expect(emptyTelemetry().hourly).toHaveLength(24)
  })
})

describe('aggregateOverview — counts', () => {
  const rows: TelemetryEventRow[] = [
    ev({ created_at: new Date(NOW - 5 * 60_000).toISOString(), action_taken: 'BLOCKED', risk_level: 'CRITICAL', classifications: ['CUI'], processing_time_ms: 6 }),
    ev({ created_at: new Date(NOW - 30 * 60_000).toISOString(), action_taken: 'ALLOWED', processing_time_ms: 10 }),
    ev({ created_at: new Date(NOW - 2 * HOUR).toISOString(), action_taken: 'QUARANTINED', risk_level: 'HIGH', classifications: ['PHI', 'PII'], destination_provider: 'anthropic', processing_time_ms: 14 }),
    // No recorded latency — must be excluded from p50, not counted as 0ms.
    ev({ created_at: new Date(NOW - 2 * DAY).toISOString(), action_taken: 'BLOCKED', risk_level: 'HIGH', classifications: ['CUI'], destination_provider: 'anthropic', processing_time_ms: null }),
  ]
  const t = aggregateOverview(rows, { now: NOW })

  it('is connected and totals every event in the window', () => {
    expect(t.connected).toBe(true)
    expect(t.totals.events).toBe(4)
    expect(t.totals.blocked).toBe(2)
    expect(t.totals.warning).toBe(1)
    expect(t.totals.passed).toBe(1)
  })

  it('computes the block rate to one decimal', () => {
    expect(t.totals.blockRatePct).toBe(50)
  })

  it('buckets the last 24h by hour, newest last', () => {
    const total = t.hourly.reduce((s, h) => s + h.events, 0)
    expect(total).toBe(3) // the 2-day-old event is outside the 24h axis
    expect(t.hourly[23].events).toBe(2) // both events inside the current hour
    expect(t.hourly[23].blocked).toBe(1)
    expect(t.hourly[21].events).toBe(1) // two hours back
  })

  it('buckets by day, with today last', () => {
    expect(t.daily).toHaveLength(7)
    expect(t.daily[6].events).toBe(3)
    expect(t.daily[4].events).toBe(1) // two days ago
    expect(t.daily.reduce((s, d) => s + d.events, 0)).toBe(4)
  })

  it('splits providers by outcome, busiest first', () => {
    expect(t.providers.map((p) => p.provider)).toEqual(['anthropic', 'openai'])
    expect(t.providers[0]).toMatchObject({ total: 2, warning: 1, blocked: 1, passed: 0 })
    expect(t.providers[1]).toMatchObject({ total: 2, blocked: 1, passed: 1 })
  })

  it('breaks volume ties by name, so equal providers do not reshuffle on refresh', () => {
    // Same data, opposite arrival order: the rendered order must not change.
    const reversed = aggregateOverview([...rows].reverse(), { now: NOW })
    expect(reversed.providers.map((p) => p.provider)).toEqual(['anthropic', 'openai'])
  })

  it('counts severity for BLOCKED events only', () => {
    // The quarantined HIGH event is not a block, so it must not inflate the mix.
    expect(t.riskMix).toEqual([
      { name: 'CRITICAL', count: 1 },
      { name: 'HIGH', count: 1 },
    ])
  })

  it('counts every classification across events, busiest first', () => {
    expect(t.detections[0]).toEqual({ name: 'CUI', count: 2 })
    expect(t.detections.map((d) => d.name).sort()).toEqual(['CUI', 'PHI', 'PII'])
  })

  it('takes p50 only from events that recorded a latency', () => {
    // 6, 10, 14 recorded; the fourth row has null and must not count as 0.
    expect(t.scanP50Ms).toBe(10)
  })
})

describe('aggregateOverview — rejects data it cannot place', () => {
  it('drops rows outside the window rather than clamping them into it', () => {
    const t = aggregateOverview(
      [ev({ created_at: new Date(NOW - 30 * DAY).toISOString() })],
      { now: NOW, windowDays: 7 },
    )
    expect(t.connected).toBe(false)
    expect(t.totals.events).toBe(0)
  })

  it('drops future-dated rows', () => {
    const t = aggregateOverview([ev({ created_at: new Date(NOW + DAY).toISOString() })], { now: NOW })
    expect(t.totals.events).toBe(0)
  })

  it('drops unparseable timestamps instead of bucketing them as "now"', () => {
    const t = aggregateOverview([ev({ created_at: 'not-a-date' })], { now: NOW })
    expect(t.totals.events).toBe(0)
  })

  it('honours a wider window', () => {
    const t = aggregateOverview(
      [ev({ created_at: new Date(NOW - 20 * DAY).toISOString() })],
      { now: NOW, windowDays: 30 },
    )
    expect(t.totals.events).toBe(1)
    expect(t.windowDays).toBe(30)
  })

  it('labels a missing provider rather than dropping the event', () => {
    const t = aggregateOverview(
      [ev({ created_at: new Date(NOW - 60_000).toISOString(), destination_provider: null })],
      { now: NOW },
    )
    expect(t.providers[0].provider).toBe('Local / unknown')
    expect(t.totals.events).toBe(1)
  })

  it('survives a null classifications array', () => {
    const t = aggregateOverview(
      [ev({ created_at: new Date(NOW - 60_000).toISOString(), classifications: null })],
      { now: NOW },
    )
    expect(t.detections).toEqual([])
  })
})

describe('toRecentEvents — metadata only', () => {
  const rows: TelemetryEventRow[] = [
    ev({
      id: '3a7f2c19-0000-4000-8000-000000000000',
      created_at: new Date(NOW).toISOString(),
      action_taken: 'BLOCKED',
      risk_level: 'CRITICAL',
      classifications: ['CUI', 'Secrets'],
    }),
  ]

  it('derives the display ref from the row’s own id', () => {
    expect(toRecentEvents(rows)[0].ref).toBe('evt_3a7f2c')
  })

  it('joins detections for display and keeps the outcome', () => {
    expect(toRecentEvents(rows)[0].detected).toBe('CUI · Secrets')
    expect(toRecentEvents(rows)[0].outcome).toBe('blocked')
  })

  it('leaves `detected` empty for a clean request — never a filler label', () => {
    const clean = toRecentEvents([ev({ id: 'abc', created_at: new Date(NOW).toISOString() })])
    expect(clean[0].detected).toBe('')
  })

  it('never surfaces a field that was not selected', () => {
    // The prompt hash is deliberately not queried; assert the shape stays closed
    // so a future `select('*')` cannot quietly widen what reaches the browser.
    expect(Object.keys(toRecentEvents(rows)[0]).sort()).toEqual(
      ['createdAt', 'detected', 'outcome', 'provider', 'ref', 'risk', 'scanMs'],
    )
  })

  it('respects the limit', () => {
    const many = Array.from({ length: 20 }, (_, i) =>
      ev({ id: `id${i}`, created_at: new Date(NOW - i * 1000).toISOString() }))
    expect(toRecentEvents(many, 8)).toHaveLength(8)
  })
})
