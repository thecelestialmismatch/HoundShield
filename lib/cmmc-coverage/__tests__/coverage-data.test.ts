/**
 * CMMC Coverage Data — Unit Tests
 *
 * Tests for correctness and integrity of the HoundShield coverage mappings.
 * These tests act as living documentation of coverage claims.
 */

import { COVERAGE_DATA, type CoverageStatus } from '../coverage-data';
import {
  getAllCoverage,
  getCoverageById,
  getCoverageByFamily,
  getCoverageByStatus,
  getEnforcedControls,
  getMonitoredControls,
  getPartialControls,
  getCoveredControls,
  getTotalSprsProtected,
  getFamilySprsProtected,
  getCoverageSummary,
  getStatusBadgeClass,
} from '../index';

// ─── Coverage data integrity ──────────────────────────────────────────────────

describe('COVERAGE_DATA integrity', () => {
  it('contains exactly 110 controls', () => {
    expect(COVERAGE_DATA.length).toBe(110);
  });

  it('has no duplicate control IDs', () => {
    const ids = COVERAGE_DATA.map((c) => c.controlId);
    const unique = new Set(ids);
    expect(unique.size).toBe(110);
  });

  it('all status values are valid', () => {
    const valid: CoverageStatus[] = ['ENFORCED', 'MONITORED', 'PARTIAL', 'OUT_OF_SCOPE'];
    for (const c of COVERAGE_DATA) {
      expect(valid).toContain(c.status);
    }
  });

  it('sprsProtected is a non-negative integer for every control', () => {
    for (const c of COVERAGE_DATA) {
      expect(c.sprsProtected).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(c.sprsProtected)).toBe(true);
    }
  });

  it('OUT_OF_SCOPE controls have sprsProtected = 0', () => {
    const outOfScope = COVERAGE_DATA.filter((c) => c.status === 'OUT_OF_SCOPE');
    for (const c of outOfScope) {
      expect(c.sprsProtected).toBe(0);
    }
  });

  it('OUT_OF_SCOPE controls have empty description', () => {
    const outOfScope = COVERAGE_DATA.filter((c) => c.status === 'OUT_OF_SCOPE');
    for (const c of outOfScope) {
      expect(c.description).toBe('');
    }
  });

  it('non-OUT_OF_SCOPE controls have non-empty description', () => {
    const covered = COVERAGE_DATA.filter((c) => c.status !== 'OUT_OF_SCOPE');
    for (const c of covered) {
      expect(c.description.length).toBeGreaterThan(10);
    }
  });

  it('ENFORCED controls have sprsProtected > 0', () => {
    const enforced = COVERAGE_DATA.filter((c) => c.status === 'ENFORCED');
    for (const c of enforced) {
      expect(c.sprsProtected).toBeGreaterThan(0);
    }
  });

  it('control IDs follow expected format (XX.N.NNN)', () => {
    const pattern = /^[A-Z]{2}\.[12]\.\d{3}$/;
    for (const c of COVERAGE_DATA) {
      expect(c.controlId).toMatch(pattern);
    }
  });
});

// ─── Required specific control coverage claims ────────────────────────────────

describe('Core HoundShield coverage claims', () => {
  it('AC.2.003 (CUI Flow Control) is ENFORCED', () => {
    const c = COVERAGE_DATA.find((x) => x.controlId === 'AC.2.003');
    expect(c?.status).toBe('ENFORCED');
    expect(c?.sprsProtected).toBe(5);
  });

  it('AC.2.022 (CUI on public systems) is ENFORCED', () => {
    const c = COVERAGE_DATA.find((x) => x.controlId === 'AC.2.022');
    expect(c?.status).toBe('ENFORCED');
  });

  it('AU.2.001 (Create audit logs) is ENFORCED', () => {
    const c = COVERAGE_DATA.find((x) => x.controlId === 'AU.2.001');
    expect(c?.status).toBe('ENFORCED');
    expect(c?.sprsProtected).toBe(5);
  });

  it('AU.2.002 (User accountability) is ENFORCED', () => {
    const c = COVERAGE_DATA.find((x) => x.controlId === 'AU.2.002');
    expect(c?.status).toBe('ENFORCED');
    expect(c?.sprsProtected).toBe(5);
  });

  it('AU.2.007 (Audit timestamps) is ENFORCED', () => {
    const c = COVERAGE_DATA.find((x) => x.controlId === 'AU.2.007');
    expect(c?.status).toBe('ENFORCED');
  });

  it('SC.1.001 (Communications boundary) is ENFORCED', () => {
    const c = COVERAGE_DATA.find((x) => x.controlId === 'SC.1.001');
    expect(c?.status).toBe('ENFORCED');
    expect(c?.sprsProtected).toBe(5);
  });

  it('SC.2.004 (Prevent unauthorized info transfer) is ENFORCED', () => {
    const c = COVERAGE_DATA.find((x) => x.controlId === 'SC.2.004');
    expect(c?.status).toBe('ENFORCED');
  });

  it('SI.2.007 (Identify unauthorized system use) is ENFORCED', () => {
    const c = COVERAGE_DATA.find((x) => x.controlId === 'SI.2.007');
    expect(c?.status).toBe('ENFORCED');
  });
});

