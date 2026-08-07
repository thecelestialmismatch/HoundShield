/**
 * Overview telemetry — the operator dashboard's numbers, derived from the
 * customer's OWN `compliance_events` rows and nothing else.
 *
 * This module is deliberately PURE. It takes rows in and returns panel-ready
 * shapes out, with `now` injected rather than read from the clock, so:
 *   - every bucketing rule (24 hourly slots, 7 daily slots) is unit-testable
 *     without a database and without a fake timer, and
 *   - the route handler stays a thin "authenticate → query → aggregate" shell.
 *
 * HONESTY CONTRACT (the reason this file exists at all): the dashboard it feeds
 * replaced an 804-line mockup whose every dataset was hardcoded — a random
 * `generateTokenData()`, a fixed `providerBreakdown`, an invented 12-month
 * compliance curve. On a product sold as audit evidence, presenting invented
 * security metrics as a customer's own is the single worst thing the UI can do.
 * So there is no seed data here and no fallback sample: when a customer has not
 * connected the proxy yet, `connected` is false and every series is empty. The
 * UI's job is then to say "no traffic yet", never to draw a plausible chart.
 */

/** The columns we read off `compliance_events`. Metadata only — the prompt
 *  itself never leaves the customer's network, so there is nothing here to
 *  redact. `prompt_hash` is deliberately NOT selected: the dashboard has no use
 *  for it and unread data cannot leak. */
export interface TelemetryEventRow {
  id?: string
  created_at: string
  destination_provider: string | null
  risk_level: string
  classifications: string[] | null
  action_taken: string
  processing_time_ms: number | null
}

/** One row of the "Live events" table. Metadata only, by construction. */
export interface RecentEvent {
  /** Short display reference derived from the row's own uuid, e.g. "evt_3a7f2c". */
  ref: string
  createdAt: string
  provider: string
  risk: string
  outcome: EventOutcome
  /** What the engines detected, already joined for display. Empty when clean. */
  detected: string
  scanMs: number | null
}

export type EventOutcome = 'passed' | 'warning' | 'blocked'

export interface HourBucket {
  /** 0–23 clock hour in UTC. */
  hour: number
  events: number
  blocked: number
}

export interface DayBucket {
  /** ISO date (YYYY-MM-DD), UTC. */
  date: string
  /** Short weekday label for the axis, e.g. "Mon". */
  label: string
  events: number
  blocked: number
}

export interface ProviderBucket {
  provider: string
  passed: number
  warning: number
  blocked: number
  total: number
}

export interface NamedCount {
  name: string
  count: number
}

export interface OverviewTotals {
  events: number
  passed: number
  warning: number
  blocked: number
  /** Blocked as a percentage of all events, 1 decimal place. 0 when no events. */
  blockRatePct: number
}

export interface OverviewTelemetry {
  /** False when the customer has no events at all — the "proxy not connected
   *  yet" state. The UI must branch on this rather than rendering zeros. */
  connected: boolean
  /** Size of the aggregation window, in days. */
  windowDays: number
  totals: OverviewTotals
  /** Median scan latency in ms across the window, or null when no event
   *  recorded one. This is the honest replacement for the mockup's "Tokens
   *  Scanned" tile — the gateway records `processing_time_ms`, never tokens. */
  scanP50Ms: number | null
  /** Same latency set at the 90th and 99th percentile. Null when nothing has
   *  been timed yet — never 0, which would read as "instant". */
  scanP90Ms: number | null
  scanP99Ms: number | null
  /** Exactly 24 buckets, oldest → newest, ending with the current hour. */
  hourly: HourBucket[]
  /** Exactly 7 buckets, oldest → newest, ending today. */
  daily: DayBucket[]
  /** 7 rows (oldest day → today) x 24 UTC hours. Same rows as `daily`, split by
   *  hour so the heatmap can show WHEN in the day traffic and blocks land — the
   *  one shape neither `hourly` (24h only) nor `daily` (no time of day) can
   *  answer. Cell counts are events; `heatBlocked` is the blocked subset. */
  heat: number[][]
  heatBlocked: number[][]
  /** Destination LLM providers, busiest first. */
  providers: ProviderBucket[]
  /** Severity mix of BLOCKED events only — "how bad were the things we stopped". */
  riskMix: NamedCount[]
  /** What was detected, from the `classifications` array. Busiest first. */
  detections: NamedCount[]
}

