import { describe, it, expect } from 'vitest'
import { aggregateOverview, type TelemetryEventRow } from '../overview-telemetry'
import { actorLabel, identifyActor } from '@/lib/gateway/actor'

const NOW = Date.parse('2026-08-07T21:00:00.000Z')

function row(over: Partial<TelemetryEventRow> = {}): TelemetryEventRow {
  return {
    created_at: new Date(NOW - 3_600_000).toISOString(),
    destination_provider: 'OpenAI',
    risk_level: 'NONE',
    classifications: [],
    action_taken: 'ALLOWED',
    processing_time_ms: 2,
    ...over,
  }
}

const withActor = (kind: string, client: string | null, over: Partial<TelemetryEventRow> = {}) =>
  row({ ...over, metadata: { actor: { kind, client } } })

const agg = (rows: TelemetryEventRow[]) => aggregateOverview(rows, { now: NOW, windowDays: 7 })

describe('actor aggregation', () => {
  it('counts prompts per sender and splits out the blocked ones', () => {
    const tel = agg([
      withActor('agent', 'Claude Code'),
      withActor('agent', 'Claude Code'),
      withActor('agent', 'Claude Code', { action_taken: 'BLOCKED', risk_level: 'HIGH' }),
      withActor('browser', 'Browser'),
    ])

    const claude = tel.actors.find((a) => a.name === 'Claude Code')!
    expect(claude.count).toBe(3)
    expect(claude.blocked).toBe(1)
    expect(claude.kind).toBe('agent')
  })

  it('reports autonomous events — the number a compliance officer asks for', () => {
    const tel = agg([
      withActor('agent', 'Cursor'),
      withActor('agent', 'Aider'),
      withActor('browser', 'Browser'),
      withActor('sdk', 'curl'),
    ])
    expect(tel.autonomousEvents).toBe(2)
  })

  it('puts agents first even when a browser is busier', () => {
    // Sorting purely by volume buries the one row that matters under a thousand
    // human prompts. Agents lead regardless of count.
    const tel = agg([
      ...Array.from({ length: 50 }, () => withActor('browser', 'Browser')),
      withActor('agent', 'Goose'),
    ])
    expect(tel.actors[0].name).toBe('Goose')
    expect(tel.actors[0].kind).toBe('agent')
  })

  it('keeps two clients of the same name in different kinds apart', () => {
    const tel = agg([withActor('agent', 'Custom'), withActor('sdk', 'Custom')])
    expect(tel.actors).toHaveLength(2)
    expect(tel.actors.map((a) => a.kind).sort()).toEqual(['agent', 'sdk'])
  })
})

describe('honesty — what it refuses to invent', () => {
  it('excludes rows with no actor rather than bucketing them as a person', () => {
    // Events written before attribution shipped carry no actor. Calling those
    // "Browser" would be a fabricated attribution in an audit log.
    const tel = agg([row(), row(), withActor('agent', 'Cursor')])

    expect(tel.totals.events).toBe(3)
    expect(tel.actors.reduce((n, a) => n + a.count, 0)).toBe(1)
    expect(tel.actors.map((a) => a.name)).toEqual(['Cursor'])
  })

  it('never counts an unattributed row as autonomous', () => {
    expect(agg([row(), row()]).autonomousEvents).toBe(0)
  })

  it('falls back to a neutral label instead of naming a client it does not know', () => {
    const tel = agg([withActor('agent', null), withActor('sdk', ''), withActor('unknown', null)])
    expect(tel.actors.map((a) => a.name).sort()).toEqual([
      'Unidentified',
      'Unnamed agent',
      'Unnamed script',
    ])
  })

  it('treats an unrecognised kind as unknown rather than trusting it into a new bucket', () => {
    // metadata is jsonb; nothing stops a future writer storing something else.
    const tel = agg([withActor('superuser', 'Sneaky')])
    expect(tel.actors[0].kind).toBe('unknown')
    expect(tel.autonomousEvents).toBe(0)
  })

  it('is empty, not zero-filled, when nothing has an actor', () => {
    const tel = agg([row()])
    expect(tel.actors).toEqual([])
  })
})

describe('the fallback labels match the gateway', () => {
  it('agrees with actorLabel() for every kind', () => {
    // FALLBACK_ACTOR_NAME in overview-telemetry duplicates actorLabel() so the
    // aggregator stays dependency-free. This reconciles the two copies.
    const cases = [
      ['agent', 'Unnamed agent'],
      ['sdk', 'Unnamed script'],
      ['browser', 'Browser'],
      ['unknown', 'Unidentified'],
    ] as const

    for (const [kind, expected] of cases) {
      expect(actorLabel({ kind, client: null, title: null, ua: null })).toBe(expected)
      expect(agg([withActor(kind, null)]).actors[0].name).toBe(expected)
    }
  })
})

describe('end to end — a real agent User-Agent reaches the dashboard', () => {
  it('turns a Claude Code request header into a dashboard row', () => {
    const actor = identifyActor(new Headers({ 'user-agent': 'claude-cli/2.1.0 (external, cli)' }))
    const tel = agg([row({ metadata: { actor } })])

    expect(tel.actors[0]).toMatchObject({ name: 'Claude Code', kind: 'agent', count: 1 })
    expect(tel.autonomousEvents).toBe(1)
  })
})
