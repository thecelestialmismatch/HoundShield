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
 *   proxy/patterns/index.ts        — 33 patterns. The shipped product;
 *                                    what actually runs in Mode B on the
 *                                    customer's own infrastructure.
 *   lib/classifier/*-patterns.ts   — 53 patterns. What the hosted app,
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
 * ponytail: drift guard, not a merge. Remaining upgrade path: extract a
 * shared `packages/detection` both sides import, at which point this
 * file deletes itself.
 *
 * ── 2026-09-03: the ceiling this file used to declare is now closed ──
 * It previously compared declared names and categories as SOURCE TEXT
 * only, and said so: "two patterns sharing a name with different regexes
 * still pass." That blind spot had already been walked through. An audit
 * found three shared rules whose regexes had diverged, the worst being
 * `Health plan beneficiary number`: the shipped proxy recognised neither
 * `subscriber`, `policy` nor `group` identifiers, so Mode B — the
 * deployment the CUI/HIPAA claim rests on — let through five PHI strings
 * the hosted demo blocked, and this guard stayed green throughout.
 *
 * The third describe block below now imports BOTH registries and runs a
 * shared corpus through them, asserting that rules sharing a name reach
 * the same verdict on the same input. Names are no longer taken on
 * trust; behaviour is compared.
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
  'Program manager designator',
  'Program office / DoD system identifier',
  'SF-86 / personnel security',
  'Security clearance level',
  'Task order / delivery order',
  'Technical data package references',
] as const

describe('detection registries — neither may shrink', () => {
  it('the proxy still ships at least 33 patterns', () => {
    // Mirrors the floor enforced by the Compliance Pattern Guard in CI.
    expect(proxyNames.size).toBeGreaterThanOrEqual(33)
  })

  it('the classifier still ships at least 53 patterns', () => {
    expect(classifierNames.size).toBeGreaterThanOrEqual(53)
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

/* ──────────────────────────────────────────────────────────────────
 * BEHAVIOURAL PARITY — the guard that would have caught the 2026-09-03
 * drift.
 *
 * Everything above compares declared text. This block compares what the
 * two engines actually DO. Both registries are imported and every rule
 * that exists in both, by name, is run against the same corpus. If the
 * two copies of a rule disagree about a single string, this fails and
 * names the string.
 *
 * Why a corpus and not a regex-source comparison: identical behaviour is
 * the property that matters, and two differently-written regexes can be
 * behaviourally identical. Comparing sources would fail on harmless
 * reformatting and train people to ignore it.
 * ────────────────────────────────────────────────────────────────── */

import { ALL_PATTERNS } from '../../../../proxy/patterns/index'
import { BUILTIN_PATTERNS } from '../../classifier/patterns'
import { CMMC_PATTERNS } from '../../classifier/cmmc-patterns'
import { HIPAA_PATTERNS } from '../../classifier/hipaa-patterns'

/**
 * Strings that must be judged identically by both deployments.
 *
 * Every entry is either a realistic regulated-data string or a benign
 * near-miss chosen because it sits close to a rule's edge. The benign
 * ones matter as much as the positives: a rule that over-blocks a clock
 * time or the word "pending" costs the customer trust, and both of those
 * were real false positives in this corpus's first run.
 */
const PARITY_CORPUS: readonly string[] = [
  // ── PHI / health plan identifiers ────────────────────────────────
  'Patient subscriber ID A9931204 needs prior auth',
  'policy number 88213345 for the claim',
  'group number 4471209 on the card',
  'health plan id 90210XT',
  'memberID 4471209823',
  'member id: 887711209',
  'insurance # 55192837',
  'beneficiary number 100244',
  'Member Number = X88213',
  'Policy number pending — will send later.',
  'Insurance number missing from the intake form.',
  'The health plan is under review by legal.',

  // ── CUI / defense markings ───────────────────────────────────────
  'CUI//SP-CTI distribution statement D',
  'Summarize our CAGE code 1ABC2 contract for the Navy',
  'contract W58RGZ-23-C-0123 modification',
  'ITAR controlled technology export summary',
  'SECRET//NOFORN briefing notes',
  'clearance level: TS/SCI with CI polygraph',
  'DD-250 material inspection receiving report',
  'CDRL A001 deliverable schedule',
  'MIL-STD-810H environmental testing',
  'DUNS 123456789 registration',

  // ── program / system identifiers, incl. the PM clock-time trap ───
  'PM Stryker briefing deck attached',
  'PEO Soldier requirements doc',
  'PMS 408 program schedule',
  'ACAT II milestone review',
  'Can we move the standup to 4 PM tomorrow?',
  'Ship it by 5 pm Friday please',
  'The deploy window closes at 11 PM tonight',

  // ── network identifiers ──────────────────────────────────────────
  'transfer via SIPRNet to the .smil.mil host',
  'NIPRNet access request pending',
  'the hostmil.mil address is not a SIPR reference',

  // ── benign control strings ───────────────────────────────────────
  //
  // Everything below this line QUARANTINEd at HIGH risk before 2026-09-03.
  // The "Task order / delivery order" rule carried bare TO/DO with no
  // closing word boundary, so it matched inside ordinary English —
  // "tomorrow", "document", "download", "together" — and under the `i`
  // flag its [A-Z0-9]{4,} identifier matched any word. Ten of ten normal
  // sentences were quarantined by that single rule. Keep them here.
  'Please review the attached quarterly marketing plan.',
  'Our group met at noon to review the policy.',
  'Refactor the login handler to use the shared limiter.',
  'Please download the onboarding document',
  'We need to document the rollback steps',
  'Put the two teams together on this',
  'What is the total spend to date?',
  'Do these tests pass locally?',
  'Going to production on Thursday',
  'I need to review the tooling first',
]

