/**
 * Tests for lib/customer/status — the deterministic "where you stand / what's
 * next / how to fix" engine. Pure functions, zero mocks. Exercises every stage
 * branch plus the Brain AI answer formatter.
 */

import { describe, it, expect } from 'vitest';
import {
  buildCustomerStatus,
  buildStatusAnswer,
  standingLevelForScore,
  type SprsInput,
  type StatusGap,
  type OrderSummary,
} from '@/lib/customer/status';

function gaps(n: number): StatusGap[] {
  return Array.from({ length: n }, (_, i) => ({
    controlId: `AC.1.00${i + 1}`,
    title: `Control ${i + 1}`,
    status: 'UNMET',
    deduction: -(5 - i),
    fix: `Do the fix for control ${i + 1}`,
    hours: 4 + i,
  }));
}

function sprs(overrides: Partial<SprsInput> = {}): SprsInput {
  return {
    score: 88,
    completionPercent: 100,
    totalControls: 110,
    metCount: 110,
    partialCount: 0,
    unmetCount: 0,
    assessedCount: 110,
    topGaps: [],
    ...overrides,
  };
}

const paidOrder: OrderSummary = {
  reference: 'HS-A1B2C3D4',
  status: 'paid',
  statusLabel: 'Payment received — deployment pending',
  reportDueDate: '2026-07-18T00:00:00.000Z',
  isDelivered: false,
};

const deliveredOrder: OrderSummary = {
  reference: 'HS-A1B2C3D4',
  status: 'report_delivered',
  statusLabel: 'Report delivered',
  reportDueDate: '2026-07-18T00:00:00.000Z',
  isDelivered: true,
};

describe('standingLevelForScore', () => {
  it('bands the SPRS score', () => {
    expect(standingLevelForScore(100)).toBe('excellent');
    expect(standingLevelForScore(88)).toBe('excellent');
    expect(standingLevelForScore(75)).toBe('good');
    expect(standingLevelForScore(10)).toBe('fair');
    expect(standingLevelForScore(-20)).toBe('poor');
    expect(standingLevelForScore(-120)).toBe('critical');
    expect(standingLevelForScore(NaN)).toBe('unknown');
  });
});

describe('buildCustomerStatus — stage precedence', () => {
  it('stage 1: no SPRS at all → not_started', () => {
    const s = buildCustomerStatus({ sprs: null, account: { tier: 'free', latestOrder: null } });
    expect(s.stage).toBe('not_started');
    expect(s.hasAssessment).toBe(false);
    expect(s.nextStep.action?.href).toContain('assessment');
    expect(s.sprsScore).toBeNull();
    expect(s.needed.some((n) => /self-assessment/i.test(n))).toBe(true);
  });

  it('stage 1: SPRS present but nothing assessed → not_started', () => {
    const s = buildCustomerStatus({
      sprs: sprs({ assessedCount: 0, completionPercent: 0, metCount: 0, unmetCount: 110, score: -100 }),
      account: { tier: 'free', latestOrder: null },
    });
    expect(s.stage).toBe('not_started');
  });

  it('stage 2: partially assessed → assessing, with remaining count', () => {
    const s = buildCustomerStatus({
      sprs: sprs({ completionPercent: 40, assessedCount: 44, metCount: 44, unmetCount: 66, score: 20 }),
      account: { tier: 'free', latestOrder: null },
    });
    expect(s.stage).toBe('assessing');
    expect(s.nextStep.title).toMatch(/finish/i);
    // 110 - round(0.4*110)=66 remaining
    expect(s.needed.some((n) => n.includes('66'))).toBe(true);
  });

  it('stage 3: assessment complete + paid report undelivered → report_pending', () => {
    const s = buildCustomerStatus({
      sprs: sprs({ unmetCount: 2, partialCount: 1, metCount: 107, score: 80 }),
      account: { tier: 'pro', latestOrder: paidOrder },
    });
    expect(s.stage).toBe('report_pending');
    expect(s.nextStep.title).toMatch(/deploy the proxy/i);
    expect(s.needed.some((n) => /remediate/i.test(n))).toBe(true);
  });

  it('stage 4: complete, no order, open gaps → remediating with highest-impact fix', () => {
    const g = gaps(3);
    const s = buildCustomerStatus({
      sprs: sprs({ unmetCount: 3, metCount: 107, score: 70, topGaps: g }),
      account: { tier: 'free', latestOrder: null },
    });
    expect(s.stage).toBe('remediating');
    expect(s.nextStep.title).toContain(g[0].controlId);
    expect(s.nextStep.detail).toContain('5 SPRS points'); // |-5|
    expect(s.gapCount).toBe(3);
  });

  it('stage 5a: complete, all met, delivered order → report_delivered', () => {
    const s = buildCustomerStatus({
      sprs: sprs({ score: 110, metCount: 110 }),
      account: { tier: 'pro', latestOrder: deliveredOrder },
    });
    expect(s.stage).toBe('report_delivered');
    expect(s.nextStep.title).toMatch(/current/i);
  });

  it('stage 5b: complete, all met, no order → monitoring', () => {
    const s = buildCustomerStatus({
      sprs: sprs({ score: 110, metCount: 110 }),
      account: { tier: 'free', latestOrder: null },
    });
    expect(s.stage).toBe('monitoring');
    expect(s.nextStep.action?.href).toContain('pricing');
  });

  it('caps topGaps at 5', () => {
    const s = buildCustomerStatus({
      sprs: sprs({ unmetCount: 8, metCount: 102, score: 40, topGaps: gaps(8) }),
      account: { tier: 'free', latestOrder: null },
    });
    expect(s.topGaps).toHaveLength(5);
  });

  it('singularizes gap wording for exactly one gap', () => {
    const s = buildCustomerStatus({
      sprs: sprs({ unmetCount: 1, metCount: 109, score: 105, topGaps: gaps(1) }),
      account: { tier: 'free', latestOrder: null },
    });
    expect(s.standing).toMatch(/1 open control gap\b/);
    expect(s.standing).not.toMatch(/gaps/);
  });
});

describe('buildStatusAnswer', () => {
  it('renders a clean-prose, bulleted answer with no markdown emphasis', () => {
    const status = buildCustomerStatus({
      sprs: sprs({ unmetCount: 3, metCount: 107, score: 70, topGaps: gaps(3) }),
      account: { tier: 'pro', latestOrder: paidOrder },
    });
    const answer = buildStatusAnswer(status);
    expect(answer).toContain('where you stand');
    expect(answer).toContain('SPRS score: 70');
    expect(answer).toContain('Your next step:');
    expect(answer).toContain(paidOrder.reference);
    // clean prose contract: bullets are •, no ** or leading "- "
    expect(answer).not.toContain('**');
    expect(answer).not.toMatch(/^- /m);
    expect(answer).toContain('•');
  });

  it('omits SPRS lines when there is no assessment', () => {
    const status = buildCustomerStatus({ sprs: null, account: { tier: 'free', latestOrder: null } });
    const answer = buildStatusAnswer(status);
    expect(answer).not.toContain('SPRS score:');
    expect(answer).toContain('Your next step:');
  });
});
