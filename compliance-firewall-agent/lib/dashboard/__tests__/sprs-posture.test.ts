import { describe, it, expect } from 'vitest'
import { buildSprsPosture, SPRS_TARGET } from '../sprs-posture'
import { ALL_CONTROLS } from '@/lib/shieldready/controls'
import { CONTROL_FAMILIES } from '@/lib/shieldready/controls/families'
import type { AssessmentResponse } from '@/lib/shieldready/types'

/**
 * The risk radar's contract.
 *
 * The mockup this replaces drew eight axes from a hardcoded array of invented
 * per-family percentages. These tests pin that the radar is now a projection of
 * the real scoring engine — same families, same maths as the CMMC Assessment
 * tab and the $499 PDF — and that an unassessed operator gets an honest
 * "nothing here yet" rather than a plausible-looking shape.
 */

function answer(controlId: string, status: AssessmentResponse['status']): AssessmentResponse {
  return { controlId, status, notes: '', evidenceUploaded: false, answeredAt: new Date(0).toISOString() }
}

describe('buildSprsPosture — the unassessed case', () => {
  const p = buildSprsPosture(ALL_CONTROLS, [])

  it('reports NOT assessed, so the UI can show a start-here state', () => {
    expect(p.assessed).toBe(false)
    expect(p.assessedCount).toBe(0)
    expect(p.metCount).toBe(0)
  })

  it('still exposes every control family as an axis', () => {
    expect(p.axes).toHaveLength(CONTROL_FAMILIES.length)
    expect(p.axes.map((a) => a.code)).toEqual(CONTROL_FAMILIES.map((f) => f.code))
  })

  it('counts all 110 controls', () => {
    expect(p.totalControls).toBe(110)
  })
})

describe('buildSprsPosture — axes track the real assessment', () => {
  it('a fully-met family retains 100% of its points', () => {
    const ac = ALL_CONTROLS.filter((c) => c.family === 'AC')
    const p = buildSprsPosture(ALL_CONTROLS, ac.map((c) => answer(c.id, 'MET')))
    const axis = p.axes.find((a) => a.code === 'AC')
    expect(axis?.retainedPct).toBe(100)
    expect(axis?.met).toBe(ac.length)
    expect(axis?.unmet).toBe(0)
  })

  it('marks the operator as assessed once a single control is answered', () => {
    const p = buildSprsPosture(ALL_CONTROLS, [answer(ALL_CONTROLS[0].id, 'MET')])
    expect(p.assessed).toBe(true)
    expect(p.assessedCount).toBe(1)
  })

  it('an unmet family scores lower than a met one', () => {
    const ac = ALL_CONTROLS.filter((c) => c.family === 'AC')
    const met = buildSprsPosture(ALL_CONTROLS, ac.map((c) => answer(c.id, 'MET')))
    const unmet = buildSprsPosture(ALL_CONTROLS, ac.map((c) => answer(c.id, 'UNMET')))
    const pct = (p: typeof met) => p.axes.find((a) => a.code === 'AC')!.retainedPct
    expect(pct(met)).toBeGreaterThan(pct(unmet))
  })

  it('every axis stays within 0–100, so no spoke inverts through the centre', () => {
    // families.ts carries family-level maxDeduction approximations that can
    // over-deduct; a negative percentage would render as a spike through the
    // radar's origin and read as a rendering bug.
    for (const responses of [[], ALL_CONTROLS.map((c) => answer(c.id, 'UNMET'))]) {
      for (const axis of buildSprsPosture(ALL_CONTROLS, responses).axes) {
        expect(axis.retainedPct).toBeGreaterThanOrEqual(0)
        expect(axis.retainedPct).toBeLessThanOrEqual(100)
      }
    }
  })

  it('agrees with the headline counts it reports', () => {
    const responses = ALL_CONTROLS.slice(0, 10).map((c) => answer(c.id, 'MET'))
    const p = buildSprsPosture(ALL_CONTROLS, responses)
    expect(p.metCount).toBe(10)
    expect(p.assessedCount).toBe(10)
    expect(p.completionPercent).toBeCloseTo((10 / 110) * 100, 1)
  })

  it('a fully-met assessment reaches the top of the SPRS range', () => {
    const p = buildSprsPosture(ALL_CONTROLS, ALL_CONTROLS.map((c) => answer(c.id, 'MET')))
    expect(p.score).toBe(110)
    expect(p.score).toBeGreaterThan(SPRS_TARGET)
  })
})
