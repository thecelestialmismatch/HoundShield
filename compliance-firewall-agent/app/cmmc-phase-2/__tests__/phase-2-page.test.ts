import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { CMMC_STATUS, PHASE2_TARGET_DATE, daysToPhase2 } from '@/lib/compliance/cmmc-status'

/**
 * CMMC Phase 2 is back as a first-class surface.
 *
 * Founder decision, 7 Aug 2026: HoundShield continues to work to 10 November
 * 2026. When enforcement was paused on 13 July the programme was stripped out of
 * the product down to one constant and stopped being a page anyone could land
 * on — which over-corrected, because a contractor searching "CMMC Phase 2" is
 * precisely the buyer and we had nothing for them.
 *
 * This file pins the two things that make the page defensible at the same time:
 * it treats November as the date to be ready for, AND it states the pause. Drop
 * either and the page fails — one way we lose the buyer who searches for the
 * memo, the other way we leave them unprepared.
 */

const CFA = path.resolve(__dirname, '../../..')
const PAGE = readFileSync(path.join(CFA, 'app/cmmc-phase-2/page.tsx'), 'utf8')

describe('the page exists and is reachable', () => {
  it('resolves at /cmmc-phase-2', () => {
    expect(existsSync(path.join(CFA, 'app/cmmc-phase-2/page.tsx'))).toBe(true)
  })

  it('is indexable and self-canonical — it is a search surface, not a tool page', () => {
    expect(PAGE).toMatch(/canonical: '\/cmmc-phase-2'/)
    expect(PAGE).not.toMatch(/index:\s*false/)
  })

  it('renders per request, because it counts down to a real date', () => {
    expect(PAGE).toMatch(/export const dynamic = ['"]force-dynamic['"]/)
  })
})

describe('November is treated as the date to be ready for', () => {
  it('names the target date', () => {
    expect(PHASE2_TARGET_DATE).toBe('10 November 2026')
    expect(CMMC_STATUS.targetDate).toBe(PHASE2_TARGET_DATE)
    expect(PAGE).toMatch(/PHASE2_TARGET_DATE/)
  })

  it('counts down to it correctly', () => {
    expect(daysToPhase2(new Date('2026-11-09T00:00:00Z'))).toBe(1)
    expect(daysToPhase2(new Date('2026-11-10T00:00:00Z'))).toBe(0)
    // Past the date, negative — so the UI can branch instead of showing a
    // cheerful countdown to a day that has already gone.
    expect(daysToPhase2(new Date('2026-11-20T00:00:00Z'))).toBeLessThan(0)
  })

  it('answers "is Phase 2 cancelled?" with a clear no', () => {
    // That is the exact query a worried contractor types, so the page carries
    // the question verbatim — and the answer has to be unambiguous. Asserting
    // the Q&A pair rather than scanning for the word, because the word
    // legitimately appears in the question itself and in "not cancelled".
    const faq = PAGE.slice(PAGE.indexOf('const FAQS'), PAGE.indexOf('export default'))
    const q = faq.indexOf('Is CMMC Phase 2 cancelled?')
    expect(q, 'the page must carry the question a buyer actually searches').toBeGreaterThan(-1)

    const answer = faq.slice(q, q + 420)
    expect(answer).toMatch(/answer:\s*\n?\s*'No\./)
    expect(answer).toMatch(/paused Phase 2 enforcement/)

    // And the canonical blurb every other surface quotes says it too.
    expect(CMMC_STATUS.blurb).toMatch(/has not been cancelled/i)
  })
})

describe('and the pause is stated, not hidden', () => {
  it('names the 13 July pause on the page', () => {
    // A buyer finds the DoW memo in one search. A page that omits it loses the
    // deal on the spot; the honest framing is also the more urgent one.
    expect(PAGE).toMatch(/13 July 2026/)
    expect(CMMC_STATUS.pausedOn).toBe('2026-07-13')
  })

  it('says what the pause did NOT touch', () => {
    for (const fact of CMMC_STATUS.stillInForce) {
      expect(fact.length).toBeGreaterThan(10)
    }
    expect(CMMC_STATUS.blurb).toMatch(/DFARS 252\.204-7012/)
    expect(CMMC_STATUS.blurb).toMatch(/110 NIST SP 800-171 Rev 2/)
    expect(CMMC_STATUS.blurb).toMatch(/SPRS/)
  })

  it('leads the urgency with liability, which no memo can pause', () => {
    expect(CMMC_STATUS.liveRisk).toMatch(/False Claims Act/)
    expect(CMMC_STATUS.liveRisk).toMatch(/MORSECORP/)
  })
})

describe('one source of truth', () => {
  it('takes every date and status string from lib/compliance/cmmc-status', () => {
    expect(PAGE).toMatch(/from '@\/lib\/compliance\/cmmc-status'/)
    // No hardcoded date literals — when a new memo lands, one file changes.
    const body = PAGE.slice(PAGE.indexOf('export default'))
    expect(body).not.toMatch(/10 November 2026/)
  })

  it('keeps the CUI boundary honest in the FAQ', () => {
    // NEVER-DO: claim the hosted endpoint is CUI-safe.
    expect(PAGE).toMatch(/non-CUI evaluation only/)
    expect(PAGE).toMatch(/Docker container on your infrastructure/)
  })

  it('quotes no price below the $499 floor', () => {
    expect(PAGE).toMatch(/PURCHASABLE_OFFER\.price/)
    expect(PAGE).not.toMatch(/\$\d{1,2}9\/mo|\$199|\$99/)
  })
})

describe('pitch decks never reach the repository', () => {
  it('has no deck file tracked by git, anywhere', () => {
    // Founder instruction, restated 7 Aug 2026. `docs/decks/` is gitignored, but
    // an ignore rule only protects files that were never added — `git add -f`
    // or a rule edit would slip one in silently. This asserts the outcome.
    const repo = path.resolve(CFA, '..')
    const tracked = execFileSync('git', ['ls-files', 'docs/decks'], {
      cwd: repo,
      encoding: 'utf8',
    })
      .split('\n')
      .filter(Boolean)

    expect(
      tracked,
      `pitch decks must stay local — these are tracked by git:\n${tracked.join('\n')}`,
    ).toEqual([])
  })

  it('keeps the ignore rule that backs it up', () => {
    const repo = path.resolve(CFA, '..')
    const gitignore = readFileSync(path.join(repo, '.gitignore'), 'utf8')
    expect(gitignore).toMatch(/^docs\/decks\/$/m)
  })
})

describe('the site links to the reinstated page', () => {
  it('is reachable from at least one other surface', () => {
    // A page nothing links to is a page nobody finds, including Google.
    const hits: string[] = []
    const walk = (dir: string) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name)
        if (e.isDirectory()) {
          if (['node_modules', '.next', '__tests__'].includes(e.name)) continue
          walk(full)
          continue
        }
        if (!/\.tsx?$/.test(e.name) || /\.(test|spec)\./.test(e.name)) continue
        if (full.includes('app/cmmc-phase-2')) continue
        if (/["'`]\/cmmc-phase-2["'`]/.test(readFileSync(full, 'utf8'))) {
          hits.push(path.relative(CFA, full))
        }
      }
    }
    for (const d of ['app', 'components', 'lib']) walk(path.join(CFA, d))
    expect(hits.length, 'nothing links to /cmmc-phase-2').toBeGreaterThan(0)
  })
})
