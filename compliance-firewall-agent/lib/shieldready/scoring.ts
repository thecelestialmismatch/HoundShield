/**
 * SPRS Scoring Engine — Kaelus.online
 *
 * Implements the DoD Supplier Performance Risk System (SPRS) scoring methodology
 * as defined in NIST SP 800-171 Rev 2 and the DFARS 252.204-7019/7020/7021 clause set.
 *
 * Authoritative references:
 *   - NIST SP 800-171 Rev 2, Table 1 (110 practice requirements, summing to 203 points)
 *   - DoD Assessment Methodology v1.2.1 (Nov 2020)
 *   - DFARS Case 2019-D041 (interim rule establishing SPRS scoring)
 *
 * Score range: -203 (every control UNMET) to +110 (every control MET).
 * Starting value: 110.
 * Deduction per control: stored as a negative integer on NISTControl.sprsDeduction.
 *
 * Sign convention used throughout this file:
 *   NISTControl.sprsDeduction is NEGATIVE (e.g., -5 means 5 points deducted if unmet).
 *   All arithmetic here preserves that convention; we never flip the sign externally.
 */

import {
  NISTControl,
  AssessmentResponse,
  SPRSScore,
  ControlFamily,
  ControlStatus,
} from './types';

import { CONTROL_FAMILIES } from './controls/families';

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

/** SPRS baseline score per DoD methodology. */
const SPRS_BASE = 110;

/**
 * All valid ControlFamily codes, derived from the authoritative CONTROL_FAMILIES
 * metadata array to ensure the set is always in sync with the data layer.
 */
const ALL_FAMILIES: readonly ControlFamily[] = CONTROL_FAMILIES.map(
  (f) => f.code,
);

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Build a lookup map from controlId -> AssessmentResponse for O(1) access.
 * Handles duplicate responses defensively by keeping the most recently answered
 * entry (latest `answeredAt` timestamp wins).
 */
function buildResponseMap(
  responses: AssessmentResponse[],
): Map<string, AssessmentResponse> {
  const map = new Map<string, AssessmentResponse>();

  for (const response of responses) {
    if (!response?.controlId) continue;

    const existing = map.get(response.controlId);
    if (!existing) {
      map.set(response.controlId, response);
    } else {
      // Keep whichever was answered more recently
      const existingTime = existing.answeredAt
        ? new Date(existing.answeredAt).getTime()
        : 0;
      const incomingTime = response.answeredAt
        ? new Date(response.answeredAt).getTime()
        : 0;
      if (incomingTime >= existingTime) {
        map.set(response.controlId, response);
      }
    }
  }

  return map;
}

/**
 * Resolve the effective ControlStatus for a control given the response map.
 * If no response exists the control is NOT_ASSESSED.
 */
function resolveStatus(
  controlId: string,
  responseMap: Map<string, AssessmentResponse>,
): ControlStatus {
  return responseMap.get(controlId)?.status ?? 'NOT_ASSESSED';
}

/**
 * Compute the SPRS point deduction applied for a single control given its status.
 *
 * sprsDeduction is stored as a NEGATIVE integer (e.g., -5).
 *
 * Rules:
 *   MET          →  0           (no deduction)
 *   PARTIAL      →  ceil(sprsDeduction / 2)   e.g. ceil(-5/2) = ceil(-2.5) = -2
 *   UNMET        →  sprsDeduction              e.g. -5
 *   NOT_ASSESSED →  sprsDeduction (treated as UNMET per DoD methodology)
 *
 * Note on Math.ceil with negatives: Math.ceil(-2.5) = -2, which is correct
 * because we want the SMALLER absolute deduction (penalty relief for partial
 * implementation). Example: full deduction -5, partial deduction -2 (not -3).
 */
function computeDeduction(control: NISTControl, status: ControlStatus): number {
  // Guard: sprsDeduction must be a finite negative number or zero.
  const raw = control.sprsDeduction;
  if (!Number.isFinite(raw) || raw > 0) {
    // Defensive: if the value was stored as positive by mistake, negate it.
    // If it is non-finite (NaN/Infinity), treat as 0 to avoid corrupting the score.
    if (!Number.isFinite(raw)) return 0;
    // Positive value stored — negate to match expected convention.
    const corrected = -Math.abs(raw);
    return computeDeductionFromValue(corrected, status);
  }
  return computeDeductionFromValue(raw, status);
}

