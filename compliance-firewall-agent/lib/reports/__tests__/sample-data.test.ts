import { describe, it, expect } from "vitest";
import { buildSampleReportData } from "../sample-data";
import { generateCompliancePDF } from "../pdf-generator";

describe("buildSampleReportData", () => {
  it("is flagged demo and spans a 14-day window", () => {
    const now = new Date("2026-06-26T00:00:00.000Z");
    const d = buildSampleReportData(now);
    expect(d.demo).toBe(true);
    const start = new Date(d.summary.period.start);
    const end = new Date(d.summary.period.end);
    const days = Math.round((end.getTime() - start.getTime()) / 86_400_000);
    expect(days).toBe(14);
  });

  it("has internally consistent action/violation counts", () => {
    const d = buildSampleReportData();
    const { BLOCKED = 0, QUARANTINED = 0, ALLOWED = 0 } = d.breakdown.by_action;
    expect(BLOCKED + QUARANTINED).toBe(d.summary.total_violations);
    expect(BLOCKED + QUARANTINED + ALLOWED).toBe(d.summary.total_events);
  });

  it("shows an SPRS improvement (current > baseline)", () => {
    const d = buildSampleReportData();
    expect(d.sprs_score!.current).toBeGreaterThan(d.sprs_score!.baseline);
  });

  it("maps block events to real NIST 800-171 controls", () => {
    const d = buildSampleReportData();
    expect(d.block_events!.length).toBeGreaterThan(0);
    for (const e of d.block_events!) {
      expect(e.nist_control).toMatch(/^[A-Z]{2}\.L2-3\.\d+\.\d+$/);
    }
  });

  it("renders to a non-empty PDF buffer", () => {
    const pdf = generateCompliancePDF(buildSampleReportData());
    expect(pdf.length).toBeGreaterThan(1000);
    // PDF files start with the "%PDF" magic bytes.
    expect(pdf.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });
});