/**
 * Ordinary working sentences that must never trip a detection rule.
 *
 * A DLP product that quarantines "Going to production on Thursday" is one
 * the operator switches off in a week. These are regression anchors, not
 * decoration — each one was a real false positive.
 */
const MUST_STAY_CLEAN: readonly string[] = [
  'Please review the attached quarterly marketing plan.',
  'Refactor the login handler to use the shared limiter.',
  'Can we move the standup to 4 PM tomorrow?',
  'Ship it by 5 pm Friday please',
  'The deploy window closes at 11 PM tonight',
  'Policy number pending — will send later.',
  'Please download the onboarding document',
  'We need to document the rollback steps',
  'Put the two teams together on this',
  'What is the total spend to date?',
  'Do these tests pass locally?',
  'Going to production on Thursday',
  'I need to review the tooling first',
  'The health plan is under review by legal.',
  'Insurance number missing from the intake form.',
]

/** name -> regex, for every rule declared in a registry. */
function byName(...sets: ReadonlyArray<{ name: string; regex: RegExp }>[]) {
  const out = new Map<string, RegExp>()
  for (const set of sets) for (const p of set) out.set(p.name, p.regex)
  return out
}

const proxyRules = byName(ALL_PATTERNS)
const classifierRules = byName(BUILTIN_PATTERNS, CMMC_PATTERNS, HIPAA_PATTERNS)

/** Fresh evaluation — these regexes are global, so lastIndex must be reset. */
function matches(re: RegExp, text: string): boolean {
  re.lastIndex = 0
  return re.test(text)
}

const sharedRuleNames = [...proxyRules.keys()]
  .filter((n) => classifierRules.has(n))
  .sort()

describe('detection registries — shared rules must behave identically', () => {
  it('there is a meaningful shared surface to compare', () => {
    // Guards against this whole block silently passing because a rename
    // emptied the intersection.
    expect(sharedRuleNames.length).toBeGreaterThanOrEqual(18)
  })

  it.each(sharedRuleNames)('%s reaches the same verdict in both engines', (name) => {
    const proxyRe = proxyRules.get(name)!
    const classifierRe = classifierRules.get(name)!

    const disagreements = PARITY_CORPUS.filter(
      (text) => matches(proxyRe, text) !== matches(classifierRe, text),
    ).map((text) => ({
      text,
      proxy: matches(proxyRe, text) ? 'BLOCK' : 'allow',
      classifier: matches(classifierRe, text) ? 'BLOCK' : 'allow',
    }))

    expect(
      disagreements,
      `"${name}" is declared in both registries but they disagree. ` +
        `Mode B (proxy) is what the customer actually runs; a rule that is ` +
        `weaker there than in the hosted plane is a detection gap in the ` +
        `deployment the CUI/HIPAA claim depends on.`,
    ).toEqual([])
  })
})

describe('detection registries — the corpus itself stays honest', () => {
  /*
   * A parity suite passes trivially if both engines ignore everything.
   * These two assertions keep the corpus load-bearing: it must contain
   * strings that DO trip the shared rules, and strings that trip none.
   */
  const anyProxyMatch = (t: string) =>
    [...proxyRules.values()].some((re) => matches(re, t))

  it('contains regulated strings both engines detect', () => {
    const detected = PARITY_CORPUS.filter(anyProxyMatch)
    expect(detected.length).toBeGreaterThanOrEqual(15)
  })

  it.each(MUST_STAY_CLEAN)('Mode B leaves %j alone', (sentence) => {
    const firing = [...proxyRules.entries()]
      .filter(([, re]) => matches(re, sentence))
      .map(([name]) => name)

    expect(
      firing,
      'an ordinary working sentence trips a detection rule in the SHIPPED ' +
        'proxy. False positives on everyday text are how operators learn to ' +
        'switch the product off.',
    ).toEqual([])
  })

  it.each(MUST_STAY_CLEAN)('the hosted plane leaves %j alone', (sentence) => {
    const firing = [...classifierRules.entries()]
      .filter(([, re]) => matches(re, sentence))
      .map(([name]) => name)

    expect(firing, 'an ordinary working sentence trips a hosted rule').toEqual([])
  })
})