// ─── Out-of-scope families ────────────────────────────────────────────────────

describe('OUT_OF_SCOPE families', () => {
  it('all PE controls are OUT_OF_SCOPE (physical security)', () => {
    const pe = COVERAGE_DATA.filter((c) => c.controlId.startsWith('PE.'));
    expect(pe.length).toBe(6);
    for (const c of pe) {
      expect(c.status).toBe('OUT_OF_SCOPE');
    }
  });

  it('all MA controls are OUT_OF_SCOPE (maintenance)', () => {
    const ma = COVERAGE_DATA.filter((c) => c.controlId.startsWith('MA.'));
    expect(ma.length).toBe(6);
    for (const c of ma) {
      expect(c.status).toBe('OUT_OF_SCOPE');
    }
  });

  it('all MP controls are OUT_OF_SCOPE (media protection)', () => {
    const mp = COVERAGE_DATA.filter((c) => c.controlId.startsWith('MP.'));
    expect(mp.length).toBe(9);
    for (const c of mp) {
      expect(c.status).toBe('OUT_OF_SCOPE');
    }
  });

  it('all PS controls are OUT_OF_SCOPE (personnel security)', () => {
    const ps = COVERAGE_DATA.filter((c) => c.controlId.startsWith('PS.'));
    expect(ps.length).toBe(2);
    for (const c of ps) {
      expect(c.status).toBe('OUT_OF_SCOPE');
    }
  });

  it('all IA controls are OUT_OF_SCOPE (traditional auth)', () => {
    const ia = COVERAGE_DATA.filter((c) => c.controlId.startsWith('IA.'));
    expect(ia.length).toBe(11);
    for (const c of ia) {
      expect(c.status).toBe('OUT_OF_SCOPE');
    }
  });
});

// ─── Family control counts ────────────────────────────────────────────────────

describe('Family control counts match NIST 800-171 Rev 2', () => {
  const countByFamily = (prefix: string) =>
    COVERAGE_DATA.filter((c) => c.controlId.startsWith(prefix + '.')).length;

  it('AC has 22 controls', () => expect(countByFamily('AC')).toBe(22));
  it('AT has 3 controls',  () => expect(countByFamily('AT')).toBe(3));
  it('AU has 9 controls',  () => expect(countByFamily('AU')).toBe(9));
  it('CA has 4 controls',  () => expect(countByFamily('CA')).toBe(4));
  it('CM has 9 controls',  () => expect(countByFamily('CM')).toBe(9));
  it('IA has 11 controls', () => expect(countByFamily('IA')).toBe(11));
  it('IR has 3 controls',  () => expect(countByFamily('IR')).toBe(3));
  it('MA has 6 controls',  () => expect(countByFamily('MA')).toBe(6));
  it('MP has 9 controls',  () => expect(countByFamily('MP')).toBe(9));
  it('PE has 6 controls',  () => expect(countByFamily('PE')).toBe(6));
  it('PS has 2 controls',  () => expect(countByFamily('PS')).toBe(2));
  it('RA has 3 controls',  () => expect(countByFamily('RA')).toBe(3));
  it('SC has 16 controls', () => expect(countByFamily('SC')).toBe(16));
  it('SI has 7 controls',  () => expect(countByFamily('SI')).toBe(7));
});

// ─── Utility function tests ───────────────────────────────────────────────────

describe('getAllCoverage()', () => {
  it('returns 110 enriched controls', () => {
    const all = getAllCoverage();
    expect(all.length).toBe(110);
  });

  it('each item has a control property with id, family, title', () => {
    const all = getAllCoverage();
    for (const c of all) {
      expect(c.control).toBeDefined();
      expect(c.control.id).toBe(c.controlId);
      expect(typeof c.control.family).toBe('string');
      expect(typeof c.control.title).toBe('string');
    }
  });
});

describe('getCoverageById()', () => {
  it('returns correct coverage for known ID', () => {
    const c = getCoverageById('AC.2.003');
    expect(c).toBeDefined();
    expect(c?.status).toBe('ENFORCED');
    expect(c?.control.id).toBe('AC.2.003');
  });

  it('returns undefined for unknown ID', () => {
    expect(getCoverageById('XX.9.999')).toBeUndefined();
  });
});

describe('getCoverageByFamily()', () => {
  it('returns only controls for the given family', () => {
    const ac = getCoverageByFamily('AC');
    expect(ac.every((c) => c.control.family === 'AC')).toBe(true);
    expect(ac.length).toBe(22);
  });

  it('returns empty array for unknown family', () => {
    expect(getCoverageByFamily('ZZ')).toHaveLength(0);
  });
});

describe('getCoverageByStatus()', () => {
  it('returns only controls matching the given status', () => {
    const enforced = getCoverageByStatus('ENFORCED');
    expect(enforced.every((c) => c.status === 'ENFORCED')).toBe(true);
    expect(enforced.length).toBeGreaterThan(0);
  });
});

