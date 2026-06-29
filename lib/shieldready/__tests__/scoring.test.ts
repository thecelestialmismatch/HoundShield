import {
  calculateSPRS,
  getScoreColor,
  getScoreLabel,
  getRemediationPriorities,
  estimateTimeToTarget,
  getCompletionPercent,
  SPRS_BASE,
  SPRS_MIN,
  SPRS_MAX,
} from '../scoring';
import type { NISTControl, AssessmentResponse, ControlFamily, ControlStatus } from '../types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function ctrl(
  id: string,
  family: ControlFamily,
  deduction: number,
  hours = 4,
): NISTControl {
  return {
    id,
    family,
    familyName: family,
    title: `Test ${id}`,
    officialDescription: '',
    plainEnglish: '',
    sprsDeduction: deduction,
    cmmcLevel: 2,
    assessmentQuestion: '',
    remediationSteps: [],
    affordableTools: [],
    evidenceRequired: [],
    policyMapping: [],
    estimatedHours: hours,
    riskPriority: 'HIGH',
  };
}

function resp(
  controlId: string,
  status: ControlStatus,
  answeredAt = '2024-01-01T00:00:00Z',
): AssessmentResponse {
  return { controlId, status, notes: '', evidenceUploaded: false, answeredAt };
}

// ─── calculateSPRS ────────────────────────────────────────────────────────────

