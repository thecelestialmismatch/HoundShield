import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const REPO = join(__dirname, '..', '..', '..', '..')
const REGISTRY = join(REPO, 'proxy', 'patterns', 'index.ts')
const DOC = join(REPO, 'proxy', 'PATTERNS.md')

/* ──────────────────────────────────────────────────────────────────
 * proxy/PATTERNS.md must describe the registry it claims to describe.
 *
 * The hand-maintained version had drifted past the point of being wrong
 * into being misleading: a "33 patterns" heading over 16 table rows, six
 * named patterns that were never in the registry at all (bank account /
 * routing, date of birth, patent numbers, generic secrets…), and a claim
 * that "Luhn algorithm validation is applied to credit card patterns"
 * when the registry performs no Luhn check.
 *
 * `doc-counts.test.ts` already guards the NUMBER in this file. Nothing
 * guarded the LIST, which is the part a customer reads before deciding
 * whether the proxy covers their data — and the part that would be read
 * aloud in an assessment.
 *
 * The doc is generated from the registry now. This test is what makes
 * that stick: it fails on the first pattern added, renamed, or reclassified
 * without a regenerate.
 *
 * ponytail: compares name / risk / action, not the regexes themselves.
 * A pattern whose expression changes while its metadata stays put still
 * passes. Upgrade path: the doc would have to publish the expressions,
 * which is the kind of detail that invites copy-paste into a customer's
 * own tooling — not obviously worth it.
 * ────────────────────────────────────────────────────────────────── */

interface Row { name: string; risk: string; action: string }

function registryRows(): Row[] {
  const src = readFileSync(REGISTRY, 'utf8')
  const decl =
    /name:\s*"([^"]+)"\s*,\s*category:\s*"[^"]+"[\s\S]{0,900}?risk_level:\s*"([^"]+)"\s*,\s*action:\s*"([^"]+)"/g
  return [...src.matchAll(decl)].map((m) => ({ name: m[1], risk: m[2], action: m[3] }))
}

function docRows(): Row[] {
  const md = readFileSync(DOC, 'utf8')
  const out: Row[] = []
  for (const line of md.split('\n')) {
    // | Name | RISK | ACTION | controls |
    const m = line.match(/^\|\s*([^|]+?)\s*\|\s*(CRITICAL|HIGH|MEDIUM|LOW|NONE)\s*\|\s*(BLOCK|QUARANTINE|ALLOW)\s*\|/)
    if (m) out.push({ name: m[1], risk: m[2], action: m[3] })
  }
  return out
}

const registry = registryRows()
const doc = docRows()
const key = (r: Row) => `${r.name} :: ${r.risk} :: ${r.action}`

describe('proxy/PATTERNS.md matches the shipped registry', () => {
  it('found rows on both sides', () => {
    // Either extraction silently returning [] would make every comparison
    // below pass vacuously — the exact way a guard rots into decoration.
    expect(registry.length).toBeGreaterThanOrEqual(33)
    expect(doc.length).toBeGreaterThanOrEqual(33)
  })

  it('lists every shipped pattern, and nothing that is not shipped', () => {
    const inRegistry = new Set(registry.map(key))
    const inDoc = new Set(doc.map(key))

    expect(
      {
        undocumented: [...inRegistry].filter((k) => !inDoc.has(k)).sort(),
        documentedButNotShipped: [...inDoc].filter((k) => !inRegistry.has(k)).sort(),
      },
      'regenerate proxy/PATTERNS.md from proxy/patterns/index.ts',
    ).toEqual({ undocumented: [], documentedButNotShipped: [] })
  })

  it('states the same total the registry actually holds', () => {
    const stated = readFileSync(DOC, 'utf8').match(/\*\*(\d+) patterns\*\*/)
    expect(stated, 'PATTERNS.md lost its headline count').toBeTruthy()
    expect(Number(stated![1])).toBe(registry.length)
    expect(doc.length).toBe(registry.length)
  })

  it('claims no validation the registry does not perform', () => {
    // The retired doc promised Luhn checking on card numbers. It is a plausible
    // thing for a compliance tool to do, which is what made it dangerous: an
    // assessor could reasonably rely on it.
    const md = readFileSync(DOC, 'utf8')
    const src = readFileSync(REGISTRY, 'utf8')
    if (/luhn/i.test(md)) expect(/luhn/i.test(src), 'PATTERNS.md claims Luhn validation the registry does not implement').toBe(true)
    if (/checksum/i.test(md)) expect(/checksum/i.test(src)).toBe(true)
  })

  it('every pattern name in the registry is unique', () => {
    // The scanner reports one entity per pattern NAME, so a duplicate name
    // silently swallows a detection in the audit record.
    const names = registry.map((r) => r.name)
    expect(names.length).toBe(new Set(names).size)
  })
})
