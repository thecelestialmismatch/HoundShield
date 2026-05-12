import { generateCompliancePDF, type ReportData, type BlockEventEvidence } from "../pdf-generator";

// jsPDF uses browser APIs. Provide minimal stubs for Node.js test environment.
jest.mock("jspdf", () => {
  const mockDoc = {
    setFillColor: jest.fn().mockReturnThis(),
    setTextColor: jest.fn().mockReturnThis(),
    setFontSize: jest.fn().mockReturnThis(),
    setFont: jest.fn().mockReturnThis(),
    setDrawColor: jest.fn().mockReturnThis(),
    rect: jest.fn().mockReturnThis(),
    roundedRect: jest.fn().mockReturnThis(),
    line: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    addPage: jest.fn().mockReturnThis(),
    setPage: jest.fn().mockReturnThis(),
    splitTextToSize: jest.fn().mockReturnValue(["line1", "line2"]),
    getNumberOfPages: jest.fn().mockReturnValue(5),
    output: jest.fn().mockReturnValue(new ArrayBuffer(1024)),
    internal: { getNumberOfPages: jest.fn().mockReturnValue(5) },
    lastAutoTable: { finalY: 100 },
  };
  return { jsPDF: jest.fn(() => mockDoc) };
});

jest.mock("jspdf-autotable", () => jest.fn());

// ── Fixtures ─────────────────────────────────────────────────────────────────

function makeReport(overrides: Partial<ReportData> = {}): ReportData {
  return {
    summary: {
      period: { start: "2026-04-01T00:00:00Z", end: "2026-04-30T23:59:59Z" },
      total_events: 250,
      total_violations: 47,
      violation_rate: 18.8,
      avg_processing_time_ms: 8,
    },
    breakdown: {
      by_risk_level: { CRITICAL: 12, HIGH: 18, MEDIUM: 9, LOW: 8, NONE: 203 },
      by_category: { CUI: 20, PII: 15, KEYS: 7, FINANCIAL: 5 },
      by_action: { BLOCKED: 30, QUARANTINED: 17, ALLOWED: 203 },
    },
    integrity: {
      merkle_root: "a3f1b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2",
      events_with_seeds: 247,
      events_without_seeds: 3,
    },
    compliance_status: {
      cmmc_ac_l2_3_1_3: "ENFORCED — CUI flow control active",
      cmmc_au_l2_3_3_1: "COMPLIANT — Tamper-evident audit log",
      cmmc_si_l2_3_14_1: "ACTIVE — Real-time threat detection",
    },
    generated_at: "2026-05-01T00:00:00Z",
    organization: "Acme Defense Systems",
    ...overrides,
  };
}

const BLOCK_EVENT: BlockEventEvidence = {
  timestamp: "2026-04-15T14:22:33Z",
  action: "BLOCKED",
  risk_level: "CRITICAL",
  pattern_name: "DoD Contract Number",
  nist_control: "AC.L2-3.1.3",
  control_name: "Control the flow of CUI",
  sprs_impact: -5,
  dcsa_reportable: true,
};

// ── Core contract tests ───────────────────────────────────────────────────────

