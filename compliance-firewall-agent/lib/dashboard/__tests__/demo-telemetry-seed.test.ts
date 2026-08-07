import { describe, it, expect, afterEach } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import {
  generateDemoTelemetry,
  demoAccountEmail,
  DEMO_SEED_TAG,
  MAX_SEED_ROWS,
} from '../demo-telemetry-seed'
import { aggregateOverview, outcomeOf } from '../overview-telemetry'

/**
 * This fixture is written into a production table, so it gets held to the same
 * standard as the code that reads it. Three things must hold:
 *
 *   1. It is honest — every row self-declares as synthetic, so the dashboard can
 *      label itself and one DELETE undoes the seed.
 *   2. It is safe to re-run — deterministic, bounded, never in the future.
 *   3. It actually exercises the dashboard — every panel gets non-degenerate
 *      data, which is the entire point of generating it.
 */

const NOW = new Date('2026-08-07T21:00:00.000Z')
const USER = '42a9a3ac-9de0-429d-8579-ab2d917e666e'
const rows = generateDemoTelemetry({ userId: USER, now: NOW })

describe('honesty — the fixture declares itself', () => {
  it('marks every single row synthetic and taggable', () => {
    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) {
      expect(row.metadata.synthetic).toBe(true)
      expect(row.metadata.demo_seed).toBe(DEMO_SEED_TAG)
    }
  })

  it('is reversible by the marker alone', () => {
    // A DELETE on (user_id, metadata->>demo_seed) must reach 100% of the rows,
    // or a seed run leaves orphans behind that nobody can find later.
    const taggable = rows.filter((r) => r.metadata.demo_seed === DEMO_SEED_TAG)
    expect(taggable).toHaveLength(rows.length)
  })

  it('never attaches rows to more than one account', () => {
    expect(new Set(rows.map((r) => r.user_id))).toEqual(new Set([USER]))
  })
})

describe('targeting — the account is configuration, never source', () => {
  const original = process.env.DEMO_ACCOUNT_EMAIL
  afterEach(() => {
    if (original === undefined) delete process.env.DEMO_ACCOUNT_EMAIL
    else process.env.DEMO_ACCOUNT_EMAIL = original
  })

  it('returns null when unset, so the seed script stops instead of guessing', () => {
    delete process.env.DEMO_ACCOUNT_EMAIL
    expect(demoAccountEmail()).toBeNull()
  })

  it('treats blank and whitespace as unset', () => {
    process.env.DEMO_ACCOUNT_EMAIL = '   '
    expect(demoAccountEmail()).toBeNull()
  })

  it('reads the configured address', () => {
    process.env.DEMO_ACCOUNT_EMAIL = 'demo@example.com'
    expect(demoAccountEmail()).toBe('demo@example.com')
  })

  it('commits no personal mailbox to this public repository', () => {
    // Same rule lib/email/identity.ts states for FOUNDER_EMAIL, and the reason
    // the address moved out of a constant: cloning the repo must not hand anyone
    // the founder's inbox.
    const src = readFileSync(path.join(__dirname, '../demo-telemetry-seed.ts'), 'utf8')
    const mailboxes = src.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) ?? []
    expect(mailboxes).toEqual([])
  })

  it('offers no way to target an arbitrary tenant from the command line', () => {
    const script = readFileSync(path.join(__dirname, '../../../scripts/seed-demo-telemetry.mjs'), 'utf8')

    // The complete set of switches the script reads. Anything that names a
    // target here would turn a demo fixture into a tool that can write
    // fabricated events into a real customer's audit evidence.
    const flags = [...script.matchAll(/argv\.includes\('(--[a-z-]+)'\)/g)].map((m) => m[1]).sort()
    expect(flags).toEqual(['--clear', '--dry'])

    // No positional argument either — the target comes from the environment only.
    expect(script).not.toMatch(/argv\[\d]/)
    expect(script).toMatch(/demoAccountEmail\(\)/)
    // And it must refuse to touch an account that already holds real traffic.
    expect(script).toMatch(/refusing to run/)
  })
})

describe('safety — re-running cannot corrupt anything', () => {
  it('is byte-for-byte deterministic', () => {
    const again = generateDemoTelemetry({ userId: USER, now: NOW })
    expect(JSON.stringify(again)).toBe(JSON.stringify(rows))
  })

  it('stays under the aggregation cap, so the 30-day view never truncates', () => {
    // MAX_ROWS in app/api/dashboard/overview/route.ts is 5,000. A dataset that
    // trips it makes the product look like it silently drops evidence.
    expect(rows.length).toBeLessThanOrEqual(MAX_SEED_ROWS)
    expect(rows.length).toBeLessThan(5_000)
  })

  it('contains no event in the future and none outside the window', () => {
    const oldest = new Date(NOW.getTime() - 30 * 86_400_000).getTime()
    for (const row of rows) {
      const t = new Date(row.created_at).getTime()
      expect(t).toBeLessThanOrEqual(NOW.getTime())
      expect(t).toBeGreaterThanOrEqual(oldest)
    }
  })

  it('emits rows in chronological order', () => {
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].created_at >= rows[i - 1].created_at).toBe(true)
    }
  })
})

