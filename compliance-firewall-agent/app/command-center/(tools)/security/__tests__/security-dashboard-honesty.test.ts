import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/* ──────────────────────────────────────────────────────────────────
 * /command-center/security — every figure is measured, and clickable.
 *
 * This page shipped fabricated. Math.random() generated 24 hours of scan
 * latency and eight violations on every render, the risk donut and category
 * bars were hardcoded arrays, the four stat tiles carried invented trend
 * deltas ("+8%", "-2%", "-3ms"), and Refresh was a setTimeout that re-rendered
 * the same constants. Its docstring claimed a real Supabase source; the file
 * contained no fetch at all. A customer reloading the page saw their security
 * posture change.
 *
 * The Overview has had `operator-dashboard-honesty.test.ts` guarding exactly
 * this class of defect since 2026-08-07 — but that test reads the Overview's
 * files, so this page sat outside it and rotted unobserved. These assertions
 * are the same idea pointed at this route.
 * ────────────────────────────────────────────────────────────────── */

const page = readFileSync(join(process.cwd(), 'app/command-center/(tools)/security/page.tsx'), 'utf8')

describe('the security dashboard invents nothing', () => {
  it('generates no data of its own', () => {
    // The exact mechanism that made the old page lie.
    expect(page).not.toMatch(/Math\.random/)
    expect(page).not.toMatch(/makeLatencyData|makeViolations/)
  })

  it('carries no hardcoded series or seeded constants', () => {
    for (const seed of ['LATENCY_DATA', 'VIOLATIONS', 'RISK_PIE', 'CATEGORY_BAR']) {
      expect(page, `${seed} is a fabricated series`).not.toContain(seed)
    }
  })

  it('quotes no trend delta, because nothing here measures a trend', () => {
    // "+8%" / "-3ms" against an unstated baseline is a number a customer
    // cannot check and we cannot produce.
    expect(page).not.toMatch(/trend=["']/)
  })

  it('reads the same tenant-scoped telemetry the Overview runs on', () => {
    expect(page).toContain('useOperatorTelemetry')
  })

  it('distinguishes "not measured" from zero', () => {
    // An em dash where there is no measurement; a real zero only when the
    // gateway actually reported zero.
    expect(page).toContain('connected')
    expect(page).toContain('"—"')
  })

  it('says so when the telemetry request failed, instead of rendering zeros', () => {
    expect(page).toMatch(/t\.error/)
    expect(page).toContain('role="alert"')
  })
})

describe('every figure links to the records behind it', () => {
  it('each KPI tile is a link, not a dead tile', () => {
    // Four tiles, each with an href into the data that produced the number.
    const hrefs = page.match(/href="\/command-center\/[^"]*"/g) ?? []
    expect(hrefs.length).toBeGreaterThanOrEqual(4)
  })

  it('points only at routes that exist in the (tools) group', () => {
    const routes = new Set(
      (page.match(/href="(\/command-center\/[^"?]*)/g) ?? []).map((h) => h.replace('href="', '')),
    )
    // Every destination is a real page — a link to a 404 is worse than no link.
    for (const r of routes) {
      const slug = r.replace('/command-center/', '')
      expect(
        ['events', 'quarantine', 'realtime'].includes(slug),
        `${r} is not one of the verified destinations`,
      ).toBe(true)
    }
  })

  it('sends blocked traffic to the audit log pre-filtered to blocked', () => {
    expect(page).toContain('/command-center/events?outcome=blocked')
  })

  it('reuses the Overview panels, so the two pages cannot disagree', () => {
    for (const panel of ['OutcomeMix', 'BlockedSeverity', 'LatencyProfile', 'DetectionsByEngine']) {
      expect(page, `${panel} should be reused, not re-plotted`).toContain(panel)
    }
  })
})