describe('getEnforcedControls()', () => {
  it('returns at least 5 enforced controls', () => {
    expect(getEnforcedControls().length).toBeGreaterThanOrEqual(5);
  });

  it('all returned controls have status ENFORCED', () => {
    expect(getEnforcedControls().every((c) => c.status === 'ENFORCED')).toBe(true);
  });
});

describe('getMonitoredControls()', () => {
  it('all returned controls have status MONITORED', () => {
    expect(getMonitoredControls().every((c) => c.status === 'MONITORED')).toBe(true);
  });
});

describe('getPartialControls()', () => {
  it('all returned controls have status PARTIAL', () => {
    expect(getPartialControls().every((c) => c.status === 'PARTIAL')).toBe(true);
  });
});

describe('getCoveredControls()', () => {
  it('does not include OUT_OF_SCOPE controls', () => {
    const covered = getCoveredControls();
    expect(covered.every((c) => c.status !== 'OUT_OF_SCOPE')).toBe(true);
  });

  it('equals enforced + monitored + partial count', () => {
    const e = getEnforcedControls().length;
    const m = getMonitoredControls().length;
    const p = getPartialControls().length;
    expect(getCoveredControls().length).toBe(e + m + p);
  });
});

describe('getTotalSprsProtected()', () => {
  it('returns a positive number', () => {
    expect(getTotalSprsProtected()).toBeGreaterThan(0);
  });

  it('matches sum of all sprsProtected values in COVERAGE_DATA', () => {
    const expected = COVERAGE_DATA.reduce((s, c) => s + c.sprsProtected, 0);
    expect(getTotalSprsProtected()).toBe(expected);
  });
});

describe('getFamilySprsProtected()', () => {
  it('returns 0 for OUT_OF_SCOPE families (PE, MA, MP, PS, IA)', () => {
    expect(getFamilySprsProtected('PE')).toBe(0);
    expect(getFamilySprsProtected('MA')).toBe(0);
    expect(getFamilySprsProtected('MP')).toBe(0);
    expect(getFamilySprsProtected('PS')).toBe(0);
    expect(getFamilySprsProtected('IA')).toBe(0);
  });

  it('returns positive value for AC family (has ENFORCED controls)', () => {
    expect(getFamilySprsProtected('AC')).toBeGreaterThan(0);
  });

  it('returns positive value for AU family (core audit coverage)', () => {
    expect(getFamilySprsProtected('AU')).toBeGreaterThan(0);
  });
});

describe('getCoverageSummary()', () => {
  it('returns totalControls = 110', () => {
    const s = getCoverageSummary();
    expect(s.totalControls).toBe(110);
  });

  it('enforced + monitored + partial + outOfScope = 110', () => {
    const s = getCoverageSummary();
    expect(s.enforced + s.monitored + s.partial + s.outOfScope).toBe(110);
  });

  it('covered = enforced + monitored + partial', () => {
    const s = getCoverageSummary();
    expect(s.covered).toBe(s.enforced + s.monitored + s.partial);
  });

  it('coveragePercent is between 0 and 100', () => {
    const s = getCoverageSummary();
    expect(s.coveragePercent).toBeGreaterThanOrEqual(0);
    expect(s.coveragePercent).toBeLessThanOrEqual(100);
  });

  it('totalSprsProtected matches getTotalSprsProtected()', () => {
    expect(getCoverageSummary().totalSprsProtected).toBe(getTotalSprsProtected());
  });

  it('byFamily has 14 entries', () => {
    expect(getCoverageSummary().byFamily.length).toBe(14);
  });

  it('byFamily totals match top-level counts', () => {
    const s = getCoverageSummary();
    const familyTotal = s.byFamily.reduce((acc, f) => ({
      enforced: acc.enforced + f.enforced,
      monitored: acc.monitored + f.monitored,
      partial: acc.partial + f.partial,
      outOfScope: acc.outOfScope + f.outOfScope,
      sprs: acc.sprs + f.totalSprsProtected,
    }), { enforced: 0, monitored: 0, partial: 0, outOfScope: 0, sprs: 0 });

    expect(familyTotal.enforced).toBe(s.enforced);
    expect(familyTotal.monitored).toBe(s.monitored);
    expect(familyTotal.partial).toBe(s.partial);
    expect(familyTotal.outOfScope).toBe(s.outOfScope);
    expect(familyTotal.sprs).toBe(s.totalSprsProtected);
  });
});

describe('getStatusBadgeClass()', () => {
  it('returns a string for each valid status', () => {
    const statuses: CoverageStatus[] = ['ENFORCED', 'MONITORED', 'PARTIAL', 'OUT_OF_SCOPE'];
    for (const s of statuses) {
      expect(typeof getStatusBadgeClass(s)).toBe('string');
      expect(getStatusBadgeClass(s).length).toBeGreaterThan(0);
    }
  });

  it('ENFORCED uses green class', () => {
    expect(getStatusBadgeClass('ENFORCED')).toContain('green');
  });

  it('MONITORED uses blue class', () => {
    expect(getStatusBadgeClass('MONITORED')).toContain('blue');
  });

  it('PARTIAL uses amber class', () => {
    expect(getStatusBadgeClass('PARTIAL')).toContain('amber');
  });
});
