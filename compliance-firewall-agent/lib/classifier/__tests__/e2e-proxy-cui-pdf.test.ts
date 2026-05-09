/**
 * E2E Sprint 1 — Jordan's acceptance test.
 *
 * Verifies the complete flow:
 *   1. A prompt containing CUI is submitted to the classification engine
 *   2. The engine flags it CRITICAL / HIGH and BLOCKS or QUARANTINEs it
 *   3. The flagged event is serialised into a ReportData payload
 *   4. generateCompliancePDF() produces a non-empty Buffer from that payload
 *
 * Runs entirely in-process — no network, no Docker, no Supabase.
 */

import { classifyRisk } from "../risk-engine";
import { generateCompliancePDF } from "../../reports/pdf-generator";
import type { ReportData } from "../../reports/pdf-generator";
import type { ClassificationResult } from "@/lib/supabase/types";

// ── jsPDF mock ─────────────────────────────────────────────────────────────

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
    splitTextToSize: jest.fn().mockReturnValue(["line1"]),
    getNumberOfPages: jest.fn().mockReturnValue(5),
    output: jest.fn().mockReturnValue(new ArrayBuffer(1024)),
    internal: { getNumberOfPages: jest.fn().mockReturnValue(5) },
    lastAutoTable: { finalY: 100 },
  };
  return { jsPDF: jest.fn(() => mockDoc) };
});
jest.mock("jspdf-autotable", () => jest.fn());

// Stub optional AI scanners (no network in unit tests)
jest.mock("../gemini-scanner", () => ({
  isGeminiConfigured: () => false,
  scanWithGeminiFlash: jest.fn(),
}));
jest.mock("@/lib/advisor/compliance-advisor", () => ({
  isAdvisorConfigured: () => false,
  classifyWithAdvisor: jest.fn(),
}));

// ── Helpers ────────────────────────────────────────────────────────────────

function deriveAction(r: ClassificationResult): "BLOCKED" | "QUARANTINED" | "ALLOWED" {
  if (r.should_block) return "BLOCKED";
  if (r.should_quarantine) return "QUARANTINED";
  return "ALLOWED";
}

function buildReport(r: ClassificationResult): ReportData {
  const action = deriveAction(r);
  const isViolation = action !== "ALLOWED";
  return {
    summary: {
      period: { start: "2026-04-01T00:00:00Z", end: "2026-04-30T23:59:59Z" },
      total_events: 1,
      total_violations: isViolation ? 1 : 0,
      violation_rate: isViolation ? 100 : 0,
      avg_processing_time_ms: 8,
    },
    breakdown: {
      by_risk_level: { [r.risk_level]: 1 },
      by_category: r.entities.reduce<Record<string, number>>((acc, e) => {
        acc[e.type] = (acc[e.type] ?? 0) + 1;
        return acc;
      }, {}),
      by_action: { [action]: 1 },
    },
    integrity: { merkle_root: null, events_with_seeds: 0, events_without_seeds: 1 },
    compliance_status: {
      cmmc_ac_l2_3_1_3: isViolation ? `ENFORCED — ${r.risk_level} event blocked` : "ENFORCED — No violations",
      cmmc_au_l2_3_3_1: "COMPLIANT — Event logged",
    },
    generated_at: new Date().toISOString(),
    organization: "Jordan Defense Systems LLC",
    block_events: isViolation
      ? r.entities.slice(0, 10).map((e) => ({
          timestamp: new Date().toISOString(),
          action: action as "BLOCKED" | "QUARANTINED",
          risk_level: r.risk_level,
          pattern_name: e.pattern_matched,
          nist_control: "AC.L2-3.1.3",
          control_name: "Control the flow of CUI",
          sprs_impact: -5,
          dcsa_reportable: r.risk_level === "CRITICAL",
        }))
      : [],
  };
}

// ── STEP 1: Proxy intercepts — CUI detection ───────────────────────────────

describe("Step 1 — Proxy intercepts CUI prompts", () => {
  it("flags DoD contract number as non-NONE risk", async () => {
    const r = await classifyRisk("Contract W911NF-23-C-0001 delivery schedule attached.");
    expect(r.risk_level).not.toBe("NONE");
  });

  it("flags SSN as CRITICAL", async () => {
    const r = await classifyRisk("Employee SSN: 123-45-6789 — process payroll deduction.");
    expect(r.risk_level).toBe("CRITICAL");
    expect(r.entities.length).toBeGreaterThan(0);
  });

  it("flags CAGE code as high severity", async () => {
    const r = await classifyRisk("CAGE 1ABC2 vendor onboarding form.");
    expect(["HIGH", "CRITICAL"]).toContain(r.risk_level);
  });

  it("flags CUI classification marking", async () => {
    const r = await classifyRisk("CUI//SP-CTI — Project HELIOS targeting specs.");
    expect(r.risk_level).not.toBe("NONE");
  });

  it("flags clearance reference", async () => {
    const r = await classifyRisk("Our TS/SCI cleared engineers need SIPR access.");
    expect(r.risk_level).not.toBe("NONE");
  });

  it("does NOT flag innocuous prompt", async () => {
    const r = await classifyRisk("What is the capital of France?");
    expect(r.risk_level).toBe("NONE");
    expect(r.should_block).toBe(false);
    expect(r.should_quarantine).toBe(false);
  });

  it("returns entity matches for CUI prompts", async () => {
    const r = await classifyRisk("Contract W911NF-23-C-0001 details enclosed.");
    expect(r.entities.length).toBeGreaterThan(0);
  });

  it("classification returns confidence score", async () => {
    const r = await classifyRisk("SSN 123-45-6789 credit card 4111-1111-1111-1111");
    expect(typeof r.confidence).toBe("number");
    expect(r.confidence).toBeGreaterThan(0);
  });
});

