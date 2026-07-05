/**
 * Status-snapshot helpers: turn a CustomerStatus into a storable, non-CUI row,
 * decide when a new snapshot is worth writing (dedup), and compute the trend
 * versus the previous snapshot ("SPRS +18 since Jul 1").
 *
 * Pure functions — no DB, no side effects — so the trend/dedup logic is fully
 * unit-tested. Storage happens in the snapshot API; the browser computes SPRS.
 */

import type { CustomerStatus } from '@/lib/customer/status';

/** A persisted snapshot row (mirrors migration 023's columns). */
export interface StatusSnapshotRow {
  user_id: string;
  sprs_score: number | null;
  completion_percent: number | null;
  stage: string;
  gap_count: number | null;
  next_step_title: string | null;
  next_step_href: string | null;
  captured_at?: string;
}

export type TrendDirection = 'up' | 'down' | 'flat' | 'none';

export interface StatusTrend {
  direction: TrendDirection;
  sprsDelta: number | null; // signed change vs previous, null if not comparable
  since: string | null; // ISO timestamp of the previous snapshot
}

/**
 * Project a CustomerStatus into the non-CUI columns we persist. Deliberately
 * drops the detailed gap list and the `needed` array — only the score, stage,
 * gap count, and the single next-step title/link are stored.
 */
export function toSnapshotRow(status: CustomerStatus, userId: string): StatusSnapshotRow {
  return {
    user_id: userId,
    sprs_score: status.sprsScore,
    completion_percent: status.completionPercent,
    stage: status.stage,
    gap_count: status.gapCount,
    next_step_title: status.nextStep?.title ?? null,
    next_step_href: status.nextStep?.action?.href ?? null,
  };
}

/**
 * Whether a new snapshot is worth writing. Avoids row spam on every dashboard
 * load: write when there's no prior snapshot, when the posture actually changed
 * (SPRS score or stage), or when the latest is older than `minGapMs`.
 */
export function shouldInsertSnapshot(
  status: CustomerStatus,
  latest: StatusSnapshotRow | null,
  nowMs: number,
  minGapMs: number = 12 * 60 * 60 * 1000, // 12h
): boolean {
  if (!latest) return true;
  if ((latest.sprs_score ?? null) !== (status.sprsScore ?? null)) return true;
  if (latest.stage !== status.stage) return true;
  const capturedMs = latest.captured_at ? new Date(latest.captured_at).getTime() : NaN;
  if (Number.isNaN(capturedMs)) return true;
  return nowMs - capturedMs >= minGapMs;
}

/**
 * Compute the trend of the current status versus the previous snapshot. Both
 * scores must be present and different to yield an up/down direction; equal
 * scores are 'flat'; a missing comparison is 'none'.
 */
export function computeTrend(
  status: CustomerStatus,
  previous: StatusSnapshotRow | null,
): StatusTrend {
  if (!previous || status.sprsScore === null || previous.sprs_score === null) {
    return { direction: 'none', sprsDelta: null, since: previous?.captured_at ?? null };
  }
  const delta = status.sprsScore - previous.sprs_score;
  const direction: TrendDirection = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
  return { direction, sprsDelta: delta, since: previous.captured_at ?? null };
}
