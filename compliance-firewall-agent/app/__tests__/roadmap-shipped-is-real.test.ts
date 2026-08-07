import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

/**
 * Anything the public roadmap calls "Shipped" must exist in this repository.
 *
 * `/roadmap` is a sales page. A buyer reads the Shipped column as a promise
 * about today, and CLAUDE.md's NEVER-DO list is blunt about why that matters:
 * buyers verify everything. The failure mode is quiet — a feature slips, the
 * column never moves, and a page that was true in June is a false claim in
 * August with nothing anywhere to catch it.
 *
 * So each Shipped row is pinned to a file that implements it. This is a
 * tripwire, not a proof of completeness: it cannot tell you a feature works
 * well, only that deleting its implementation breaks the build rather than
 * quietly turning the page into a lie.
 *
 * Adding a Shipped row means adding its anchor here. If you cannot name a file,
 * the row belongs in "In Progress".
 */

const CFA = path.resolve(__dirname, '../..')
const REPO = path.resolve(CFA, '..')
const SRC = readFileSync(path.join(CFA, 'app/roadmap/page.tsx'), 'utf8')

/** Shipped row title → a path that must exist for the claim to be true. */
const EVIDENCE: Record<string, string> = {
  'AI gateway proxy': 'compliance-firewall-agent/app/api/v1/chat/completions/route.ts',
  '16-engine detection matrix': 'compliance-firewall-agent/lib/detection/engines.ts',
  'Tamper-evident audit trail': 'compliance-firewall-agent/lib/audit/seed-anchor.ts',
  'C3PAO-ready PDF reports': 'compliance-firewall-agent/app/api/reports/generate/route.ts',
  'Live SPRS scoring': 'compliance-firewall-agent/lib/shieldready',
  'Slack, Teams & SIEM alerts': 'compliance-firewall-agent/lib/integrations/slack.ts',
  'Docker self-host deploy': 'proxy/Dockerfile',
  'Agent attribution': 'compliance-firewall-agent/lib/gateway/actor.ts',
}

/** Titles inside the `status: 'shipped'` column, in source order. */
function shippedTitles(): string[] {
  const start = SRC.indexOf("status: 'shipped'")
  const next = SRC.indexOf("status: 'building'")
  expect(start, "the roadmap's shipped column moved or was renamed").toBeGreaterThan(-1)
  expect(next).toBeGreaterThan(start)

  const block = SRC.slice(start, next)
  return [...block.matchAll(/title:\s*'([^']+)'/g)].map((m) => m[1])
}

describe('the roadmap Shipped column', () => {
  const titles = shippedTitles()

  it('is not empty and is fully accounted for here', () => {
    expect(titles.length).toBeGreaterThan(5)

    const unpinned = titles.filter((t) => !(t in EVIDENCE))
    expect(
      unpinned,
      'these rows claim to be shipped but name no implementation. Either add the ' +
        'file that backs the claim to EVIDENCE, or move the row to "In Progress":\n' +
        unpinned.join('\n'),
    ).toEqual([])
  })

  it.each(titles)('"%s" is backed by code that exists', (title) => {
    const target = EVIDENCE[title]
    expect(
      existsSync(path.join(REPO, target)),
      `/roadmap advertises "${title}" as shipped, but ${target} does not exist`,
    ).toBe(true)
  })
})

describe('agent attribution is claimed accurately', () => {
  it('is shipped, because the gateway actually records it', () => {
    // The claim is specifically that attribution reaches the audit log — not
    // that a module exists in isolation. Pin the wiring, not just the file.
    const route = readFileSync(
      path.join(CFA, 'app/api/v1/chat/completions/route.ts'),
      'utf8',
    )
    expect(route).toMatch(/identifyActor\(req\.headers\)/)

    const logger = readFileSync(path.join(CFA, 'lib/audit/logger.ts'), 'utf8')
    expect(logger).toMatch(/actor/)
  })

  it('names only agents the signature table can actually detect', () => {
    // The roadmap lists client names as a selling point. Every one must be in
    // the table, or the page promises detection that silently will not happen.
    const actor = readFileSync(path.join(CFA, 'lib/gateway/actor.ts'), 'utf8')
    const row = SRC.match(/title: 'Agent attribution', body: '([^']+)'/)
    expect(row, 'the Agent attribution row moved').not.toBeNull()

    for (const named of ['Claude Code', 'Cursor', 'Aider', 'Copilot', 'LangChain']) {
      if (!row![1].includes(named)) continue
      expect(actor, `/roadmap names ${named} but no signature detects it`).toContain(named)
    }
  })

  it('keeps run grouping and per-agent policy OUT of the shipped column', () => {
    // These are genuinely not built. Promoting them because they sound good is
    // exactly what this whole test file exists to prevent.
    const shipped = shippedTitles()
    expect(shipped).not.toContain('Agent run grouping')
    expect(shipped).not.toContain('Per-agent policy')
  })
})