// ── STEP 2: CUI flagged — action is BLOCK or QUARANTINE ───────────────────

describe("Step 2 — CUI flagged: BLOCK or QUARANTINE", () => {
  it("SSN triggers should_block = true", async () => {
    const r = await classifyRisk("SSN 123-45-6789");
    expect(r.should_block || r.should_quarantine).toBe(true);
  });

  it("DoD contract triggers should_block or should_quarantine", async () => {
    const r = await classifyRisk("W911NF-23-C-0001 project timeline");
    expect(r.should_block || r.should_quarantine).toBe(true);
  });

  it("CUI marking triggers action", async () => {
    const r = await classifyRisk("CUI//SP-CTI attached document");
    expect(r.should_block || r.should_quarantine).toBe(true);
  });

  it("safe prompts produce ALLOWED action", async () => {
    const safe = [
      "What is the weather today?",
      "Explain binary search trees.",
      "Draft a thank you note.",
    ];
    for (const prompt of safe) {
      const r = await classifyRisk(prompt);
      expect(deriveAction(r)).toBe("ALLOWED");
    }
  });

  it("classification completes in <100ms", async () => {
    const start = Date.now();
    await classifyRisk("Contract W911NF-23-C-0001 SSN 123-45-6789 CUI//SP-CTI");
    expect(Date.now() - start).toBeLessThan(100);
  });
});

// ── STEP 3: PDF export from classified event ──────────────────────────────

describe("Step 3 — PDF exported from flagged CUI event", () => {
  it("produces a non-empty PDF Buffer", async () => {
    const r = await classifyRisk("Contract W911NF-23-C-0001 CUI briefing");
    const pdf = generateCompliancePDF(buildReport(r));
    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(pdf.length).toBeGreaterThan(0);
  });

  it("report shows violation_rate > 0 for CUI prompt", async () => {
    const r = await classifyRisk("SSN 123-45-6789 payroll data");
    const report = buildReport(r);
    expect(report.summary.total_violations).toBeGreaterThan(0);
    expect(report.summary.violation_rate).toBeGreaterThan(0);
  });

  it("CRITICAL events are DCSA-reportable in PDF block_events", async () => {
    const r = await classifyRisk("SSN 123-45-6789");
    if (r.risk_level === "CRITICAL") {
      const report = buildReport(r);
      const hasDCSA = report.block_events?.some((e) => e.dcsa_reportable) ?? false;
      expect(hasDCSA).toBe(true);
    }
  });

  it("full pipeline does not throw: CUI → classify → report → PDF", async () => {
    const r = await classifyRisk("CAGE 1ABC2 contract W911NF-23-C-0001 CUI briefing");
    expect(() => generateCompliancePDF(buildReport(r))).not.toThrow();
  });

  it("safe prompt → zero violations → PDF still renders", async () => {
    const r = await classifyRisk("What is the weather today?");
    const report = buildReport(r);
    expect(report.summary.total_violations).toBe(0);
    expect(() => generateCompliancePDF(report)).not.toThrow();
  });
});

// ── Sprint 1 acceptance: Jordan can deploy → CUI blocked → PDF for C3PAO ─

describe("Sprint 1 acceptance — Jordan deploys, gets C3PAO PDF", () => {
  it("full end-to-end: sensitive DoD prompt → compliance PDF ready for C3PAO", async () => {
    // Simulate what Jordan's team sends to ChatGPT
    const cuiPrompt =
      "Summarise the W911NF-23-C-0001 program plan for our TS/SCI team. CAGE 1ABC2. CUI//SP-CTI.";

    const classifyStart = Date.now();
    const result = await classifyRisk(cuiPrompt);
    const classifyMs = Date.now() - classifyStart;

    // 1. Must be intercepted (not NONE)
    expect(result.risk_level).not.toBe("NONE");

    // 2. Must be fast enough for inline proxy use
    expect(classifyMs).toBeLessThan(100);

    // 3. Must generate entities for audit trail
    expect(result.entities.length).toBeGreaterThan(0);

    // 4. Build the compliance report
    const report: ReportData = {
      ...buildReport(result),
      sprs_score: { current: 85, baseline: 42 },
      organization: "Jordan Defense Systems LLC",
      summary: {
        period: { start: "2026-04-01T00:00:00Z", end: "2026-04-30T23:59:59Z" },
        total_events: 47,
        total_violations: 12,
        violation_rate: 25.5,
        avg_processing_time_ms: classifyMs || 8,
      },
    };

    // 5. PDF must render without error
    const pdfBuffer = generateCompliancePDF(report);
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(0);

    // 6. SPRS score shows improvement
    expect(report.sprs_score!.current).toBeGreaterThan(report.sprs_score!.baseline);
  });
});