describe("generateCompliancePDF", () => {
  it("returns a Buffer", () => {
    const result = generateCompliancePDF(makeReport());
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it("buffer is non-empty", () => {
    const result = generateCompliancePDF(makeReport());
    expect(result.length).toBeGreaterThan(0);
  });

  it("accepts a full report with organization name", () => {
    expect(() => generateCompliancePDF(makeReport({ organization: "Acme Defense" }))).not.toThrow();
  });

  it("accepts a report with no organization (defaults to 'Defense Contractor')", () => {
    const report = makeReport();
    delete (report as Partial<ReportData>).organization;
    expect(() => generateCompliancePDF(report)).not.toThrow();
  });

  it("handles demo mode flag without throwing", () => {
    expect(() => generateCompliancePDF(makeReport({ demo: true }))).not.toThrow();
  });

  it("handles zero total_events without division-by-zero", () => {
    const report = makeReport({
      summary: {
        period: { start: "2026-04-01T00:00:00Z", end: "2026-04-30T23:59:59Z" },
        total_events: 0,
        total_violations: 0,
        violation_rate: 0,
        avg_processing_time_ms: 0,
      },
      breakdown: {
        by_risk_level: {},
        by_category: {},
        by_action: {},
      },
    });
    expect(() => generateCompliancePDF(report)).not.toThrow();
  });

  it("handles null merkle_root", () => {
    expect(() =>
      generateCompliancePDF(makeReport({ integrity: { merkle_root: null, events_with_seeds: 0, events_without_seeds: 10 } }))
    ).not.toThrow();
  });

  it("renders SPRS score delta when sprs_score provided", () => {
    expect(() =>
      generateCompliancePDF(makeReport({ sprs_score: { current: 85, baseline: 42 } }))
    ).not.toThrow();
  });

  it("renders negative SPRS delta without throwing", () => {
    expect(() =>
      generateCompliancePDF(makeReport({ sprs_score: { current: -10, baseline: 20 } }))
    ).not.toThrow();
  });

  it("renders block_events section with evidence", () => {
    expect(() =>
      generateCompliancePDF(makeReport({ block_events: [BLOCK_EVENT] }))
    ).not.toThrow();
  });

  it("renders DCSA reportable banner when dcsa_reportable events exist", () => {
    const events: BlockEventEvidence[] = [
      { ...BLOCK_EVENT, dcsa_reportable: true },
      { ...BLOCK_EVENT, dcsa_reportable: false, pattern_name: "SSN" },
    ];
    expect(() =>
      generateCompliancePDF(makeReport({ block_events: events }))
    ).not.toThrow();
  });

  it("truncates block_events to 40 rows max without throwing", () => {
    const events = Array.from({ length: 60 }, (_, i) => ({
      ...BLOCK_EVENT,
      pattern_name: `Pattern ${i}`,
      dcsa_reportable: i % 3 === 0,
    }));
    expect(() => generateCompliancePDF(makeReport({ block_events: events }))).not.toThrow();
  });

  it("handles empty block_events array (no violations message)", () => {
    expect(() =>
      generateCompliancePDF(makeReport({ block_events: [] }))
    ).not.toThrow();
  });

  it("handles all QUARANTINED actions (no BLOCKED)", () => {
    const report = makeReport({
      breakdown: {
        by_risk_level: { MEDIUM: 5 },
        by_category: { CUI: 3, PII: 2 },
        by_action: { QUARANTINED: 5, ALLOWED: 245 },
      },
    });
    expect(() => generateCompliancePDF(report)).not.toThrow();
  });

  it("compliance score is 100 when violation_rate is 0", () => {
    // The function computes: 100 - violation_rate. Verify no crash.
    const report = makeReport({
      summary: {
        period: { start: "2026-04-01T00:00:00Z", end: "2026-04-30T23:59:59Z" },
        total_events: 100,
        total_violations: 0,
        violation_rate: 0,
        avg_processing_time_ms: 7,
      },
    });
    expect(() => generateCompliancePDF(report)).not.toThrow();
  });

  it("compliance score < 60 triggers non-compliant label path", () => {
    const report = makeReport({
      summary: {
        period: { start: "2026-04-01T00:00:00Z", end: "2026-04-30T23:59:59Z" },
        total_events: 100,
        total_violations: 50,
        violation_rate: 50,
        avg_processing_time_ms: 9,
      },
    });
    expect(() => generateCompliancePDF(report)).not.toThrow();
  });

  it("handles large category breakdown without crashing", () => {
    const categories: Record<string, number> = {};
    for (let i = 0; i < 30; i++) categories[`CAT_${i}`] = i * 2;
    const report = makeReport({ breakdown: { ...makeReport().breakdown, by_category: categories } });
    expect(() => generateCompliancePDF(report)).not.toThrow();
  });

  it("SPRS impact summary skips when total impact is 0", () => {
    const events: BlockEventEvidence[] = [{ ...BLOCK_EVENT, sprs_impact: 0 }];
    expect(() => generateCompliancePDF(makeReport({ block_events: events }))).not.toThrow();
  });

  it("generates valid ArrayBuffer output from jsPDF", () => {
    const result = generateCompliancePDF(makeReport());
    // Buffer.from(ArrayBuffer) must succeed
    expect(() => Buffer.from(result)).not.toThrow();
  });
});

// ── Date formatting edge cases ────────────────────────────────────────────────

describe("generateCompliancePDF date handling", () => {
  it("handles malformed ISO date strings gracefully", () => {
    expect(() =>
      generateCompliancePDF(
        makeReport({
          generated_at: "not-a-date",
          summary: {
            period: { start: "bad-start", end: "bad-end" },
            total_events: 1,
            total_violations: 0,
            violation_rate: 0,
            avg_processing_time_ms: 5,
          },
        })
      )
    ).not.toThrow();
  });
});
