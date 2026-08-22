import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { BUILTIN_PATTERNS } from '@/lib/classifier/patterns'
import { ENGINES } from '../engines'

const REPO = join(__dirname, '..', '..', '..', '..')

/* ──────────────────────────────────────────────────────────────────
 * Every advertised engine must actually detect something.
 *
 * THE DEFECT THIS CLOSES. `ENGINES` is published to the homepage,
 * /features and the products data, and "16 detection engines" is computed
 * from `ENGINES.length` precisely so the marketing number cannot drift
 * from the list. That machinery guarantees the COUNT matches the list. It
 * guarantees nothing about whether the listed engines exist.
 *
 * Three of the sixteen did not, in the app registry:
 *
 *   'ICD / diagnosis'    nothing matched "patient diagnosis E11.9 noted"
 *   'JWT / tokens'       nothing matched an Authorization: Bearer JWT
 *   'IP / network data'  nothing matched 10.0.4.17 or 192.168.1.44
 *
 * All three worked in `proxy/patterns/index.ts` the whole time. So the
 * shipped Docker proxy — Mode B, the CUI-safe deployment a customer
 * actually buys — detected strictly more than the free /demo scanner and
 * the $499 evidence report, which run on this registry. A buyer pasting a
 * prompt containing an ICD code into the demo saw a clean result and a
 * "16 detection engines" claim describing something else.
 *
 * WHY registry-drift.test.ts DID NOT CATCH IT — it says so itself:
 *   "it compares declared NAMES and categories as source text, not
 *    compiled behaviour"
 * and its MUST_EXIST_IN_BOTH set covers only the CMMC/CUI family. All
 * three gaps were PHI, CREDENTIAL and IP — outside the guarded set, and
 * invisible to a name comparison because the app registry had no name to
 * compare.
 *
 * This file is the behavioural half its ceiling asks for: run real input
 * through the real compiled regexes, on both sides.
 * ────────────────────────────────────────────────────────────────── */

/**
 * One representative input per advertised engine.
 *
 * Deliberately boring, realistic prompt text rather than a regex probe —
 * the question is "would this engine fire on something a nurse or an
 * engineer would actually paste", not "can I construct a string that
 * satisfies the expression".
 */
const SAMPLES: Record<(typeof ENGINES)[number], string> = {
  'CUI markings': 'CUI//SP-CTI marked document attached',
  'CAGE codes': 'our CAGE code 1ABC2 is on the contract',
  'Contract / DoDAAC #': 'contract W912DY-24-C-0001 with the Navy',
  'Clearance levels': 'he holds a TS/SCI clearance',
  'ITAR / EAR terms': 'this is ITAR controlled technical data',
  'Export-control': 'export controlled under USML Category XI',
  'SSN / PII': 'employee ssn 123-45-6789 on file',
  'PHI · MRN': 'patient MRN 4429871 admitted Tuesday',
  'ICD / diagnosis': 'patient diagnosis E11.9 noted at intake',
  // Deliberately NOT shaped like a real Stripe key: the repo's secret-scanning
  // pre-commit hook flags an `sk_live_` prefix even inside a fixture, and a hook
  // people learn to `--no-verify` past is worse than no hook.
  'API keys / secrets': 'api_key = EXAMPLE0NOTAREALKEY0000000000',
  'AWS / cloud keys': 'AKIA1234567890ABCD12 is the access key',
  'JWT / tokens': 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.abcdef',
  'PCI / card data': 'card 4111 1111 1111 1111 exp 12/28',
  'Source code': 'function transferFunds(acct) { return db.query(sql); }',
  'Trade-secret IP': 'our pricing strategy undercuts them by 30%',
  'IP / network data': 'the server at 10.0.4.17 is exposed',
}

/** Names of app patterns that fire on `text`. */
function appHits(text: string): string[] {
  return BUILTIN_PATTERNS.filter((p) => {
    p.regex.lastIndex = 0
    return p.regex.test(text)
  }).map((p) => p.name)
}

/**
 * The proxy's compiled patterns, reconstructed from source.
 *
 * The proxy is a separate package with no build output this test can
 * import, so its expressions are lifted out of the source text and
 * recompiled. That is enough to answer the only question asked here —
 * does anything fire — and the count assertion below fails loudly if the
 * extraction ever silently stops working.
 */
function proxyPatterns(): { name: string; regex: RegExp }[] {
  const src = readFileSync(join(REPO, 'proxy', 'patterns', 'index.ts'), 'utf8')
  const out: { name: string; regex: RegExp }[] = []
  const decl =
    /name:\s*"([^"]+)"[\s\S]{0,400}?regex:\s*(\/(?:\\.|\[(?:\\.|[^\]])*\]|[^/\\])+\/[gimsuy]*)/g
  for (const m of src.matchAll(decl)) {
    const literal = m[2]
    const close = literal.lastIndexOf('/')
    const flags = literal.slice(close + 1)
    out.push({
      name: m[1],
      regex: new RegExp(literal.slice(1, close), flags.includes('g') ? flags : flags + 'g'),
    })
  }
  return out
}

const PROXY = proxyPatterns()

function proxyHits(text: string): string[] {
  return PROXY.filter((p) => {
    p.regex.lastIndex = 0
    return p.regex.test(text)
  }).map((p) => p.name)
}

describe('advertised engines are backed by real detections', () => {
  it('the proxy extraction actually found the shipped patterns', () => {
    // Without this, a broken extraction would make every proxy assertion
    // below vacuously... fail, or worse, quietly pass a future rewrite.
    expect(PROXY.length).toBeGreaterThanOrEqual(33)
  })

  it('every engine in ENGINES has a sample', () => {
    // A missing sample would silently exempt a new engine from the whole file.
    for (const engine of ENGINES) {
      expect(SAMPLES[engine], `no sample for advertised engine: ${engine}`).toBeTruthy()
    }
    expect(Object.keys(SAMPLES).length).toBe(ENGINES.length)
  })

  it.each(ENGINES)('%s fires in the app registry (free /demo, $499 report)', (engine) => {
    const text = SAMPLES[engine]
    expect(appHits(text), `"${text}" matched no app pattern`).not.toEqual([])
  })

  it.each(ENGINES)('%s fires in the shipped proxy (Mode B)', (engine) => {
    const text = SAMPLES[engine]
    expect(proxyHits(text), `"${text}" matched no proxy pattern`).not.toEqual([])
  })

  it('reports every unbacked engine at once rather than one per run', () => {
    const dead = ENGINES.filter(
      (e) => appHits(SAMPLES[e]).length === 0 || proxyHits(SAMPLES[e]).length === 0,
    )
    expect(dead, 'an advertised engine detects nothing on either side').toEqual([])
  })

  it('still has teeth — a nonsense sample must not pass', () => {
    expect(appHits('the quick brown fox jumps over the lazy dog')).toEqual([])
    expect(proxyHits('the quick brown fox jumps over the lazy dog')).toEqual([])
  })
})