const DAY_MS = 86_400_000
const HOUR_MS = 3_600_000
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

/** Severity order for display — worst first, so a reader's eye lands on
 *  CRITICAL rather than on whichever bucket happened to be biggest. */
const RISK_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE'] as const

/**
 * Map a stored `action_taken` onto the three outcomes the dashboard shows.
 *
 * QUARANTINED becomes "warning" rather than a fourth colour on purpose: to the
 * operator it means "held for your review", which sits between passed and
 * blocked exactly where a warning belongs.
 */
export function outcomeOf(action: string): EventOutcome {
  if (action === 'BLOCKED') return 'blocked'
  if (action === 'QUARANTINED') return 'warning'
  return 'passed'
}

/**
 * Exact median (lower of the two middle values on an even count).
 *
 * Not an approximation: latency sets here are one page of events, not a
 * streaming firehose, so a full sort is cheaper than a t-digest and cannot be
 * subtly wrong.
 */
export function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor((sorted.length - 1) / 2)
  return sorted[mid]
}

/**
 * Nearest-rank percentile (lower of the two middle values, same convention as
 * `median` above so p50 from either helper agrees).
 *
 * Nearest-rank rather than interpolated: these are millisecond readings the
 * gateway actually recorded, and an interpolated p99 reports a latency no
 * request ever had. On a panel a customer may quote to an assessor, every number
 * should be a measurement.
 */
export function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const rank = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.min(Math.max(rank, 0), sorted.length - 1)]
}

/** UTC midnight for a timestamp, as an epoch ms. */
function startOfUtcDay(ms: number): number {
  return Math.floor(ms / DAY_MS) * DAY_MS
}

/** ISO YYYY-MM-DD for an epoch ms, in UTC. */
function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

/**
 * Aggregate a customer's raw events into the overview's panel shapes.
 *
 * `rows` may contain events older than the window (the caller queries a single
 * range); anything outside a given bucket set is simply not counted by it,
 * while `totals` covers the whole `windowDays` span. Rows with an unparseable
 * `created_at` are dropped rather than silently bucketed as "now" — a
 * mis-bucketed event is worse than a missing one on an evidence product.
 */
