import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'fs'
import path from 'path'

const CFA = path.resolve(__dirname, '../..')
const TOOLS = path.join(CFA, 'app/command-center/(tools)')

/**
 * A signed-in customer must never be shown invented data as their own.
 *
 * This repo has committed that defect twice. On 2026-07-29 the dashboard at
 * `/command-center/overview` was an 804-line mockup with no session lookup, so
 * every operator saw the same fabricated security metrics. On 2026-07-31 the
 * activation checklist passed a constant, telling operators who had never sent a
 * prompt that they were connected. Both were caught by a person looking, not by
 * a test — which is why the third instance (three tool pages still rendering
 * hardcoded rosters, tasks and agent graphs) survived until 2026-08-07.
 *
 * So this is a registry, not a heuristic. Heuristics cannot tell a fabricated
 * customer dataset from a legitimate presentation constant — `COLUMNS`,
 * `STAGES`, `WINDOWS` and `NAV_SECTIONS` are all SCREAMING_CASE arrays that are
 * perfectly honest — and a guard that cries wolf gets deleted. An explicit list
 * has no false positives and fails in both directions: a page that shows sample
 * data without saying so fails, and a page that says so without being listed
 * fails too, so the list cannot silently rot.
 */

/** Route segments under (tools) that knowingly render sample data. */
const SIMULATED_PAGES = [
  // team-view renders a hardcoded AGENTS roster; no request is issued.
  'team',
  // tasks-board renders SAMPLE_TASKS; no request is issued.
  'tasks',
  // agents/page.tsx declares its own AGENTS and EDGES constants.
  'agents',
] as const

/**
 * Components that exist ONLY as mockups. Importing one into a page is a promise
 * that the page carries the notice.
 */
const MOCK_COMPONENTS = ['team-view', 'tasks-board'] as const

const pageSource = (seg: string) => {
  const p = path.join(TOOLS, seg, 'page.tsx')
  return existsSync(p) ? readFileSync(p, 'utf8') : null
}

/** Every route segment under (tools), including nested ones like shield/gaps. */
function allSegments(dir = TOOLS, prefix = ''): string[] {
  const out: string[] = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith('_') || e.name.startsWith('(')) continue
    const seg = prefix ? `${prefix}/${e.name}` : e.name
    if (existsSync(path.join(dir, e.name, 'page.tsx'))) out.push(seg)
    out.push(...allSegments(path.join(dir, e.name), seg))
  }
  return out
}

describe('sample data in the Command Center is always labelled as sample data', () => {
  it('every known-simulated page carries the notice', () => {
    for (const seg of SIMULATED_PAGES) {
      const src = pageSource(seg)
      expect(src, `/command-center/${seg} has no page.tsx — update SIMULATED_PAGES`).not.toBeNull()
      expect(
        src,
        `/command-center/${seg} renders sample data without SampleDataNotice — a signed-in ` +
          `customer would read it as their own account`,
      ).toContain('SampleDataNotice')
    }
  })

  it('no page claims sample data without being registered as simulated', () => {
    // The reverse direction. Without it the registry drifts: someone adds the
    // notice to a fourth page, nobody updates the list, and the list stops
    // describing the product.
    const labelled = allSegments().filter((seg) => pageSource(seg)?.includes('SampleDataNotice'))
    expect(labelled.sort()).toEqual([...SIMULATED_PAGES].sort())
  })

  it('mockup components are only mounted by pages that carry the notice', () => {
    // Moving `team-view` onto a new route without labelling it is the exact way
    // this defect comes back.
    for (const component of MOCK_COMPONENTS) {
      for (const seg of allSegments()) {
        const src = pageSource(seg)
        if (!src?.includes(`dashboard/${component}`)) continue
        expect(
          src,
          `/command-center/${seg} mounts the ${component} mockup without SampleDataNotice`,
        ).toContain('SampleDataNotice')
      }
    }
  })

  it('the Agent Simulation page does not describe simulated data as "live"', () => {
    // It read "Live compliance pipeline multi-agent graph" over two module
    // constants. Labelling the page while the heading still says "Live" would
    // leave the product contradicting itself on one screen.
    const src = pageSource('agents') ?? ''
    const headings = src
      .split('\n')
      .filter((l) => /<p|<h[1-6]/.test(l) && /\bLive\b/.test(l))
    expect(headings, 'the Agent Simulation heading calls simulated data live').toEqual([])
  })
})
