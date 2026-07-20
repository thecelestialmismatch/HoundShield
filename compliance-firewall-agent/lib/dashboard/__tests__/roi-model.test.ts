/**
 * Compliance ROI model — unit tests.
 *
 * Lock every headline dollar figure as a REAL aggregation of the sample cost
 * model, and guard the period scaling + trend series (determinism, bounds,
 * monotonicity). If a future edit drifts a number, one of these fails loudly.
 */
import { describe, it, expect } from 'vitest';
import {
  CATEGORIES,
  PRO_MONTHLY,
  PRO_ANNUAL,
  PERIOD_FRACTION,
  PERIOD_MONTHS,
  incidentsForPeriod,
  costAvoidedForPeriod,
  categoryLines,
  totalAvoided,
  totalIncidents,
  toolCost,
  roiMultiple,
  savingsTrend,
  getRoiSnapshot,
  formatUsd,
  formatCompact,
  type RoiPeriod,
} from '../roi-model';

const PERIODS: RoiPeriod[] = ['90d', '6m', '12m'];

describe('CATEGORIES integrity', () => {
  it('has 5 categories with unique ids', () => {
    expect(CATEGORIES).toHaveLength(5);
    expect(new Set(CATEGORIES.map((c) => c.id)).size).toBe(5);
  });

  it('every category has positive costs, incidents, and target', () => {
    for (const c of CATEGORIES) {
      expect(c.incidents12m).toBeGreaterThan(0);
      expect(c.costPerIncident).toBeGreaterThan(0);
      expect(c.annualExposureTarget).toBeGreaterThan(0);
    }
  });

  it('annual avoided never exceeds the annual exposure ceiling (coverage ≤ 100%)', () => {
    for (const c of CATEGORIES) {
      expect(c.incidents12m * c.costPerIncident).toBeLessThanOrEqual(c.annualExposureTarget);
    }
  });
});

describe('pricing constants', () => {
  it('Pro annual is twelve months of Pro monthly', () => {
    expect(PRO_ANNUAL).toBe(PRO_MONTHLY * 12);
    expect(PRO_ANNUAL).toBe(9588);
  });
});

describe('12-month totals are the known real aggregation', () => {
  it('total avoided is the sum of incidents × cost across categories', () => {
    // 12·9600 + 8·12400 + 27·4200 + 5·18500 + 6·6800
    expect(totalAvoided('12m')).toBe(461100);
  });

  it('total incidents is 58', () => {
    expect(totalIncidents('12m')).toBe(58);
  });

  it('total avoided equals the sum of the category lines', () => {
    const lines = categoryLines('12m');
    const sum = lines.reduce((acc, l) => acc + l.costAvoided, 0);
    expect(sum).toBe(totalAvoided('12m'));
  });
});

describe('period scaling', () => {
  it('shorter periods never exceed the 12-month figure', () => {
    for (const p of PERIODS) {
      expect(totalAvoided(p)).toBeLessThanOrEqual(totalAvoided('12m'));
      expect(totalIncidents(p)).toBeLessThanOrEqual(totalIncidents('12m'));
    }
  });

  it('incidents scale by the period fraction (rounded)', () => {
    for (const c of CATEGORIES) {
      for (const p of PERIODS) {
        expect(incidentsForPeriod(c, p)).toBe(Math.round(c.incidents12m * PERIOD_FRACTION[p]));
      }
    }
  });

  it('cost avoided is incidents × cost per incident', () => {
    for (const c of CATEGORIES) {
      for (const p of PERIODS) {
        expect(costAvoidedForPeriod(c, p)).toBe(incidentsForPeriod(c, p) * c.costPerIncident);
      }
    }
  });
});

describe('ROI multiple', () => {
  it('tool cost scales with the period', () => {
    expect(toolCost('12m')).toBe(9588);
    expect(toolCost('6m')).toBe(4794);
  });

  it('is a positive whole number for every period', () => {
    for (const p of PERIODS) {
      const m = roiMultiple(p);
      expect(Number.isInteger(m)).toBe(true);
      expect(m).toBeGreaterThan(0);
    }
  });

  it('equals total avoided divided by tool cost, rounded', () => {
    for (const p of PERIODS) {
      expect(roiMultiple(p)).toBe(Math.round(totalAvoided(p) / toolCost(p)));
    }
  });
});

describe('savings trend', () => {
  it('has one point per month for the period', () => {
    for (const p of PERIODS) {
      expect(savingsTrend(p)).toHaveLength(PERIOD_MONTHS[p]);
    }
  });

  it('is monotonic non-decreasing (cumulative)', () => {
    for (const p of PERIODS) {
      const t = savingsTrend(p);
      for (let i = 1; i < t.length; i += 1) {
        expect(t[i]).toBeGreaterThanOrEqual(t[i - 1]);
      }
    }
  });

  it('ends exactly at the period total', () => {
    for (const p of PERIODS) {
      const t = savingsTrend(p);
      expect(t[t.length - 1]).toBe(totalAvoided(p));
    }
  });
});

describe('getRoiSnapshot', () => {
  it('defaults to the 12-month period', () => {
    expect(getRoiSnapshot().period).toBe('12m');
  });

  it('is internally consistent for every period', () => {
    for (const p of PERIODS) {
      const s = getRoiSnapshot(p);
      expect(s.totalAvoided).toBe(totalAvoided(p));
      expect(s.totalIncidents).toBe(totalIncidents(p));
      expect(s.roiMultiple).toBe(roiMultiple(p));
      expect(s.toolCost).toBe(toolCost(p));
      expect(s.trend).toEqual(savingsTrend(p));
      expect(s.categories).toHaveLength(CATEGORIES.length);
      expect(s.monthlyAverage).toBe(Math.round(s.totalAvoided / PERIOD_MONTHS[p]));
    }
  });
});

describe('formatting', () => {
  it('formatUsd inserts thousands separators', () => {
    expect(formatUsd(461100)).toBe('$461,100');
    expect(formatUsd(0)).toBe('$0');
  });

  it('formatCompact abbreviates thousands and millions', () => {
    expect(formatCompact(461100)).toBe('$461K');
    expect(formatCompact(1113600)).toBe('$1.1M');
    expect(formatCompact(950)).toBe('$950');
  });
});