export function aggregateOverview(
  rows: TelemetryEventRow[],
  opts: { now: number; windowDays?: number },
): OverviewTelemetry {
  const windowDays = opts.windowDays ?? 7
  const now = opts.now
  const windowStart = now - windowDays * DAY_MS

  // ── Bucket skeletons ───────────────────────────────────────────────────────
  // Built first and always full-length, so a quiet hour renders as a zero bar
  // rather than shifting every other bar along the axis.
  const hourStart = Math.floor(now / HOUR_MS) * HOUR_MS
  const hourly: HourBucket[] = Array.from({ length: 24 }, (_, i) => {
    const bucketMs = hourStart - (23 - i) * HOUR_MS
    return { hour: new Date(bucketMs).getUTCHours(), events: 0, blocked: 0 }
  })
  const hourlyFloor = hourStart - 23 * HOUR_MS

  const todayStart = startOfUtcDay(now)
  const daily: DayBucket[] = Array.from({ length: 7 }, (_, i) => {
    const bucketMs = todayStart - (6 - i) * DAY_MS
    return {
      date: isoDate(bucketMs),
      label: WEEKDAYS[new Date(bucketMs).getUTCDay()],
      events: 0,
      blocked: 0,
    }
  })
  const dailyIndex = new Map(daily.map((d, i) => [d.date, i]))
  const heat: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0))
  const heatBlocked: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0))

  const totals: OverviewTotals = { events: 0, passed: 0, warning: 0, blocked: 0, blockRatePct: 0 }
  const providers = new Map<string, ProviderBucket>()
  const risk = new Map<string, number>()
  const detections = new Map<string, number>()
  const latencies: number[] = []

  for (const row of rows) {
    const ts = Date.parse(row.created_at)
    if (Number.isNaN(ts)) continue
    if (ts < windowStart || ts > now) continue

    const outcome = outcomeOf(row.action_taken)
    totals.events += 1
    totals[outcome] += 1

    if (typeof row.processing_time_ms === 'number' && row.processing_time_ms >= 0) {
      latencies.push(row.processing_time_ms)
    }

    // Hourly (last 24h only — a subset of the window).
    if (ts >= hourlyFloor) {
      const idx = Math.floor((ts - hourlyFloor) / HOUR_MS)
      const bucket = hourly[Math.min(idx, 23)]
      bucket.events += 1
      if (outcome === 'blocked') bucket.blocked += 1
    }

    // Daily (last 7 days).
    const dayIdx = dailyIndex.get(isoDate(ts))
    if (dayIdx !== undefined) {
      daily[dayIdx].events += 1
      if (outcome === 'blocked') daily[dayIdx].blocked += 1
      // Same row, split by hour — free here, since the row is already resolved.
      const h = new Date(ts).getUTCHours()
      heat[dayIdx][h] += 1
      if (outcome === 'blocked') heatBlocked[dayIdx][h] += 1
    }

    // Provider mix. A null provider is real data (a local model with no
    // upstream), so it is labelled rather than dropped.
    const providerName = row.destination_provider?.trim() || 'Local / unknown'
    const p = providers.get(providerName) ?? {
      provider: providerName, passed: 0, warning: 0, blocked: 0, total: 0,
    }
    p[outcome] += 1
    p.total += 1
    providers.set(providerName, p)

    // Severity mix of BLOCKS only — the mix of what got stopped.
    //
    // Upper-cased before bucketing because `RISK_ORDER` below filters on exactly
    // 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'. A row whose risk_level
    // arrived as 'critical' used to be counted here and then silently dropped by
    // that filter — the severity chart would report "nothing was blocked" while
    // the Blocked KPI beside it said 20. Under-reporting severity on a
    // compliance dashboard is the worst direction for this bug to fail in.
    if (outcome === 'blocked') {
      const level = (row.risk_level ?? '').trim().toUpperCase() || 'NONE'
      risk.set(level, (risk.get(level) ?? 0) + 1)
    }

    for (const c of row.classifications ?? []) {
      if (!c) continue
      detections.set(c, (detections.get(c) ?? 0) + 1)
    }
  }

  totals.blockRatePct = totals.events === 0
    ? 0
    : Math.round((totals.blocked / totals.events) * 1000) / 10

  return {
    connected: totals.events > 0,
    windowDays,
    totals,
    scanP50Ms: median(latencies),
    scanP90Ms: percentile(latencies, 90),
    scanP99Ms: percentile(latencies, 99),
    hourly,
    daily,
    heat,
    heatBlocked,
    // Busiest first, then alphabetical. The name tie-break is not cosmetic:
    // without it equal-volume providers fall back to Map insertion order, which
    // is "whichever event happened to arrive first", so the bars visibly
    // reshuffle between refreshes of unchanged data.
    providers: [...providers.values()].sort(
      (a, b) => b.total - a.total || a.provider.localeCompare(b.provider),
    ),
    riskMix: RISK_ORDER
      .filter((name) => risk.has(name))
      .map((name) => ({ name, count: risk.get(name) as number })),
    detections: [...detections.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
  }
}

/**
 * Shape the newest rows for the "Live events" table.
 *
 * Callers pass rows already ordered newest-first. Nothing is invented and
 * nothing sensitive is added: `ref` is the row's own uuid prefix (a real handle
 * an operator can search the audit log by), and the prompt itself was never
 * selected — it never leaves the customer's network in the first place.
 */
export function toRecentEvents(rows: TelemetryEventRow[], limit = 8): RecentEvent[] {
  return rows.slice(0, limit).map((row, i) => ({
    ref: `evt_${(row.id ?? String(i)).replace(/-/g, '').slice(0, 6)}`,
    createdAt: row.created_at,
    provider: row.destination_provider?.trim() || 'Local / unknown',
    risk: row.risk_level,
    outcome: outcomeOf(row.action_taken),
    detected: (row.classifications ?? []).filter(Boolean).join(' · '),
    scanMs: typeof row.processing_time_ms === 'number' ? row.processing_time_ms : null,
  }))
}

/** The zero value — used by the client before the first fetch resolves, and by
 *  the route in demo mode. `connected: false` keeps the UI on its empty state
 *  rather than briefly flashing zeros as if they were measurements. */
export function emptyTelemetry(windowDays = 7): OverviewTelemetry {
  return aggregateOverview([], { now: 0, windowDays })
}
