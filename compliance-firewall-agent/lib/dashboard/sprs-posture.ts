/**
 * SPRS posture for the operator dashboard — the "Risk Assessment" radar and the
 * compliance headline numbers, computed from the customer's OWN assessment.
 *
 * Where the data comes from, and why that matters: the 110-control assessment
 * lives in the operator's browser (`lib/shieldready/storage`, localStorage), not
 * on our servers. That is a deliberate privacy boundary — a customer's control
 * gaps are among the most sensitive things they hold, and HoundShield is sold on
 * never needing them. So this module is pure and synchronous: the caller reads
 * localStorage, passes the responses in, and the maths happens on-device.
 *
 * The mockup this replaces drew an eight-axis radar from a hardcoded
 * `riskRadarData` array with invented per-family scores. The real scoring engine
 * already computes a fourteen-family breakdown, so the radar below is a
 * projection of `calculateSPRS().byFamily` — the same numbers the CMMC
 * Assessment tab and the $499 PDF are built from. One source of truth, so the
 * dashboard and the evidence pack can never disagree in front of an assessor.
 */

import { CONTROL_FAMILIES } from '@/lib/shieldready/controls/families'
import { calculateSPRS } from '@/lib/shieldready/scoring'
import type { AssessmentResponse, ControlFamily, NISTControl } from '@/lib/shieldready/types'

export interface RadarAxis {
  /** Family code, e.g. "AC". */
  code: ControlFamily
  /** Short display label for the axis, e.g. "Access Control". */
  label: string
  /** 0–100: share of this family's SPRS points the customer currently retains. */
  retainedPct: number
  met: number
  partial: number
  unmet: number
  /** Controls in the family (from the authoritative family metadata). */
  total: number
}

export interface SprsPosture {
  /** True once the operator has answered at least one control. Until then every
   *  axis is 0 by definition (unassessed scores as unmet), which is honest but
   *  meaningless to plot — the UI shows a "start your assessment" state. */
  assessed: boolean
  /** −203 … 110. */
  score: number
  metCount: number
  partialCount: number
  unmetCount: number
  /** Controls with a recorded answer, of 110. */
  assessedCount: number
  totalControls: number
  completionPercent: number
  axes: RadarAxis[]
}

/** The score a conditional CMMC Level 2 award typically requires. Product
 *  reference point, not a measurement — kept beside the posture so the radar
 *  and the gauge quote the same target. */
export const SPRS_TARGET = 88

/**
 * Project an assessment into dashboard posture.
 *
 * `retainedPct` reads as "how much of this family is in place": each family has
 * a `maxDeduction` (the points lost if nothing in it is implemented), and
 * `byFamily[].score` is the deduction currently applied, always ≤ 0. Retained
 * points are therefore `maxDeduction + score`, and the percentage is that over
 * `maxDeduction`. A family with no deductions available is fully retained.
 */
export function buildSprsPosture(
  controls: NISTControl[],
  responses: AssessmentResponse[],
): SprsPosture {
  const sprs = calculateSPRS(controls, responses)

  const axes: RadarAxis[] = CONTROL_FAMILIES.map((family) => {
    const bucket = sprs.byFamily[family.code] ?? { met: 0, partial: 0, unmet: 0, score: 0 }
    const retained = family.maxDeduction > 0
      ? ((family.maxDeduction + bucket.score) / family.maxDeduction) * 100
      : 100
    return {
      code: family.code,
      label: family.name,
      // Clamp: families.ts maxDeduction values are family-level approximations
      // (documented in scoring.ts as summing to 294 vs the control-level 313),
      // so a family can in principle over-deduct. A negative axis would render
      // as a spike through the centre of the radar, which reads as a bug.
      retainedPct: Math.max(0, Math.min(100, Math.round(retained))),
      met: bucket.met,
      partial: bucket.partial,
      unmet: bucket.unmet,
      total: family.controlCount,
    }
  })

  return {
    assessed: sprs.assessedCount > 0,
    score: sprs.total,
    metCount: sprs.metCount,
    partialCount: sprs.partialCount,
    unmetCount: sprs.unmetCount,
    assessedCount: sprs.assessedCount,
    totalControls: controls.length,
    completionPercent: sprs.completionPercent,
    axes,
  }
}
