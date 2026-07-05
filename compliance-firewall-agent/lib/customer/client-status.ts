"use client";

/**
 * Client-side customer status: computes the SPRS/readiness slice from the
 * browser's local assessment data (localStorage) and merges it with the
 * account slice into a full CustomerStatus.
 *
 * Deliberately client-only: assessment responses never leave the device. The
 * dashboard panel renders this directly; GlobalChat passes it to Brain AI ONLY
 * after the user has granted consent, and only ever the user's own data.
 */

import { ALL_CONTROLS } from '@/lib/shieldready/controls';
import {
  calculateSPRS,
  getCompletionPercent,
  getRemediationPriorities,
} from '@/lib/shieldready/scoring';
import { getAssessmentResponses } from '@/lib/shieldready/storage';
import {
  buildCustomerStatus,
  type AccountInput,
  type CustomerStatus,
  type SprsInput,
  type StatusGap,
} from '@/lib/customer/status';

/** Compute the SPRS input from locally-stored assessment responses, or null. */
export function computeSprsInput(): SprsInput | null {
  const responses = getAssessmentResponses();
  if (!Array.isArray(responses) || responses.length === 0) return null;

  const score = calculateSPRS(ALL_CONTROLS, responses);
  const completionPercent = getCompletionPercent(ALL_CONTROLS.length, responses);
  const priorities = getRemediationPriorities(ALL_CONTROLS, responses);

  const topGaps: StatusGap[] = priorities.slice(0, 5).map((p) => ({
    controlId: p.id,
    title: p.title,
    status: p.status,
    deduction: p.deductionApplied,
    fix: p.remediationSteps?.[0] ?? 'See the remediation steps for this control.',
    hours: Number.isFinite(p.estimatedHours) ? p.estimatedHours : 0,
  }));

  return {
    score: score.total,
    completionPercent,
    totalControls: ALL_CONTROLS.length,
    metCount: score.metCount,
    partialCount: score.partialCount,
    unmetCount: score.unmetCount,
    assessedCount: score.assessedCount,
    topGaps,
  };
}

/** Build the full client-side CustomerStatus (local SPRS + provided account). */
export function buildLocalCustomerStatus(account: AccountInput): CustomerStatus {
  return buildCustomerStatus({ sprs: computeSprsInput(), account });
}