function computeDeductionFromValue(
  sprsDeduction: number,
  status: ControlStatus,
): number {
  switch (status) {
    case 'MET':
      return 0;
    case 'PARTIAL':
      // ceil of a negative number gives the smaller-magnitude integer,
      // i.e., Math.ceil(-2.5) === -2 which is less penalty than -3.
      return Math.ceil(sprsDeduction / 2);
    case 'UNMET':
    case 'NOT_ASSESSED':
      return sprsDeduction;
    default: {
      // Exhaustive check — TypeScript narrows `status` to `never` here.
      const _exhaustive: never = status;
      console.warn(`[SPRS] Unknown ControlStatus: ${String(_exhaustive)}`);
      return sprsDeduction; // Conservative: treat unknown as UNMET
    }
  }
}

/**
 * Build an empty per-family record initialised to zeros for every ControlFamily.
 * This guarantees the returned SPRSScore.byFamily always contains all 14 families,
 * even if a particular family has no controls in the provided array.
 */
function buildEmptyFamilyBreakdown(): SPRSScore['byFamily'] {
  return Object.fromEntries(
    ALL_FAMILIES.map((code) => [
      code,
      { met: 0, partial: 0, unmet: 0, score: 0 },
    ]),
  ) as SPRSScore['byFamily'];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate the SPRS score from a set of assessment responses.
 *
 * Algorithm (per DoD Assessment Methodology v1.2.1):
 *   1. Start at 110.
 *   2. For each practice requirement in NIST SP 800-171 Rev 2:
 *        - If MET:          deduct 0
 *        - If PARTIAL:      deduct ceil(|sprsDeduction| / 2) — half penalty, rounded DOWN
 *        - If UNMET:        deduct full |sprsDeduction|
 *        - If NOT_ASSESSED: treat as UNMET
 *   3. The resulting sum is the SPRS score (range -203 to +110).
 *
 * Edge cases handled:
 *   - Empty controls array → returns score of 110 (nothing to assess).
 *   - Empty responses → all controls treated as NOT_ASSESSED → minimum possible score.
 *   - Duplicate responses → most recent answeredAt wins.
 *   - Malformed response objects → skipped, corresponding control treated as NOT_ASSESSED.
 *   - Non-finite sprsDeduction → treated as 0 (no deduction) with a console warning.
 *
 * @param controls  - Full list of NISTControl objects for the assessment scope.
 * @param responses - Assessment responses provided by the organisation.
 * @returns         A fully populated SPRSScore object.
 */
export function calculateSPRS(
  controls: NISTControl[],
  responses: AssessmentResponse[],
): SPRSScore {
  if (!Array.isArray(controls) || controls.length === 0) {
    return {
      total: SPRS_BASE,
      byFamily: buildEmptyFamilyBreakdown(),
      metCount: 0,
      partialCount: 0,
      unmetCount: 0,
      assessedCount: 0,
      completionPercent: 100, // vacuously complete — nothing to assess
    };
  }

  const responseMap = buildResponseMap(Array.isArray(responses) ? responses : []);
  const byFamily = buildEmptyFamilyBreakdown();

  let totalDeduction = 0;
  let metCount = 0;
  let partialCount = 0;
  let unmetCount = 0;
  let assessedCount = 0;

  for (const control of controls) {
    if (!control?.id || !control?.family) continue;

    const status = resolveStatus(control.id, responseMap);
    const deduction = computeDeduction(control, status);

    // Accumulate global counters
    totalDeduction += deduction;

    if (status !== 'NOT_ASSESSED') assessedCount++;

    switch (status) {
      case 'MET':
        metCount++;
        break;
      case 'PARTIAL':
        partialCount++;
        break;
      case 'UNMET':
        unmetCount++;
        break;
      case 'NOT_ASSESSED':
        // Counted as unmet for scoring; not added to assessedCount
        unmetCount++;
        break;
    }

    // Accumulate per-family breakdown
    const family = control.family as ControlFamily;
    if (byFamily[family]) {
      const fb = byFamily[family];
      // score tracks the sum of deductions applied for this family (negative or zero)
      fb.score += deduction;

      if (status === 'MET') {
        fb.met++;
      } else if (status === 'PARTIAL') {
        fb.partial++;
      } else {
        // UNMET or NOT_ASSESSED both count as unmet in the family breakdown
        fb.unmet++;
      }
    }
  }

  const total = SPRS_BASE + totalDeduction; // totalDeduction is ≤ 0
  const completionPercent = getCompletionPercent(controls.length, responses);

  return {
    total,
    byFamily,
    metCount,
    partialCount,
    unmetCount,
    assessedCount,
    completionPercent,
  };
}

/**
 * Return a CSS-compatible colour string representing the risk band for a given
 * SPRS score.
 *
 * Bands:
 *   score === 110           →  '#16a34a'  (green-600)      "Perfect"
 *   70 ≤ score ≤ 109        →  '#65a30d'  (lime-600)       "Good"
 *   0 ≤ score ≤ 69          →  '#ca8a04'  (yellow-600)     "Fair"
 *   -50 ≤ score ≤ -1        →  '#ea580c'  (orange-600)     "Poor"
 *   score < -50             →  '#dc2626'  (red-600)        "Critical"
 *
 * The function accepts any finite number; non-finite input returns the critical colour.
 */
export function getScoreColor(score: number): string {
  if (!Number.isFinite(score)) return '#dc2626';

  if (score >= 110) return '#16a34a'; // perfect / above (clamp top)
  if (score >= 70) return '#65a30d';  // good
  if (score >= 0) return '#ca8a04';   // fair
  if (score >= -50) return '#ea580c'; // poor
  return '#dc2626';                   // critical
}

/**
 * Return a human-readable label for a SPRS score band.
 *
 * Labels are intentionally brief so they can be used in badges, chart tooltips,
 * and status pills without truncation.
 */
export function getScoreLabel(score: number): string {
  if (!Number.isFinite(score)) return 'Unknown';

  if (score >= 110) return 'Perfect';
  if (score >= 70) return 'Good';
  if (score >= 0) return 'Fair';
  if (score >= -50) return 'Poor';
  return 'Critical';
}

/**
 * Calculate a per-family SPRS breakdown without computing the global score.
 *
 * This function is intentionally a thin wrapper around calculateSPRS so the
 * breakdown logic is never duplicated and can never diverge.
 *
 * The `score` field in each family bucket represents the sum of deductions
 * applied for that family (always ≤ 0). Consumers who need "points retained"
 * can look up maxDeduction from CONTROL_FAMILIES and add the score to it.
 */
export function calculateFamilyBreakdown(
  controls: NISTControl[],
  responses: AssessmentResponse[],
): SPRSScore['byFamily'] {
  return calculateSPRS(controls, responses).byFamily;
}

/**
 * Return a priority-sorted list of controls that still need remediation.
 *
 * Sort order:
 *   1. UNMET controls, sorted by |sprsDeduction| descending (biggest impact first).
 *   2. PARTIAL controls, sorted by |sprsDeduction| descending (biggest remaining
 *      impact first — partial still carries a deduction).
 *   3. NOT_ASSESSED controls are included in the UNMET bucket.
 *
 * MET controls are excluded from the result.
 *
 * Each returned element is the original NISTControl augmented with:
 *   - status:           resolved ControlStatus
 *   - deductionApplied: the deduction currently being incurred (negative or zero)
 */
export function getRemediationPriorities(
  controls: NISTControl[],
  responses: AssessmentResponse[],
): Array<NISTControl & { status: ControlStatus; deductionApplied: number }> {
  if (!Array.isArray(controls) || controls.length === 0) return [];

  const responseMap = buildResponseMap(Array.isArray(responses) ? responses : []);

  type Augmented = NISTControl & { status: ControlStatus; deductionApplied: number };

  const unmet: Augmented[] = [];
  const partial: Augmented[] = [];

  for (const control of controls) {
    if (!control?.id) continue;

    const status = resolveStatus(control.id, responseMap);

    if (status === 'MET') continue;

    const deductionApplied = computeDeduction(control, status);

    const augmented: Augmented = { ...control, status, deductionApplied };

    if (status === 'PARTIAL') {
      partial.push(augmented);
    } else {
      // UNMET and NOT_ASSESSED both go into the primary remediation list
      unmet.push(augmented);
    }
  }

  // Sort each bucket by absolute deduction descending (most impactful first)
  const byDeductionDesc = (a: Augmented, b: Augmented): number =>
    Math.abs(b.deductionApplied) - Math.abs(a.deductionApplied);

  unmet.sort(byDeductionDesc);
  partial.sort(byDeductionDesc);

  return [...unmet, ...partial];
}

/**
 * Estimate the time and effort required to reach a target SPRS score from the
 * current assessed state.
 *
 * Strategy:
 *   1. Compute the current SPRS score.
 *   2. If already at or above target, return zero work required.
 *   3. Greedily pick remediations in priority order (highest deduction first)
 *      until the projected score meets or exceeds the target.
 *   4. "Quick wins" are controls with estimatedHours ≤ 8 within the selected set.
 *
 * The estimate is optimistic — it assumes every selected control is fully
 * remediated to MET (not partial). Real-world timelines will vary.
 *
 * @param controls    - Full control set in scope.
 * @param responses   - Current assessment responses.
 * @param targetScore - Desired SPRS score (clamped to range [-203, 110]).
 * @returns An object containing:
 *            totalHours    — sum of estimatedHours for controls that need fixing
 *            controlsToFix — count of controls that need to be addressed
 *            quickWins     — controls with estimatedHours ≤ 8 within the fix set
 */
export function estimateTimeToTarget(
  controls: NISTControl[],
  responses: AssessmentResponse[],
  targetScore: number,
): { totalHours: number; controlsToFix: number; quickWins: NISTControl[] } {
  // Clamp target to valid SPRS range
  const clampedTarget = Math.max(-203, Math.min(110, targetScore));

  const current = calculateSPRS(controls, responses);

  if (current.total >= clampedTarget) {
    return { totalHours: 0, controlsToFix: 0, quickWins: [] };
  }

  const priorities = getRemediationPriorities(controls, responses);

  let projectedScore = current.total;
  let totalHours = 0;
  let controlsToFix = 0;
  const quickWins: NISTControl[] = [];

  for (const control of priorities) {
    if (projectedScore >= clampedTarget) break;

    // The gain from fully fixing this control = removing the current deduction
    // and applying 0 (MET). deductionApplied is ≤ 0, so negating it gives gain.
    const gain = -control.deductionApplied;

    projectedScore += gain;
    totalHours += Number.isFinite(control.estimatedHours) ? control.estimatedHours : 0;
    controlsToFix++;

    if (control.estimatedHours <= 8) {
      // Exclude the augmented fields before pushing into quickWins
      const { status: _s, deductionApplied: _d, ...baseControl } = control;
      quickWins.push(baseControl as NISTControl);
    }
  }

  return { totalHours, controlsToFix, quickWins };
}

/**
 * Calculate what percentage of controls in the assessment scope have been
 * responded to (any status other than NOT_ASSESSED counts as assessed).
 *
 * @param totalControls - Total number of controls in scope.
 * @param responses     - Assessment responses provided so far.
 * @returns A number in [0, 100], rounded to one decimal place.
 *          Returns 0 if totalControls is 0 or falsy.
 *          Returns 100 if totalControls is 0 (vacuously complete — caller's choice).
 */
export function getCompletionPercent(
  totalControls: number,
  responses: AssessmentResponse[],
): number {
  if (!Number.isFinite(totalControls) || totalControls <= 0) return 0;

  const validResponses = Array.isArray(responses) ? responses : [];

  // Count unique controlIds that have a concrete (non-NOT_ASSESSED) response.
  // NOT_ASSESSED is the default for missing entries, so only explicit responses count.
  const answeredIds = new Set<string>();
  for (const r of validResponses) {
    if (r?.controlId && r.status && r.status !== 'NOT_ASSESSED') {
      answeredIds.add(r.controlId);
    }
  }

  const percent = (answeredIds.size / totalControls) * 100;

  // Clamp to [0, 100] and round to one decimal place
  return Math.round(Math.min(100, Math.max(0, percent)) * 10) / 10;
}

// ---------------------------------------------------------------------------
// Re-exported constants (useful to consumers without importing families.ts)
// ---------------------------------------------------------------------------

/** SPRS baseline score (110). Exported so UI can display it without magic numbers. */
export { SPRS_BASE };

/**
 * Theoretical minimum SPRS score per DoD Assessment Methodology v1.2.1 (all 110 controls UNMET).
 *
 * NOTE: The family-level `maxDeduction` values in families.ts currently sum to 294
 * (yielding a floor of -184), not 313 (which would yield -203). This reflects the
 * control data set being actively populated. The authoritative floor is -203 and is
 * preserved here as the published DoD value. The actual computed minimum from
 * calculateSPRS() will reflect whichever controls are present in the data layer.
 */
export const SPRS_MIN = -203;

/** Maximum possible SPRS score. */
export const SPRS_MAX = 110;
