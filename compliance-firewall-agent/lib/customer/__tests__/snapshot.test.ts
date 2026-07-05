/**
 * Tests for lib/customer/snapshot — snapshot projection, dedup, and trend.
 */

import { describe, it, expect } from 'vitest';
import { toSnapshotRow, shouldInsertSnapshot, computeTrend, type StatusSnapshotRow } from '@/lib/customer/snapshot';
import { buildCustomerStatus } from '@/lib/customer/status';

function statusWithScore(score: number | null, stage: 'remediating' | 'monitoring' = 'remediating') {
  if (score === null) {
    return buildCustomerStatus({ sprs: null, account: { tier: 'free', latestOrder: null } });
  }
  return buildCustomerStatus({
    sprs: {
      score,
      completionPercent: 100,
      totalControls: 110,
      metCount: stage === 'monitoring' ? 110 : 100,
      partialCount: 0,
      unmetCount: stage === 'monitoring' ? 0 : 10,
      assessedCount: 110,
      topGaps: [],
    },
    account: { tier: 'pro', latestOrder: null },
  });
}

describe('toSnapshotRow', () => {
  it('projects only the non-CUI posture columns', () => {
    const row = toSnapshotRow(statusWithScore(72), 'u1');
    expect(row.user_id).toBe('u1');
    expect(row.sprs_score).toBe(72);
    expect(row.completion_percent).toBe(100);
    expect(row.stage).toBe('remediating');
    expect(typeof row.next_step_title).toBe('string');
    // Exactly the persisted columns — no gap details or `needed` array leak in.
    expect(Object.keys(row).sort()).toEqual([
      'completion_percent',
      'gap_count',
      'next_step_href',
      'next_step_title',
      'sprs_score',
      'stage',
      'user_id',
    ]);
  });
});

describe('shouldInsertSnapshot', () => {
  const base = statusWithScore(72);
  const now = Date.parse('2026-07-05T12:00:00Z');

  it('inserts when there is no prior snapshot', () => {
    expect(shouldInsertSnapshot(base, null, now)).toBe(true);
  });

  it('inserts when the SPRS score changed', () => {
    const latest: StatusSnapshotRow = {
      user_id: 'u1', sprs_score: 60, completion_percent: 100, stage: 'remediating',
      gap_count: 12, next_step_title: 'x', next_step_href: '/x', captured_at: '2026-07-05T11:59:00Z',
    };
    expect(shouldInsertSnapshot(base, latest, now)).toBe(true);
  });

  it('inserts when the stage changed', () => {
    const latest: StatusSnapshotRow = {
      user_id: 'u1', sprs_score: 72, completion_percent: 100, stage: 'assessing',
      gap_count: 12, next_step_title: 'x', next_step_href: '/x', captured_at: '2026-07-05T11:59:00Z',
    };
    expect(shouldInsertSnapshot(base, latest, now)).toBe(true);
  });

  it('does NOT insert an unchanged snapshot within the min gap', () => {
    const latest: StatusSnapshotRow = {
      user_id: 'u1', sprs_score: 72, completion_percent: 100, stage: 'remediating',
      gap_count: 10, next_step_title: 'x', next_step_href: '/x', captured_at: '2026-07-05T11:00:00Z',
    };
    expect(shouldInsertSnapshot(base, latest, now)).toBe(false);
  });

  it('inserts an unchanged snapshot once the min gap elapses', () => {
    const latest: StatusSnapshotRow = {
      user_id: 'u1', sprs_score: 72, completion_percent: 100, stage: 'remediating',
      gap_count: 10, next_step_title: 'x', next_step_href: '/x', captured_at: '2026-07-04T00:00:00Z',
    };
    expect(shouldInsertSnapshot(base, latest, now)).toBe(true);
  });
});

describe('computeTrend', () => {
  const prev: StatusSnapshotRow = {
    user_id: 'u1', sprs_score: 54, completion_percent: 100, stage: 'remediating',
    gap_count: 20, next_step_title: 'x', next_step_href: '/x', captured_at: '2026-07-01T00:00:00Z',
  };

  it('is up when the score improved', () => {
    const t = computeTrend(statusWithScore(72), prev);
    expect(t.direction).toBe('up');
    expect(t.sprsDelta).toBe(18);
    expect(t.since).toBe('2026-07-01T00:00:00Z');
  });

  it('is down when the score dropped', () => {
    const t = computeTrend(statusWithScore(40), prev);
    expect(t.direction).toBe('down');
    expect(t.sprsDelta).toBe(-14);
  });

  it('is flat when unchanged', () => {
    const t = computeTrend(statusWithScore(54), prev);
    expect(t.direction).toBe('flat');
    expect(t.sprsDelta).toBe(0);
  });

  it('is none when there is no previous or no score', () => {
    expect(computeTrend(statusWithScore(72), null).direction).toBe('none');
    expect(computeTrend(statusWithScore(null), prev).direction).toBe('none');
  });
});
