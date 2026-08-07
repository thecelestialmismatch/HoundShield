import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { UPCOMING, heroPromotion, headlineUpcoming } from '../upcoming'

/**
 * The roadmap's two failure modes, both guarded here.
 *
 *  1. A DATE. Founder direction 7 Aug 2026: no ship dates. A date is a promise a
 *     small team cannot keep, and a customer told November who gets January
 *     trusts nothing else on the page. The previous /changelog list carried
 *     "Q3 2026" labels; those are gone and cannot come back.
 *  2. A SECOND LIST. /roadmap and /changelog each had their own, and they had
 *     already drifted into describing different products.
 */

const CFA = path.resolve(__dirname, '../../..')
const SRC = readFileSync(path.join(CFA, 'lib/product/upcoming.ts'), 'utf8')

/** Everything below `export const UPCOMING` — the data, not the doc comments. */
const DATA = SRC.slice(SRC.indexOf('export const UPCOMING'))

describe('no ship dates, anywhere in the data', () => {
  const MONTHS =
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)(uary|ruary|ch|il|e|y|ust|tember|ober|ember)?\b/i

  it('names no month', () => {
    const hits = DATA.split('\n').filter((l) => MONTHS.test(l))
    expect(hits, `month named in roadmap data:\n${hits.join('\n')}`).toEqual([])
  })

  it('names no quarter and no year', () => {
    expect(DATA).not.toMatch(/\bQ[1-4]\b/)
    expect(DATA).not.toMatch(/\b20\d\d\b/)
  })

  it('gives every item a window phrase instead', () => {
    expect(UPCOMING.length).toBeGreaterThan(0)
    for (const f of UPCOMING) {
      expect(f.window.length, `${f.id} has no window`).toBeGreaterThan(3)
      expect(f.window).not.toMatch(/\d/)
    }
  })
})

describe('every item is complete enough to show a customer', () => {
  it.each(UPCOMING.map((f) => [f.id, f] as const))('%s', (_id, f) => {
    expect(f.title.length).toBeGreaterThan(4)
    expect(f.blurb.length).toBeGreaterThan(30)
    expect(f.why.length).toBeGreaterThan(30)
    // The brief demo — both halves, or the panel renders a lopsided comparison.
    expect(f.demo.before.length).toBeGreaterThan(10)
    expect(f.demo.after.length).toBeGreaterThan(10)
    expect(f.demo.before).not.toBe(f.demo.after)
  })

  it('has unique ids, since they are React keys', () => {
    expect(new Set(UPCOMING.map((f) => f.id)).size).toBe(UPCOMING.length)
  })
})

describe('the hero slot', () => {
  it('promotes nothing today — the hero belongs to what we sell now', () => {
    expect(heroPromotion()).toBeNull()
    expect(UPCOMING.every((f) => f.promote === false)).toBe(true)
  })

  it('returns at most one item however many are flagged', () => {
    // A hero listing three unreleased features is not a hero.
    const many = UPCOMING.map((f) => ({ ...f, promote: true }))
    expect(heroPromotion(many)?.id).toBe(many[0].id)
  })

  it('renders nothing at all when nothing is promoted', () => {
    const banner = readFileSync(
      path.join(CFA, 'components/landing/UpcomingHeroBanner.tsx'),
      'utf8',
    )
    // Null, not an empty container — no reserved space, no layout shift on the
    // page that matters most.
    expect(banner).toMatch(/if \(!feature\) return null/)
  })

  it('leads the dashboard with the first item', () => {
    expect(headlineUpcoming()?.id).toBe(UPCOMING[0].id)
    expect(headlineUpcoming([])).toBeNull()
  })
})

describe('one list, read everywhere', () => {
  it('is the only roadmap list in the app', () => {
    // /changelog used to keep its own `const roadmap = [...]`. Two lists about
    // one product is two answers to the same customer question.
    const offenders: string[] = []
    const walk = (dir: string) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name)
        if (e.isDirectory()) {
          if (['node_modules', '.next', '__tests__'].includes(e.name)) continue
          walk(full)
          continue
        }
        if (!/\.tsx?$/.test(e.name) || /\.(test|spec)\./.test(e.name)) continue
        if (full.includes('lib/product/upcoming')) continue
        if (/^\s*const roadmap\s*=\s*\[/m.test(readFileSync(full, 'utf8'))) {
          offenders.push(path.relative(CFA, full))
        }
      }
    }
    for (const d of ['app', 'components', 'lib']) walk(path.join(CFA, d))
    expect(offenders, `local roadmap lists found:\n${offenders.join('\n')}`).toEqual([])
  })

  it('is read by the changelog, the dashboard panel and the hero slot', () => {
    const reads = (p: string) => readFileSync(path.join(CFA, p), 'utf8')
    expect(reads('app/changelog/page.tsx')).toMatch(/from ["']@\/lib\/product\/upcoming["']/)
    expect(reads('components/dashboard/operator/ComingSoon.tsx')).toMatch(/@\/lib\/product\/upcoming/)
    expect(reads('components/landing/UpcomingHeroBanner.tsx')).toMatch(/@\/lib\/product\/upcoming/)
  })

  it('labels the dashboard panel as unbuilt', () => {
    // It sits among panels that are measurements of the customer's own traffic.
    // Unlabelled, it reads as a feature they have and cannot find.
    const panel = readFileSync(
      path.join(CFA, 'components/dashboard/operator/ComingSoon.tsx'),
      'utf8',
    )
    expect(panel).toMatch(/Not built yet/)
  })
})
