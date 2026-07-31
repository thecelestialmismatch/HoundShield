import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import path from 'path'

/**
 * The after-login dashboard shows REAL data — the contract.
 *
 * Founder direction 2026-07-31: the rich Command Center overview (KPI row, SPRS
 * trend, risk radar, provider breakdown, live events, 24h activity, quick
 * actions) must be on screen at login, "with the correct data, not the fake
 * data". Both halves are pinned here, because the two obvious ways to satisfy
 * one of them break the other:
 *
 *   - Restore the deleted 804-line mockup → the layout is right and every
 *     number is invented. That is what got it deleted (PR #254).
 *   - Leave the stripped console → nothing is invented and the founder's
 *     dashboard is missing.
 *
 * So: the panels exist AND every one of them is sourced. On a product whose
 * deliverable is C3PAO audit evidence, a chart that looks like a measurement
 * but is a seed is the single worst defect the UI can carry.
 */

const CFA = path.resolve(__dirname, '../..')
const read = (rel: string) => readFileSync(path.join(CFA, rel), 'utf8')

const operator = read('components/dashboard/OperatorOverview.tsx')
const panels = read('components/dashboard/operator/OperatorPanels.tsx')
const hook = read('components/dashboard/operator/useOperatorTelemetry.ts')
const lcc = read('components/dashboard/LiveCommandCenter.tsx')
const route = read('app/api/dashboard/overview/route.ts')