describe('calculateSPRS', () => {
  it('empty controls → score 110, all counts zero', () => {
    const result = calculateSPRS([], []);
    expect(result.total).toBe(110);
    expect(result.metCount).toBe(0);
    expect(result.partialCount).toBe(0);
    expect(result.unmetCount).toBe(0);
    expect(result.assessedCount).toBe(0);
  });

  it('single MET control → no deduction', () => {
    const controls = [ctrl('AC.1', 'AC', -5)];
    const responses = [resp('AC.1', 'MET')];
    const result = calculateSPRS(controls, responses);
    expect(result.total).toBe(110);
    expect(result.metCount).toBe(1);
    expect(result.unmetCount).toBe(0);
  });

  it('single UNMET control → full deduction', () => {
    const controls = [ctrl('AC.1', 'AC', -5)];
    const responses = [resp('AC.1', 'UNMET')];
    const result = calculateSPRS(controls, responses);
    expect(result.total).toBe(105);
    expect(result.unmetCount).toBe(1);
  });

  it('PARTIAL deduction = ceil(deduction/2) — smaller magnitude', () => {
    // ceil(-5/2) = ceil(-2.5) = -2
    const controls = [ctrl('AC.1', 'AC', -5)];
    const responses = [resp('AC.1', 'PARTIAL')];
    const result = calculateSPRS(controls, responses);
    expect(result.total).toBe(108); // 110 - 2
    expect(result.partialCount).toBe(1);
  });

  it('PARTIAL deduction rounds toward zero for odd deduction', () => {
    // ceil(-3/2) = ceil(-1.5) = -1
    const controls = [ctrl('AC.1', 'AC', -3)];
    const responses = [resp('AC.1', 'PARTIAL')];
    const result = calculateSPRS(controls, responses);
    expect(result.total).toBe(109); // 110 - 1
  });

  it('NOT_ASSESSED treated as UNMET', () => {
    const controls = [ctrl('AC.1', 'AC', -5)];
    const result = calculateSPRS(controls, []);
    expect(result.total).toBe(105);
    expect(result.unmetCount).toBe(1);
    expect(result.assessedCount).toBe(0);
  });

  it('mixed statuses — correct score and counts', () => {
    // MET(-3):0, UNMET(-5):-5, PARTIAL(-4):ceil(-4/2)=-2 → 110-0-5-2=103
    const controls = [
      ctrl('AC.1', 'AC', -3),
      ctrl('AU.1', 'AU', -5),
      ctrl('CM.1', 'CM', -4),
    ];
    const responses = [
      resp('AC.1', 'MET'),
      resp('AU.1', 'UNMET'),
      resp('CM.1', 'PARTIAL'),
    ];
    const result = calculateSPRS(controls, responses);
    expect(result.total).toBe(103);
    expect(result.metCount).toBe(1);
    expect(result.unmetCount).toBe(1);
    expect(result.partialCount).toBe(1);
    expect(result.assessedCount).toBe(3);
  });

  it('duplicate responses — latest answeredAt wins', () => {
    const controls = [ctrl('AC.1', 'AC', -5)];
    const responses = [
      resp('AC.1', 'UNMET', '2024-01-01T00:00:00Z'),
      resp('AC.1', 'MET', '2024-06-01T00:00:00Z'),
    ];
    const result = calculateSPRS(controls, responses);
    expect(result.total).toBe(110); // MET wins (newer)
    expect(result.metCount).toBe(1);
  });

  it('duplicate responses — earlier date does not override later', () => {
    const controls = [ctrl('AC.1', 'AC', -5)];
    const responses = [
      resp('AC.1', 'MET', '2024-06-01T00:00:00Z'),
      resp('AC.1', 'UNMET', '2024-01-01T00:00:00Z'),
    ];
    const result = calculateSPRS(controls, responses);
    expect(result.total).toBe(110); // MET still wins (later answeredAt)
  });

  it('malformed response without controlId is skipped', () => {
    const controls = [ctrl('AC.1', 'AC', -5)];
    const malformed = { status: 'MET', notes: '', evidenceUploaded: false, answeredAt: '2024-01-01T00:00:00Z' } as unknown as AssessmentResponse;
    const result = calculateSPRS(controls, [malformed]);
    // AC.1 treated as NOT_ASSESSED (UNMET)
    expect(result.total).toBe(105);
  });

  it('non-array responses fallback gracefully', () => {
    const controls = [ctrl('AC.1', 'AC', -5)];
    const result = calculateSPRS(controls, null as unknown as AssessmentResponse[]);
    expect(result.total).toBe(105); // all NOT_ASSESSED
  });

  it('byFamily breakdown sums correctly', () => {
    const controls = [
      ctrl('AC.1', 'AC', -5),
      ctrl('AC.2', 'AC', -3),
    ];
    const responses = [
      resp('AC.1', 'MET'),
      resp('AC.2', 'UNMET'),
    ];
    const result = calculateSPRS(controls, responses);
    expect(result.byFamily.AC.met).toBe(1);
    expect(result.byFamily.AC.unmet).toBe(1);
    expect(result.byFamily.AC.score).toBe(-3); // only AC.2 deducted
  });

  it('completionPercent is 0 when no responses', () => {
    const controls = [ctrl('AC.1', 'AC', -5)];
    const result = calculateSPRS(controls, []);
    expect(result.completionPercent).toBe(0);
  });

  it('completionPercent is 100 when all responded', () => {
    const controls = [ctrl('AC.1', 'AC', -5)];
    const responses = [resp('AC.1', 'MET')];
    const result = calculateSPRS(controls, responses);
    expect(result.completionPercent).toBe(100);
  });

  it('exports SPRS_BASE, SPRS_MIN, SPRS_MAX constants', () => {
    expect(SPRS_BASE).toBe(110);
    expect(SPRS_MIN).toBe(-203);
    expect(SPRS_MAX).toBe(110);
  });
});

// ─── getScoreColor ────────────────────────────────────────────────────────────

describe('getScoreColor', () => {
  it('110 → green (perfect)', () => expect(getScoreColor(110)).toBe('#16a34a'));
  it('111 → green (clamped at top)', () => expect(getScoreColor(111)).toBe('#16a34a'));
  it('70 → lime (good)', () => expect(getScoreColor(70)).toBe('#65a30d'));
  it('69 → yellow (fair)', () => expect(getScoreColor(69)).toBe('#ca8a04'));
  it('0 → yellow (fair floor)', () => expect(getScoreColor(0)).toBe('#ca8a04'));
  it('-1 → orange (poor)', () => expect(getScoreColor(-1)).toBe('#ea580c'));
  it('-50 → orange (poor floor)', () => expect(getScoreColor(-50)).toBe('#ea580c'));
  it('-51 → red (critical)', () => expect(getScoreColor(-51)).toBe('#dc2626'));
  it('-203 → red (minimum)', () => expect(getScoreColor(-203)).toBe('#dc2626'));
  it('NaN → red (guard)', () => expect(getScoreColor(NaN)).toBe('#dc2626'));
  it('Infinity → red (guard)', () => expect(getScoreColor(Infinity)).toBe('#dc2626'));
});

