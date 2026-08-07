import { createHash } from 'node:crypto'

/**
 * Generates a realistic gateway history for ONE demo account.
 *
 * ── Why this exists ──────────────────────────────────────────────────────────
 * `compliance_events` is empty in production. Every panel on the Command Center
 * dashboard therefore renders its honest "connect your proxy" empty state, which
 * is correct for a real customer and useless for the founder, who needs to see
 * and demo the thing populated. This builds that history.
 *
 * ── Why it is safe to have in the repo ───────────────────────────────────────
 * This is the exact opposite of the 804-line mockup the operator dashboard
 * replaced, and the difference is not cosmetic:
 *
 *   1. It writes ROWS, not chart values. The dashboard, the events table, the
 *      audit export and the $499 report all read the same table through the same
 *      queries with the same tenant filter. Nothing in the render path knows
 *      this data is synthetic, so nothing in the render path has a second code
 *      path that could drift from the real one — which is what makes it useful
 *      as a test fixture rather than a lie.
 *   2. Every row carries `metadata.synthetic = true` and the seed tag below.
 *      That is what lets the dashboard label itself (see `syntheticOf` in
 *      overview-telemetry) and what makes the seed reversible with one DELETE.
 *   3. It is bound to a single account at the call site. See
 *      scripts/seed-demo-telemetry.mjs — it resolves the user by email and
 *      refuses to run against any address but the demo one.
 *
 * Publishing invented numbers as traction is on the NEVER-DO list in CLAUDE.md.
 * A labelled, self-declaring fixture inside one private account is not that, and
 * the labelling is the reason. Do not remove the marker to make a screenshot
 * look better — that is the moment this stops being a fixture.
 *
 * ── The shape of the data ────────────────────────────────────────────────────
 * A ~60-person AI company routing its team's assistant traffic through the
 * gateway during a pilot: heavy on weekday US working hours, quiet at weekends,
 * volume trending up as more of the team is onboarded, and a low-single-digit
 * percentage of prompts stopped — which is what a real deployment looks like.
 * A 40% block rate would be a broken integration, not an impressive one.
 */

/** Marker written into every generated row. One DELETE undoes a seed run. */
export const DEMO_SEED_TAG = 'houndshield-demo-v1'

/**
 * The one account this fixture may ever be attached to, read from the
 * environment rather than hardcoded.
 *
 * This repository is PUBLIC, and a founder's personal mailbox is operator
 * configuration, not source code — the same rule `lib/email/identity.ts` states
 * for FOUNDER_EMAIL, enforced by lib/email/__tests__/email-identity-single-source.
 * Committing the address here would publish it to anyone who clones the repo.
 *
 * Set `DEMO_ACCOUNT_EMAIL` in .env.local. There is deliberately no default and
 * no CLI override: an unset variable stops the seed script rather than letting
 * it pick a target, and a missing flag means this can never become a
 * "write events into any tenant" tool.
 */
export function demoAccountEmail(): string | null {
  const email = process.env.DEMO_ACCOUNT_EMAIL?.trim()
  return email ? email : null
}

/**
 * Hard ceiling, chosen to match `MAX_ROWS` in app/api/dashboard/overview/route.ts.
 * Exceeding it would make the 30-day view report `truncated: true` and undercount
 * — a demo dataset that makes the product look like it drops data is worse than
 * no demo dataset.
 */
export const MAX_SEED_ROWS = 4_800

export interface SeedRow {
  user_id: string
  created_at: string
  prompt_hash: string
  seed_hash: string
  destination_provider: string
  risk_level: string
  classifications: string[]
  action_taken: string
  confidence_score: number
  detected_entities: unknown[]
  processing_time_ms: number
  metadata: Record<string, unknown>
}

/** Deterministic PRNG. Same seed ⇒ byte-identical rows ⇒ re-running is a no-op. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pick = <T,>(rng: () => number, items: readonly [T, number][]): T => {
  const total = items.reduce((n, [, w]) => n + w, 0)
  let r = rng() * total
  for (const [item, w] of items) {
    r -= w
    if (r <= 0) return item
  }
  return items[items.length - 1][0]
}

/**
 * Destination model providers, weighted the way a team that actually uses
 * several of them splits its traffic.
 */
const PROVIDERS: readonly [string, number][] = [
  ['OpenAI', 42],
  ['Anthropic', 31],
  ['Google', 12],
  ['Microsoft Copilot', 9],
  ['Mistral', 4],
  ['Cohere', 2],
]

/**
 * The categories the shipped engines actually emit — `category` on the rules in
 * lib/classifier/{patterns,cmmc-patterns,hipaa-patterns}.ts. Inventing a
 * category here would put a label on the dashboard that no engine can produce.
 */
const CATEGORIES: readonly [string, number][] = [
  ['PII', 34],
  ['HIPAA_PHI', 24],
  ['IP', 22],
  ['FINANCIAL', 12],
  ['STRATEGIC', 8],
]

/**
 * Relative traffic weight per UTC hour for a US-hours team: a ramp from ~12:00
 * UTC (8am ET), a peak across the afternoon, a dip at lunch, and a long tail of
 * evening work. Not a flat line and not a single spike — either one is instantly
 * readable as fake on the heatmap and the hour-of-day profile.
 */
const HOUR_WEIGHTS = [
  2, 1, 1, 1, 1, 1, 2, 3, 4, 6, 8, 14,
  26, 38, 52, 61, 66, 58, 47, 55, 49, 34, 18, 7,
] as const