describe('the founder’s panels are all present at login', () => {
  it('renders every section from the requested layout', () => {
    for (const id of ['kpis', 'charts', 'posture', 'feed', 'engines', 'actions']) {
      expect(operator, `missing <Section id="${id}">`).toMatch(new RegExp(`<Section id="${id}"`))
    }
  })

  it('mounts the specific panels the founder pointed at', () => {
    for (const panel of [
      'OperatorKpis', 'ActivityByHour', 'ProviderBreakdown',
      'RiskRadar', 'SprsTrend', 'LiveEvents', 'QuickActions', 'DetectionsByEngine',
    ]) {
      expect(operator, `${panel} is not mounted`).toContain(`<${panel}`)
    }
  })

  it('keeps the toolbar chrome — and makes it work, not decorate', () => {
    expect(operator).toContain('Dashboard Overview')
    expect(operator).toMatch(/Last update/)
    // The mockup's window picker and Refresh were inert buttons.
    expect(operator).toMatch(/onClick=\{t\.refresh\}/)
    expect(operator).toMatch(/t\.setWindowDays/)
  })

  it('a signed-in operator actually reaches it', () => {
    expect(lcc).toMatch(/isViewer \? \(\s*<OperatorOverview/)
  })

  it('reaches it even with no company or full name on the profile', () => {
    // The regression that made this necessary: `isViewer = !!viewer` sent any
    // customer whose profile had neither field — an ordinary email-only signup —
    // to the SIMULATED branch. Authentication decides whether the data is real;
    // having a display name does not.
    expect(lcc).toMatch(/const isViewer = authenticated \?\? !!viewer/)
    expect(read('app/command-center/overview/page.tsx')).toMatch(/authenticated/)
  })

  it('never labels a signed-in operator with the fictional sample org', () => {
    expect(lcc).toMatch(/authenticated \? 'Your Command Center' : 'Acme Defense'/)
    // The hero must go through that resolution, not re-inline the fallback.
    expect(lcc).not.toMatch(/hero-org">\{name \? `Welcome back, \$\{name\}` : \(viewer\?\.company \?\? 'Acme Defense'\)\}/)
  })

  it('nothing starts hidden for them any more', () => {
    const prefs = read('lib/dashboard/use-dashboard-prefs.ts')
    expect(prefs).toMatch(/export const SIGNED_IN_STRIPPED_HIDDEN: string\[\] = \[\]/)
  })
})

describe('every number on it is sourced — no seeds, no fallbacks', () => {
  it('the operator panels import no demo constants', () => {
    // SCANS_24H / BLOCKED_TODAY et al. are the demo shell's seeds. Importing one
    // here is how a fabricated number reaches a paying customer.
    for (const seed of ['SCANS_24H', 'BLOCKED_TODAY', 'HOURLY_SCANS', 'DESTINATIONS', 'RISK_MIX', 'SPRS_TREND']) {
      expect(panels, `${seed} leaked into the operator dashboard`).not.toContain(seed)
      expect(operator, `${seed} leaked into the operator dashboard`).not.toContain(seed)
    }
    expect(panels).not.toContain('OverviewCharts')
  })

  it('there is no revenue chart — that was HoundShield’s revenue, not the customer’s', () => {
    for (const src of [operator, panels]) {
      expect(src).not.toMatch(/REVENUE_DATA|Revenue & Conversion|conversion/i)
    }
  })

  it('there is no token-count tile — the gateway records latency, never tokens', () => {
    expect(panels).not.toMatch(/Tokens Scanned/i)
    expect(panels).toMatch(/Scan latency p50/)
  })

  it('data comes from the three real sources and nowhere else', () => {
    expect(hook).toContain('/api/dashboard/overview')          // own gateway events
    expect(hook).toContain('getAssessmentResponses')            // own on-device assessment
    expect(hook).toContain('/api/customer/status/snapshot')     // own posture history
  })

  it('the empty state is an empty state, not a zeroed chart', () => {
    expect(panels).toContain('NoTelemetry')
    // Each data panel must branch on emptiness before it draws.
    expect(panels).toMatch(/!tel\.connected \? \(/)
    expect(panels).toMatch(/tel\.providers\.length === 0/)
    expect(panels).toMatch(/tel\.detections\.length === 0/)
    expect(panels).toMatch(/!posture\.assessed \? \(/)
  })

  it('the SPRS trend refuses to interpolate a curve from one point', () => {
    expect(panels).toMatch(/points\.length >= 2/)
    expect(panels).toMatch(/Not enough history yet/)
  })

  it('an unmeasured value renders as an em dash, never as zero', () => {
    // "0ms scan latency" or "0 events" would read as a measurement.
    expect(panels).toMatch(/const dash = '—'/)
    expect(panels).toMatch(/tel\.scanP50Ms === null \? dash/)
  })

  it('the simulated demo strip is hidden from signed-in operators', () => {
    // Its "last block 4s ago" is driven by the demo timer.
    expect(lcc).toMatch(/\{!isViewer && \(\s*<div className="ops">/)
  })
})

describe('the tenant boundary', () => {
  it('scopes telemetry to the session user, never a request parameter', () => {
    expect(route).toMatch(/requireUser\(\)/)
    expect(route).toMatch(/\.eq\('user_id', auth\.user\.id\)/)
    // A user_id read off the query string would be a cross-tenant disclosure.
    expect(route).not.toMatch(/searchParams\.get\(['"]user_id['"]\)/)
  })

  it('selects named columns rather than everything', () => {
    expect(route).not.toMatch(/\.select\(['"`]\*/)
    expect(route).not.toContain('prompt_hash')
  })

  it('has no demo-data fallback — this endpoint answers "what did MY gateway see"', () => {
    expect(route).not.toContain('DEMO_EVENTS')
  })

  it('discloses truncation rather than silently under-reporting', () => {
    expect(route).toMatch(/truncated: rows\.length >= MAX_ROWS/)
    expect(operator).toMatch(/t\.truncated &&/)
  })

  it('surfaces a failed read instead of showing it as "no traffic"', () => {
    expect(route).toMatch(/status: 500/)
    expect(operator).toMatch(/t\.error &&/)
  })
})

describe('the deleted mockup stays deleted', () => {
  it('does not come back under the tools group', () => {
    expect(existsSync(path.join(CFA, 'app/command-center/(tools)/overview/page.tsx'))).toBe(false)
  })

  it('the real dashboard still owns the canonical URL', () => {
    const page = read('app/command-center/overview/page.tsx')
    expect(page).toMatch(/<LiveCommandCenter viewer=\{viewer\} authenticated \/>/)
  })
})