// ─── getScoreLabel ────────────────────────────────────────────────────────────

describe('getScoreLabel', () => {
  it('110 → Perfect', () => expect(getScoreLabel(110)).toBe('Perfect'));
  it('70 → Good', () => expect(getScoreLabel(70)).toBe('Good'));
  it('69 → Fair', () => expect(getScoreLabel(69)).toBe('Fair'));
  it('0 → Fair', () => expect(getScoreLabel(0)).toBe('Fair'));
  it('-1 → Poor', () => expect(getScoreLabel(-1)).toBe('Poor'));
  it('-50 → Poor', () => expect(getScoreLabel(-50)).toBe('Poor'));
  it('-51 → Critical', () => expect(getScoreLabel(-51)).toBe('Critical'));
  it('NaN → Unknown', () => expect(getScoreLabel(NaN)).toBe('Unknown'));
});

// ─── getRemediationPriorities ─────────────────────────────────────────────────

describe('getRemediationPriorities', () => {
  it('empty controls → []', () => {
    expect(getRemediationPriorities([], [])).toEqual([]);
  });

  it('all MET → []', () => {
    const controls = [ctrl('AC.1', 'AC', -5), ctrl('AU.1', 'AU', -3)];
    const responses = [resp('AC.1', 'MET'), resp('AU.1', 'MET')];
    expect(getRemediationPriorities(controls, responses)).toEqual([]);
  });

  it('MET excluded, UNMET included', () => {
    const controls = [ctrl('AC.1', 'AC', -5), ctrl('AU.1', 'AU', -3)];
    const responses = [resp('AC.1', 'MET'), resp('AU.1', 'UNMET')];
    const result = getRemediationPriorities(controls, responses);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('AU.1');
    expect(result[0].status).toBe('UNMET');
  });

  it('UNMET before PARTIAL in sorted output', () => {
    const controls = [ctrl('AC.1', 'AC', -5), ctrl('AU.1', 'AU', -5)];
    const responses = [resp('AC.1', 'PARTIAL'), resp('AU.1', 'UNMET')];
    const result = getRemediationPriorities(controls, responses);
    expect(result[0].id).toBe('AU.1'); // UNMET first
    expect(result[1].id).toBe('AC.1'); // PARTIAL second
  });

  it('within UNMET bucket, sorted by |deductionApplied| descending', () => {
    const controls = [
      ctrl('AC.1', 'AC', -1),
      ctrl('AC.2', 'AC', -5),
      ctrl('AC.3', 'AC', -3),
    ];
    const responses = [
      resp('AC.1', 'UNMET'),
      resp('AC.2', 'UNMET'),
      resp('AC.3', 'UNMET'),
    ];
    const result = getRemediationPriorities(controls, responses);
    expect(result.map((r) => r.id)).toEqual(['AC.2', 'AC.3', 'AC.1']);
  });

  it('NOT_ASSESSED placed in UNMET bucket', () => {
    const controls = [ctrl('AC.1', 'AC', -5)];
    const result = getRemediationPriorities(controls, []);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('NOT_ASSESSED');
    expect(result[0].deductionApplied).toBe(-5);
  });

  it('deductionApplied for PARTIAL is ceil(deduction/2)', () => {
    const controls = [ctrl('AC.1', 'AC', -5)];
    const responses = [resp('AC.1', 'PARTIAL')];
    const result = getRemediationPriorities(controls, responses);
    expect(result[0].deductionApplied).toBe(-2); // ceil(-5/2) = -2
  });
});

// ─── estimateTimeToTarget ─────────────────────────────────────────────────────