/**
 * Scan latency in whole milliseconds, the unit the column stores.
 *
 * Weighted so p50 lands at 2ms, p90 near 5ms and p99 under 10ms — consistent
 * with the product's "<10ms" claim, and never 0, which renders as "0ms" and
 * reads as a broken counter rather than a fast one.
 */
const LATENCY: readonly [number, number][] = [
  [1, 210], [2, 260], [3, 190], [4, 120], [5, 78],
  [6, 46], [7, 28], [8, 16], [9, 9], [11, 4], [13, 2],
]

const sha256 = (input: string) => createHash('sha256').update(input).digest('hex')

export interface SeedOptions {
  userId: string
  /** End of the window. Defaults to now. */
  now?: Date
  /** How much history to generate. The dashboard offers 1/7/30-day windows. */
  days?: number
  /** Fixed PRNG seed — change it only to get a different (still stable) dataset. */
  seed?: number
}

/**
 * Build the rows. Pure: no clock, no network, no database. Same inputs always
 * produce the same output, which is what makes the seed script idempotent and
 * this module testable.
 */
export function generateDemoTelemetry(options: SeedOptions): SeedRow[] {
  const { userId, now = new Date(), days = 30, seed = 0x484f554e } = options
  const rng = mulberry32(seed)
  const rows: SeedRow[] = []

  const endOfWindow = now.getTime()

  for (let dayOffset = days - 1; dayOffset >= 0; dayOffset--) {
    const dayStart = new Date(endOfWindow - dayOffset * 86_400_000)
    dayStart.setUTCHours(0, 0, 0, 0)
    const weekday = dayStart.getUTCDay() // 0 Sun … 6 Sat
    const isWeekend = weekday === 0 || weekday === 6

    // Adoption curve: fewer seats onboarded a month ago than today. Ranges from
    // ~0.62 at the start of the window to 1.0 at the end.
    const ramp = 0.62 + 0.38 * ((days - 1 - dayOffset) / Math.max(1, days - 1))
    // Tuned so a 30-day window lands near 4,300 events — as busy as the
    // aggregation cap allows without ever tripping `truncated`.
    const base = isWeekend ? 40 : 230
    const jitter = 0.85 + rng() * 0.3
    const dayTotal = Math.max(0, Math.round(base * ramp * jitter))

    for (let i = 0; i < dayTotal; i++) {
      // Place the event in an hour drawn from the working-day profile, then at a
      // uniform random second inside it.
      const hour = pick(
        rng,
        HOUR_WEIGHTS.map((w, h) => [h, isWeekend ? Math.max(1, w * 0.35) : w] as [number, number]),
      )
      const created = new Date(dayStart)
      created.setUTCHours(hour, Math.floor(rng() * 60), Math.floor(rng() * 60), 0)

      // Never emit an event in the future — the last partial day must stop at `now`.
      if (created.getTime() > endOfWindow) continue

      // Outcome mix. ~3% blocked, ~4% quarantined: a real deployment stops a
      // small tail of prompts, and the value is in catching those, not in a
      // dramatic-looking percentage.
      const roll = rng()
      const action = roll < 0.031 ? 'BLOCKED' : roll < 0.072 ? 'QUARANTINED' : 'ALLOWED'

      let risk: string
      let classifications: string[]
      let confidence: number

      if (action === 'BLOCKED') {
        risk = rng() < 0.38 ? 'CRITICAL' : 'HIGH'
        classifications = [pick(rng, CATEGORIES)]
        if (rng() < 0.3) {
          const second = pick(rng, CATEGORIES)
          if (!classifications.includes(second)) classifications.push(second)
        }
        confidence = 0.88 + rng() * 0.11
      } else if (action === 'QUARANTINED') {
        risk = rng() < 0.55 ? 'MEDIUM' : 'LOW'
        classifications = [pick(rng, CATEGORIES)]
        confidence = 0.61 + rng() * 0.24
      } else {
        // A clean prompt. Most carry nothing at all; a minority trip a low-
        // confidence match that was allowed through, which is what the LOW band
        // on a real dashboard is made of.
        const flagged = rng() < 0.06
        risk = flagged ? 'LOW' : 'NONE'
        classifications = flagged ? [pick(rng, CATEGORIES)] : []
        confidence = flagged ? 0.3 + rng() * 0.2 : 0
      }

      const promptHash = sha256(`${userId}:${created.toISOString()}:${i}:${DEMO_SEED_TAG}`)

      rows.push({
        user_id: userId,
        created_at: created.toISOString(),
        prompt_hash: promptHash,
        // Filled in below, once the rows are in chronological order.
        seed_hash: '',
        destination_provider: pick(rng, PROVIDERS),
        risk_level: risk,
        classifications,
        action_taken: action,
        confidence_score: Number(confidence.toFixed(3)),
        detected_entities: [],
        processing_time_ms: pick(rng, LATENCY),
        metadata: {
          // The label. Removing either of these makes the dashboard stop
          // declaring itself a demo — see the honesty note at the top of this file.
          synthetic: true,
          demo_seed: DEMO_SEED_TAG,
        },
      })
    }
  }

  rows.sort((a, b) => a.created_at.localeCompare(b.created_at))

  // Real hash chain, in time order: each anchor commits to the one before it, so
  // the integrity section of the $499 report verifies against this data the same
  // way it would against production traffic. A chain of random hex would pass the
  // structural check in app/api/audit/export and mean nothing.
  let previous = sha256(`${DEMO_SEED_TAG}:genesis:${userId}`)
  for (const row of rows) {
    previous = sha256(`${previous}${row.prompt_hash}`)
    row.seed_hash = previous
  }

  return rows
}
