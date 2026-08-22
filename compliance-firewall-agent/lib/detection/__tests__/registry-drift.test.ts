import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const APP = join(__dirname, '..', '..', '..')
const REPO = join(APP, '..')

/* ──────────────────────────────────────────────────────────────────
 * Detection registry drift guard.
 *
 * HoundShield maintains TWO independent pattern registries:
 *
 *   proxy/patterns/index.ts        — 40 patterns. The shipped product;
 *                                    what actually runs in Mode B on the
 *                                    customer's own infrastructure.
 *   lib/classifier/*-patterns.ts   — 56 patterns. What the hosted app,
 *                                    the gateway and the PDF evidence
 *                                    generator scan with.
 *
 * There is no shared source of truth between them and no npm workspace
 * to hang one on. Nothing stops a CUI rule being added to one side and
 * forgotten on the other — and the failure is silent in the worst
 * direction: the demo blocks a prompt the customer's own deployment
 * would let through, or vice versa.
 *
 * Merging them is real work (two different object shapes, and
 * CLAUDE.md's rule that proxy patterns are extend-never-replace), so
 * this file guards the invariants instead. It is deliberately narrow:
 * it pins what MUST agree and stays silent about what may legitimately
 * differ, so it doesn't cry wolf and get deleted.
 *
 * ponytail: drift guard, not a merge. Ceiling — it compares declared
 * names and categories as source text, not compiled behaviour, so two
 * patterns sharing a name with different regexes still pass. Upgrade
 * path: extract a shared `packages/detection` both sides import, at
 * which point this file deletes itself.
 *
 * That ceiling was not theoretical. On 2026-08-22 a behavioural audit of
 * the sixteen engines advertised on the site found EIGHT unbacked:
 * ICD / diagnosis, JWT and IPv4 detected nothing in the classifier, and
 * API keys, AWS access key ids, PEM private keys, card numbers in their
 * separated form and trade-secret terms detected nothing in the proxy.
 * All eight were invisible here for the same two reasons — this file
 * compares names, and a missing pattern has no name to compare; and
 * MUST_EXIST_IN_BOTH covered only the CMMC/CUI family, while every gap
 * was PHI, CREDENTIAL or IP.
 *
 * `engine-backing.test.ts` is the behavioural half. It runs realistic
 * input through both compiled registries and fails when an advertised
 * engine detects nothing. Keep both: this one catches a removal, that
 * one catches an absence.
 * ────────────────────────────────────────────────────────────────── */

const PROXY_PATTERNS = join(REPO, 'proxy', 'patterns', 'index.ts')
const CLASSIFIER_FILES = ['patterns.ts', 'cmmc-patterns.ts', 'hipaa-patterns.ts'].map((f) =>
  join(APP, 'lib', 'classifier', f),
)

function declaredNames(...files: string[]): Set<string> {
  const out = new Set<string>()
  for (const f of files) {
    for (const m of readFileSync(f, 'utf8').matchAll(/^\s*name:\s*"([^"]+)"/gm)) {
      out.add(m[1])
    }
  }
  return out
}

function declaredCategories(...files: string[]): Set<string> {
  const out = new Set<string>()
  for (const f of files) {
    for (const m of readFileSync(f, 'utf8').matchAll(/^\s*category:\s*"([^"]+)"/gm)) {
      out.add(m[1])
    }
  }
  return out
}

const proxyNames = declaredNames(PROXY_PATTERNS)
const classifierNames = declaredNames(...CLASSIFIER_FILES)

/**
 * The CMMC/CUI detection family, present in BOTH registries today.
 *
 * This is the set that carries the product's core claim — defense
 * contractors buy the CUI detection. If any of these disappears from
 * either side, the two deployments disagree about what CUI is.
 *
 * Adding a shared pattern? Add it here. Removing one is a deliberate
 * product decision that should require editing this list.
 */
const MUST_EXIST_IN_BOTH = [
  'CAGE code',
  'CDRL reference',
  'CUI marking',
  'Classification markings',
  'Contract number contextual',
  'DD-250 / DD form references',
  'DUNS / UEI number',
  'DoD IPv4 ranges (DISA)',
  'DoD contract number',
  'Health plan beneficiary number',
  'ITAR controlled technology',
  'Military specification / standard references',
  'NIPRNet / SIPRNet references',
  'Program office / DoD system identifier',
  'SF-86 / personnel security',
  'Security clearance level',
  'Task order / delivery order',
  'Technical data package references',
  /*
   * Added 2026-08-22, when the two registries were reconciled on the engines
   * the site advertises. Each of these existed on exactly ONE side, so the
   * demo and the deployment disagreed about whether a credential, an ICD code
   * or a private IP was a finding at all. Pinned here so the reconciliation
   * cannot quietly come apart — the names were deliberately made identical on
   * both sides for that purpose.
   */
  'Medical diagnosis / ICD code',
  'Generic bearer token',
  'Source code markers',
] as const

describe('detection registries — neither may shrink', () => {
  it('the proxy still ships at least 40 patterns', () => {
    // Mirrors the floor enforced by the Compliance Pattern Guard in CI.
    expect(proxyNames.size).toBeGreaterThanOrEqual(40)
  })

  it('the classifier still ships at least 56 patterns', () => {
    expect(classifierNames.size).toBeGreaterThanOrEqual(56)
  })
})

describe('detection registries — the CUI family must not drift apart', () => {
  it.each(MUST_EXIST_IN_BOTH)('%s exists in both registries', (name) => {
    expect(proxyNames.has(name), `missing from proxy/patterns/index.ts`).toBe(true)
    expect(classifierNames.has(name), `missing from lib/classifier`).toBe(true)
  })

  it('reports the whole divergence at once when the sets fall out of sync', () => {
    const missingFromProxy = MUST_EXIST_IN_BOTH.filter((n) => !proxyNames.has(n))
    const missingFromClassifier = MUST_EXIST_IN_BOTH.filter((n) => !classifierNames.has(n))

    expect(
      { missingFromProxy, missingFromClassifier },
      'a shared CUI pattern was removed from one registry but not the other',
    ).toEqual({ missingFromProxy: [], missingFromClassifier: [] })
  })
})

describe('detection registries — category vocabularies are pinned', () => {
  /*
   * These two vocabularies are NOT the same, and that is the finding
   * rather than a bug to fix here: the proxy speaks CUI/PHI/CREDENTIAL
   * while the classifier speaks HIPAA_PHI/FINANCIAL/STRATEGIC. Only IP
   * and PII are common. Anything mapping between the registries is
   * therefore doing an implicit translation.
   *
   * Pinning both sets means adding a category to one side fails here and
   * forces an explicit decision about the other, instead of widening the
   * gap silently.
   */
  it('the proxy vocabulary is unchanged', () => {
    expect([...declaredCategories(PROXY_PATTERNS)].sort()).toEqual([
      'CREDENTIAL',
      'CUI',
      'IP',
      'PHI',
      'PII',
    ])
  })

  it('the classifier vocabulary is unchanged', () => {
    expect([...declaredCategories(...CLASSIFIER_FILES)].sort()).toEqual([
      'FINANCIAL',
      'HIPAA_PHI',
      'IP',
      'PII',
      'STRATEGIC',
    ])
  })

  it('still shares the two categories both sides rely on', () => {
    const shared = [...declaredCategories(PROXY_PATTERNS)].filter((c) =>
      declaredCategories(...CLASSIFIER_FILES).has(c),
    )
    expect(shared.sort()).toEqual(['IP', 'PII'])
  })
})
