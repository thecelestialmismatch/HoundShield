import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import path from 'path'
import { readShellSource } from './helpers/shell-source'

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
/**
 * All the panel modules as one source.
 *
 * `OperatorPanels.tsx` became a barrel on 2026-08-07 — it was 616 lines against
 * the repo's 500-line rule, so it was split by concern. The honesty rules below
 * are about what the panels render, not about which file holds which chart, so
 * they read the whole set. Same reasoning as helpers/shell-source.ts.
 */
const panels = [
  'panelPrimitives.tsx',
  'OperatorKpis.tsx',
  'OperatorCharts.tsx',
  'OperatorFeed.tsx',
]
  .map((f) => read(`components/dashboard/operator/${f}`))
  .join('\n')
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
    expect(operator).toContain("dashboardLabel(name ?? null, 'Your Dashboard')")
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
    //
    // The shipped route no longer has a branch to get wrong: it renders
    // OperatorDashboard, which mounts OperatorOverview unconditionally. Profile
    // completeness reaches nothing but the greeting. The `authenticated ??
    // !!viewer` split is still asserted on LiveCommandCenter because that
    // component still carries both branches.
    expect(lcc).toMatch(/const isViewer = authenticated \?\? !!viewer/)
    const page = read('app/command-center/(tools)/overview/page.tsx')
    expect(page).toMatch(/<OperatorDashboard\b/)
    expect(page).not.toMatch(/buildDashboardViewer/)
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
  /**
   * REWRITTEN 2026-07-31 (founder direction: "I still want all of these
   * features"). This used to assert `(tools)/overview/page.tsx` does NOT exist,
   * which was a proxy for "the 804-line hardcoded mockup has not come back" —
   * the mockup lived at that path.
   *
   * The dashboard now lives at exactly that path, deliberately: it moved into
   * the `(tools)` route group so it renders inside the 23-item Command Center
   * sidebar instead of bringing a rival one. A route group never appears in the
   * URL, so `/command-center/overview` is unchanged.
   *
   * The path was never what mattered. What matters is that the file at it is the
   * real, session-scoped dashboard and not a wall of seeded constants — so that
   * is what is asserted now, by name and by absence of the mockup's own symbols.
   */
  const page = read('app/command-center/(tools)/overview/page.tsx')

  it('the real dashboard owns the canonical URL', () => {
    expect(page).toMatch(/<OperatorDashboard\b/)
    expect(existsSync(path.join(CFA, 'app/command-center/overview/page.tsx'))).toBe(false)
  })

  it('carries none of the mockup’s hardcoded datasets', () => {
    for (const seed of ['generateTokenData', 'threatDistribution', 'riskRadarData', 'REVENUE_DATA']) {
      expect(page, `mockup seed "${seed}" is back`).not.toContain(seed)
    }
  })

  it('renders inside the shared sidebar rather than a second shell', () => {
    const shell = read('components/dashboard/OperatorDashboard.tsx')
    // The panel stylesheet is `.hs-lcc`-scoped, so the wrapper must stay...
    expect(shell).toMatch(/className="hs-lcc hs-embedded"/)
    // ...but the 248px sidebar grid is a separate class, and mounting it here
    // would paint a second sidebar next to the (tools) one.
    expect(shell).not.toMatch(/className="shell"/)
  })

  it('the checklist’s "you are connected" steps come from a real query', () => {
    expect(page).toMatch(/await hasGatewayTraffic\(\)/)
    const probe = read('lib/dashboard/gateway-traffic.ts')
    // Same tenant boundary as the telemetry route: session-derived id, never
    // client-supplied, because the service-role client bypasses RLS.
    expect(probe).toMatch(/\.eq\('user_id', user\.id\)/)
    expect(probe).toMatch(/getSessionUser\(\)/)
  })
})

/**
 * Moving the dashboard into the (tools) shell stopped LiveCommandCenter from
 * being rendered anywhere. Every pane that lived ONLY as one of its tabs would
 * have been silently stranded — reachable by no link, in no sidebar, from
 * nowhere in the product. That is a feature loss even when it is an accident,
 * and the founder's instruction was the opposite ("I still want all of these
 * features").
 *
 * So each stranded pane got a route and a sidebar entry, and this pins them.
 * Plan & Unlocks matters most: it is the only upgrade surface in the product,
 * i.e. a revenue path a refactor nearly deleted.
 */
describe('nothing was stranded by the move into the tool shell', () => {
  // The whole shell, not one file: NAV_SECTIONS moved to `_shell/nav.ts` when
  // the shell was split on 2026-08-07, and the destinations are what matters.
  const nav = readShellSource()

  const RESCUED = [
    { pane: 'Plan & Unlocks', route: 'plan', component: 'PlanUnlocksBoard' },
    { pane: 'Your Guide', route: 'guide', component: 'CustomerStatusPanel' },
  ]

  for (const { pane, route, component } of RESCUED) {
    it(`"${pane}" has a real page and a way to reach it`, () => {
      const page = read(`app/command-center/(tools)/${route}/page.tsx`)
      expect(page, `${pane} renders something else`).toContain(component)
      expect(nav, `${pane} is in no sidebar`).toContain(`/command-center/${route}`)
    })
  }

  it('every sidebar destination resolves to a page that exists', () => {
    // A link to a 404 is worse than no link: it reads as a broken product.
    const hrefs = [...nav.matchAll(/href: "(\/command-center[^"]*)"/g)].map((m) => m[1])
    expect(hrefs.length).toBeGreaterThan(20)
    for (const href of hrefs) {
      const seg = href.replace('/command-center', '').replace(/^\//, '')
      // The bare index is app/command-center/page.tsx, outside the group.
      const rel = seg === ''
        ? 'app/command-center/page.tsx'
        : `app/command-center/(tools)/${seg}/page.tsx`
      expect(existsSync(path.join(CFA, rel)), `${href} has no page`).toBe(true)
    }
  })
})