describe('estimateTimeToTarget', () => {
  it('already at target → zero work', () => {
    const controls = [ctrl('AC.1', 'AC', -5)];
    const responses = [resp('AC.1', 'MET')];
    const result = estimateTimeToTarget(controls, responses, 110);
    expect(result).toEqual({ totalHours: 0, controlsToFix: 0, quickWins: [] });
  });

  it('above target → zero work', () => {
    const controls = [ctrl('AC.1', 'AC', -5)];
    const responses = [resp('AC.1', 'MET')];
    const result = estimateTimeToTarget(controls, responses, 100);
    expect(result).toEqual({ totalHours: 0, controlsToFix: 0, quickWins: [] });
  });

  it('greedy picks controls to reach target', () => {
    // Start at 110-10-8-5 = 87 → need to reach 100 → fix -10, -8 controls
    const controls = [
      ctrl('AC.1', 'AC', -10, 20),
      ctrl('AC.2', 'AC', -8, 4),
      ctrl('AC.3', 'AC', -5, 2),
    ];
    const responses = [
      resp('AC.1', 'UNMET'),
      resp('AC.2', 'UNMET'),
      resp('AC.3', 'UNMET'),
    ];
    // Current score: 110 - 10 - 8 - 5 = 87. Target = 100.
    // Greedy: fix AC.1 (+10) → 97, fix AC.2 (+8) → 105 ≥ 100 → stop
    const result = estimateTimeToTarget(controls, responses, 100);
    expect(result.controlsToFix).toBe(2);
    expect(result.totalHours).toBe(24); // 20 + 4
  });

  it('quick wins are controls with estimatedHours ≤ 8', () => {
    const controls = [
      ctrl('AC.1', 'AC', -10, 20), // not a quick win
      ctrl('AC.2', 'AC', -8, 4),   // quick win
      ctrl('AC.3', 'AC', -5, 8),   // quick win (exactly 8)
    ];
    const responses = [
      resp('AC.1', 'UNMET'),
      resp('AC.2', 'UNMET'),
      resp('AC.3', 'UNMET'),
    ];
    const result = estimateTimeToTarget(controls, responses, 100);
    const quickWinIds = result.quickWins.map((c) => c.id);
    expect(quickWinIds).toContain('AC.2');
    expect(quickWinIds).toContain('AC.3');
    expect(quickWinIds).not.toContain('AC.1');
  });

  it('target clamped to 110 max', () => {
    const controls = [ctrl('AC.1', 'AC', -5)];
    const responses = [resp('AC.1', 'MET')];
    // Score is 110, clamped target 110 → already at target
    const result = estimateTimeToTarget(controls, responses, 200);
    expect(result.totalHours).toBe(0);
  });

  it('target clamped to -203 min', () => {
    const controls = [ctrl('AC.1', 'AC', -5)];
    const responses = [resp('AC.1', 'UNMET')];
    // Score is 105, target clamped to -203 → already above
    const result = estimateTimeToTarget(controls, responses, -300);
    expect(result.totalHours).toBe(0);
  });
});

// ─── getCompletionPercent ─────────────────────────────────────────────────────

describe('getCompletionPercent', () => {
  it('0 totalControls → 0', () => {
    expect(getCompletionPercent(0, [])).toBe(0);
  });

  it('negative totalControls → 0', () => {
    expect(getCompletionPercent(-1, [])).toBe(0);
  });

  it('no responses → 0', () => {
    expect(getCompletionPercent(10, [])).toBe(0);
  });

  it('all responded MET → 100', () => {
    const responses = [resp('AC.1', 'MET'), resp('AC.2', 'MET')];
    expect(getCompletionPercent(2, responses)).toBe(100);
  });

  it('half responded → 50', () => {
    const responses = [resp('AC.1', 'MET')];
    expect(getCompletionPercent(2, responses)).toBe(50);
  });

  it('NOT_ASSESSED responses do not count toward completion', () => {
    const responses = [resp('AC.1', 'NOT_ASSESSED'), resp('AC.2', 'MET')];
    expect(getCompletionPercent(2, responses)).toBe(50); // only MET counts
  });

  it('duplicate controlIds count once', () => {
    const responses = [
      resp('AC.1', 'MET', '2024-01-01T00:00:00Z'),
      resp('AC.1', 'UNMET', '2024-06-01T00:00:00Z'),
    ];
    expect(getCompletionPercent(2, responses)).toBe(50); // 1 unique / 2 total
  });

  it('result clamped to 100', () => {
    const responses = [resp('AC.1', 'MET'), resp('AC.2', 'MET'), resp('AC.3', 'MET')];
    expect(getCompletionPercent(2, responses)).toBe(100); // more responses than controls
  });

  it('result rounded to one decimal place', () => {
    const responses = [resp('AC.1', 'MET')];
    // 1/3 * 100 = 33.333... → 33.3
    expect(getCompletionPercent(3, responses)).toBe(33.3);
  });
});
