import { describe, it, expect } from "vitest";
import {
  scanForSnapshot,
  splitPrompts,
  buildSnapshotReportData,
  summarizeFindings,
} from "../snapshot-from-scan";

const CUI_TEXT = `Reference Navy contract N00024-25-C-1234 and CAGE code 1ABC2.
CUI//SP-CTI: the figures are export controlled (ITAR).`;

const PII_SECRET_TEXT = `Employee John Smith SSN 123-45-6789.
AWS key AKIA1234567890ABCD12 goes in the runbook.`;

const CLEAN_TEXT = "Please summarize the quarterly team offsite agenda in three bullets.";

describe("scanForSnapshot", () => {
  it("detects CUI/CMMC markers with the real engines", () => {
    const findings = scanForSnapshot(CUI_TEXT);
    expect(findings.length).toBeGreaterThan(0);
    // CUI marking is IP + CRITICAL
    const cui = findings.find((f) => f.category === "IP");
    expect(cui).toBeTruthy();
    expect(cui!.risk).toBe("CRITICAL");
  });

  it("detects PII and secrets", () => {
    const findings = scanForSnapshot(PII_SECRET_TEXT);
    const names = findings.map((f) => f.patternName.toLowerCase());
    expect(names.some((n) => n.includes("social security"))).toBe(true);
    expect(findings.length).toBeGreaterThan(0);
  });

  it("returns nothing for clean text", () => {
    expect(scanForSnapshot(CLEAN_TEXT)).toEqual([]);
  });

  it("is deterministic across repeated calls (no shared regex lastIndex drift)", () => {
    const a = scanForSnapshot(CUI_TEXT);
    const b = scanForSnapshot(CUI_TEXT);
    expect(a).toEqual(b);
  });

  it("carries no matched substrings — only pattern names and counts", () => {
    const findings = scanForSnapshot(PII_SECRET_TEXT);
    const serialized = JSON.stringify(findings);
    expect(serialized).not.toContain("123-45-6789");
    expect(serialized).not.toContain("AKIA1234567890ABCD12");
    expect(serialized).not.toContain("John Smith");
  });

  it("sorts criticals ahead of lower severities", () => {
    const findings = scanForSnapshot(`${CUI_TEXT}\n\n${PII_SECRET_TEXT}`);
    const ranks = findings.map((f) => f.risk);
    const firstMedium = ranks.indexOf("MEDIUM");
    const lastCritical = ranks.lastIndexOf("CRITICAL");
    if (firstMedium !== -1 && lastCritical !== -1) {
      expect(lastCritical).toBeLessThan(firstMedium);
    }
  });
});

describe("splitPrompts", () => {
  it("splits on blank lines and drops empties", () => {
    expect(splitPrompts("a\n\nb\n\n\n  \n c")).toEqual(["a", "b", "c"]);
  });
  it("treats a single block as one prompt", () => {
    expect(splitPrompts("just one line")).toEqual(["just one line"]);
  });
  it("returns empty for whitespace-only input", () => {
    expect(splitPrompts("   \n  ")).toEqual([]);
  });
});

describe("buildSnapshotReportData", () => {
  const now = new Date("2026-07-18T12:00:00.000Z");

  it("is flagged snapshot, never demo, with no fabricated volumes", () => {
    const d = buildSnapshotReportData(CUI_TEXT, { now });
    expect(d.snapshot).toBe(true);
    expect(d.demo).toBe(false);
    // Single paste → a handful of events, NOT the sample's thousands.
    expect(d.summary.total_events).toBeLessThan(10);
    expect(d.integrity.merkle_root).toBeNull();
    expect(d.sprs_score).toBeUndefined();
  });

  it("keeps action/violation/event counts internally consistent", () => {
    const text = `${CUI_TEXT}\n\n${PII_SECRET_TEXT}\n\n${CLEAN_TEXT}`;
    const d = buildSnapshotReportData(text, { now });
    const { BLOCKED = 0, QUARANTINED = 0, ALLOWED = 0 } = d.breakdown.by_action;
    expect(BLOCKED + QUARANTINED).toBe(d.summary.total_violations);
    expect(BLOCKED + QUARANTINED + ALLOWED).toBe(d.summary.total_events);
  });

  it("counts a clean-only paste as zero violations", () => {
    const d = buildSnapshotReportData(CLEAN_TEXT, { now });
    expect(d.summary.total_violations).toBe(0);
    expect(d.breakdown.by_action.ALLOWED).toBe(1);
    expect(Object.keys(d.compliance_status)).toContain("No sensitive data detected");
  });

  it("maps findings to real NIST controls in compliance_status", () => {
    const d = buildSnapshotReportData(CUI_TEXT, { now });
    const keys = Object.keys(d.compliance_status);
    expect(keys.some((k) => /^[A-Z]{2}\.L2-3\.\d+\.\d+$/.test(k))).toBe(true);
  });

  it("records the measured local scan time", () => {
    const d = buildSnapshotReportData(CUI_TEXT, { now, scanMs: 4.7 });
    expect(d.summary.avg_processing_time_ms).toBe(5);
  });

  it("uses the provided organization or an honest preview default", () => {
    expect(buildSnapshotReportData(CUI_TEXT, { now, organization: "Acme" }).organization).toBe("Acme");
    expect(buildSnapshotReportData(CUI_TEXT, { now }).organization).toContain("preview");
  });

  it("block_events carry no raw content", () => {
    const d = buildSnapshotReportData(PII_SECRET_TEXT, { now });
    const serialized = JSON.stringify(d.block_events);
    expect(serialized).not.toContain("123-45-6789");
    expect(serialized).not.toContain("AKIA1234567890ABCD12");
  });
});

describe("summarizeFindings", () => {
  it("rolls up severity counts, controls and SPRS exposure", () => {
    const findings = scanForSnapshot(`${CUI_TEXT}\n\n${PII_SECRET_TEXT}`);
    const s = summarizeFindings(findings);
    expect(s.criticalCount).toBeGreaterThan(0);
    expect(s.controls.length).toBeGreaterThan(0);
    expect(s.estimatedSprsImpact).toBeLessThanOrEqual(0);
    expect(s.totalMatches).toBeGreaterThanOrEqual(findings.length);
  });

  it("is empty-safe", () => {
    const s = summarizeFindings([]);
    expect(s.criticalCount).toBe(0);
    expect(s.controls).toEqual([]);
    expect(s.estimatedSprsImpact).toBe(0);
  });
});