describe('integrity — the hash chain is a real chain', () => {
  it('links each anchor to the one before it', () => {
    const sha = (s: string) => createHash('sha256').update(s).digest('hex')
    let previous = sha(`${DEMO_SEED_TAG}:genesis:${USER}`)

    for (const row of rows) {
      previous = sha(`${previous}${row.prompt_hash}`)
      expect(row.seed_hash).toBe(previous)
    }
  })

  it('produces 64-char hex anchors, which is what the audit export verifies', () => {
    for (const row of rows) {
      expect(row.seed_hash).toMatch(/^[0-9a-f]{64}$/)
      expect(row.prompt_hash).toMatch(/^[0-9a-f]{64}$/)
    }
  })

  it('never repeats a prompt hash', () => {
    expect(new Set(rows.map((r) => r.prompt_hash)).size).toBe(rows.length)
  })
})

describe('shape — the numbers are plausible, not theatrical', () => {
  const tel = aggregateOverview(rows, { now: NOW.getTime(), windowDays: 30 })

  it('blocks a low single-digit percentage, like a working deployment', () => {
    // A 40% block rate is a broken integration, not an impressive one.
    expect(tel.totals.blockRatePct).toBeGreaterThan(1)
    expect(tel.totals.blockRatePct).toBeLessThan(6)
  })

  it('keeps p99 scan latency under the 10ms the product claims', () => {
    expect(tel.scanP50Ms).toBeGreaterThan(0) // never "0ms", which reads as broken
    expect(tel.scanP99Ms).toBeLessThan(10)
    expect(tel.scanP50Ms!).toBeLessThanOrEqual(tel.scanP90Ms!)
    expect(tel.scanP90Ms!).toBeLessThanOrEqual(tel.scanP99Ms!)
  })

  it('is busier on weekdays than at weekends', () => {
    const byDay = new Map<number, number>()
    for (const row of rows) {
      const d = new Date(row.created_at).getUTCDay()
      byDay.set(d, (byDay.get(d) ?? 0) + 1)
    }
    const weekend = (byDay.get(0) ?? 0) + (byDay.get(6) ?? 0)
    const weekdays = [1, 2, 3, 4, 5].reduce((n, d) => n + (byDay.get(d) ?? 0), 0)
    expect(weekdays).toBeGreaterThan(weekend * 3)
  })

  it('has a real working-hours peak rather than a flat line', () => {
    const byHour = new Array(24).fill(0)
    for (const row of rows) byHour[new Date(row.created_at).getUTCHours()]++
    const peak = Math.max(...byHour)
    const trough = Math.min(...byHour)
    expect(peak).toBeGreaterThan(trough * 5)
  })

  it('only ever uses categories the shipped engines can emit', () => {
    // Inventing a label here would put a detection on the dashboard that no
    // rule in lib/classifier can produce.
    const REAL = new Set(['PII', 'HIPAA_PHI', 'IP', 'FINANCIAL', 'STRATEGIC'])
    for (const row of rows) {
      for (const c of row.classifications) expect(REAL.has(c)).toBe(true)
    }
  })

  it('uses only the three action values the dashboard maps', () => {
    const seen = new Set(rows.map((r) => r.action_taken))
    expect(seen).toEqual(new Set(['ALLOWED', 'QUARANTINED', 'BLOCKED']))
    expect(new Set(rows.map((r) => outcomeOf(r.action_taken)))).toEqual(
      new Set(['passed', 'warning', 'blocked']),
    )
  })

  it('gives blocked events a severity worth blocking', () => {
    for (const row of rows.filter((r) => r.action_taken === 'BLOCKED')) {
      expect(['HIGH', 'CRITICAL']).toContain(row.risk_level)
      expect(row.classifications.length).toBeGreaterThan(0)
      expect(row.confidence_score).toBeGreaterThan(0.85)
    }
  })

  it('leaves clean prompts genuinely clean', () => {
    const clean = rows.filter((r) => r.risk_level === 'NONE')
    expect(clean.length).toBeGreaterThan(rows.length * 0.8)
    for (const row of clean) {
      expect(row.classifications).toEqual([])
      expect(row.action_taken).toBe('ALLOWED')
    }
  })
})

describe('coverage — every dashboard panel gets something to draw', () => {
  const tel = aggregateOverview(rows, { now: NOW.getTime(), windowDays: 30 })

  it('lights up the connected state', () => {
    expect(tel.connected).toBe(true)
    expect(tel.totals.events).toBe(rows.length)
    expect(tel.totals.passed + tel.totals.warning + tel.totals.blocked).toBe(rows.length)
  })

  it('fills the provider mix with more than one provider', () => {
    expect(tel.providers.length).toBeGreaterThanOrEqual(4)
    expect(tel.providers[0].total).toBeGreaterThan(0)
  })

  it('fills the severity donut — the panel that read "nothing blocked" when empty', () => {
    const total = tel.riskMix.reduce((n, r) => n + r.count, 0)
    expect(total).toBe(tel.totals.blocked)
    expect(total).toBeGreaterThan(0)
  })

  it('fills the detections list', () => {
    expect(tel.detections.length).toBeGreaterThanOrEqual(4)
  })

  it('fills the 7x24 heatmap with a real spread, not one hot cell', () => {
    expect(tel.heat).toHaveLength(7)
    expect(tel.heat[0]).toHaveLength(24)
    const nonEmpty = tel.heat.flat().filter((n) => n > 0).length
    expect(nonEmpty).toBeGreaterThan(60) // of 168 cells
  })

  it('fills all seven daily buckets and all 24 hourly buckets', () => {
    expect(tel.daily).toHaveLength(7)
    expect(tel.daily.every((d) => d.events > 0)).toBe(true)
    expect(tel.hourly).toHaveLength(24)
  })

  it('records at least one block on most days, so the block-rate line moves', () => {
    const daysWithBlocks = tel.daily.filter((d) => d.blocked > 0).length
    expect(daysWithBlocks).toBeGreaterThanOrEqual(5)
  })
})
