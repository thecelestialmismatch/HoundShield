/**
 * Control Map data model — unit tests.
 *
 * These lock the beloved reference KPIs (72% overall · 28 clients · 36
 * assessments · 4 at-risk) as REAL aggregations of the sample portfolio, and
 * guard the per-client projection (determinism + bounds). If a future edit to
 * the sample data drifts a headline number, one of these fails loudly.
 */
import { describe, it, expect } from 'vitest';
import {
  PORTFOLIO_CONTROLS,
  FRAMEWORKS,
  CLIENTS,
  CMMC_LEVEL_TARGET,
  computeOverallProgress,
  countAtRiskControls,
  countByStatus,
  countAssessmentsInProgress,
  countEvidence,
  getClientById,
  getFrameworkById,
  getClientControls,
  getSnapshot,
  STATUS_LABEL,
  SECTOR_LABEL,
  type ControlStatus,
} from '../control-map-data';

describe('PORTFOLIO_CONTROLS integrity', () => {
  it('has 14 controls with unique ids', () => {
    expect(PORTFOLIO_CONTROLS).toHaveLength(14);
    const ids = PORTFOLIO_CONTROLS.map((c) => c.id);
    expect(new Set(ids).size).toBe(14);
  });

  it('every control family prefix matches its id', () => {
    for (const c of PORTFOLIO_CONTROLS) {
      expect(c.id.startsWith(`${c.family}.`)).toBe(true);
    }
  });

  it('every control id is a valid CMMC L2 practice shape (FF.L2-3.n.n)', () => {
    const shape = /^[A-Z]{2}\.L2-3\.\d+\.\d+$/;
    for (const c of PORTFOLIO_CONTROLS) {
      expect(c.id).toMatch(shape);
    }
  });

  it('all progress values are in [0, 100]', () => {
    for (const c of PORTFOLIO_CONTROLS) {
      expect(c.progress).toBeGreaterThanOrEqual(0);
      expect(c.progress).toBeLessThanOrEqual(100);
    }
  });

  it('all evidence counts are non-negative integers', () => {
    for (const c of PORTFOLIO_CONTROLS) {
      expect(Number.isInteger(c.evidenceCount)).toBe(true);
      expect(c.evidenceCount).toBeGreaterThanOrEqual(0);
    }
  });

  it('leads with the canonical AC.L2-3.1.1 preview row', () => {
    const first = PORTFOLIO_CONTROLS[0];
    expect(first.id).toBe('AC.L2-3.1.1');
    expect(first.progress).toBe(100);
    expect(first.evidenceCount).toBe(3);
    expect(first.status).toBe('implemented');
  });
});

describe('headline KPIs match the reference exactly', () => {
  it('overall progress is 72%', () => {
    expect(computeOverallProgress(PORTFOLIO_CONTROLS)).toBe(72);
  });

  it('there are 28 active clients', () => {
    expect(CLIENTS).toHaveLength(28);
  });

  it('36 assessments are in progress across the portfolio', () => {
    expect(countAssessmentsInProgress(CLIENTS)).toBe(36);
  });

  it('exactly 4 controls are at-risk', () => {
    expect(countAtRiskControls(PORTFOLIO_CONTROLS)).toBe(4);
  });

  it('the CMMC level target is 2', () => {
    expect(CMMC_LEVEL_TARGET).toBe(2);
  });
});

describe('aggregation helpers', () => {
  it('countByStatus totals to the control count', () => {
    const dist = countByStatus(PORTFOLIO_CONTROLS);
    const total = dist.implemented + dist.in_progress + dist.not_started;
    expect(total).toBe(PORTFOLIO_CONTROLS.length);
  });

  it('computeOverallProgress of an empty set is 0', () => {
    expect(computeOverallProgress([])).toBe(0);
  });

  it('countEvidence sums evidence artifacts', () => {
    const manual = PORTFOLIO_CONTROLS.reduce((a, c) => a + c.evidenceCount, 0);
    expect(countEvidence(PORTFOLIO_CONTROLS)).toBe(manual);
  });

  it('every status has a human label', () => {
    const statuses: ControlStatus[] = ['implemented', 'in_progress', 'not_started'];
    for (const s of statuses) {
      expect(STATUS_LABEL[s]).toBeTruthy();
    }
  });
});

describe('clients & frameworks', () => {
  it('client ids are unique and zero-padded', () => {
    const ids = CLIENTS.map((c) => c.id);
    expect(new Set(ids).size).toBe(CLIENTS.length);
    expect(ids[0]).toBe('client-01');
  });

  it('every client sector has a label', () => {
    for (const c of CLIENTS) {
      expect(SECTOR_LABEL[c.sector]).toBeTruthy();
    }
  });

  it('exactly one framework is active (CMMC 2.0)', () => {
    const active = FRAMEWORKS.filter((f) => f.active);
    expect(active).toHaveLength(1);
    expect(active[0].name).toBe('CMMC 2.0');
    expect(active[0].progress).toBe(72);
  });

  it('getClientById / getFrameworkById resolve and miss cleanly', () => {
    expect(getClientById('client-01')?.name).toBe('Aegis Defense Systems');
    expect(getClientById('nope')).toBeUndefined();
    expect(getFrameworkById('cmmc-2')?.active).toBe(true);
    expect(getFrameworkById('nope')).toBeUndefined();
  });
});

describe('getSnapshot — portfolio scope', () => {
  const snap = getSnapshot('all');

  it('reports the portfolio rollup', () => {
    expect(snap.scope).toBe('all');
    expect(snap.scopeLabel).toBe('All Clients');
    expect(snap.overallProgress).toBe(72);
    expect(snap.activeClients).toBe(28);
    expect(snap.assessmentsInProgress).toBe(36);
    expect(snap.atRiskControls).toBe(4);
    expect(snap.cmmcLevelTarget).toBe(2);
    expect(snap.frameworks).toHaveLength(4);
    expect(snap.controls).toHaveLength(14);
  });

  it('returns copies, not the frozen source arrays', () => {
    expect(snap.controls).not.toBe(PORTFOLIO_CONTROLS);
    expect(snap.frameworks).not.toBe(FRAMEWORKS);
  });

  it('defaults to the portfolio when called with no scope', () => {
    expect(getSnapshot().scope).toBe('all');
  });
});

describe('getSnapshot — single-client scope', () => {
  it('projects onto one client', () => {
    const snap = getSnapshot('client-01');
    expect(snap.scope).toBe('client-01');
    expect(snap.scopeLabel).toBe('Aegis Defense Systems');
    expect(snap.activeClients).toBe(1);
    expect(snap.overallProgress).toBe(88); // client's own completion
    expect(snap.controls).toHaveLength(14);
  });

  it('keeps every projected control within [0, 100]', () => {
    for (const c of CLIENTS) {
      const controls = getClientControls(c);
      for (const ctrl of controls) {
        expect(ctrl.progress).toBeGreaterThanOrEqual(0);
        expect(ctrl.progress).toBeLessThanOrEqual(100);
      }
    }
  });

  it('is deterministic — same client resolves identically', () => {
    const a = getSnapshot('client-05');
    const b = getSnapshot('client-05');
    expect(a).toEqual(b);
  });

  it('scales framework rollups by the client factor and bounds them', () => {
    const snap = getSnapshot('client-13'); // Redstone Robotics, 91%
    for (const f of snap.frameworks) {
      expect(f.progress).toBeGreaterThanOrEqual(0);
      expect(f.progress).toBeLessThanOrEqual(100);
    }
  });

  it('falls back to the portfolio for an unknown client', () => {
    expect(getSnapshot('client-999').scope).toBe('all');
  });
});
