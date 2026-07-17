import { describe, it, expect } from "vitest";
import type { RuleCategory } from "@/lib/supabase/types";
import {
  CATEGORY_NIST_MAP,
  CATEGORY_LABEL,
  sprsImpactForRisk,
  isDcsaReportable,
  actionLabel,
  blockEventFromFinding,
  type SnapshotFinding,
} from "../category-nist-map";

const ALL_CATEGORIES: RuleCategory[] = ["PII", "FINANCIAL", "STRATEGIC", "IP", "HIPAA_PHI"];

describe("CATEGORY_NIST_MAP", () => {
  it("covers every RuleCategory with a valid NIST 800-171 control id", () => {
    for (const cat of ALL_CATEGORIES) {
      const entry = CATEGORY_NIST_MAP[cat];
      expect(entry).toBeDefined();
      expect(entry.control).toMatch(/^[A-Z]{2}\.L2-3\.\d+\.\d+$/);
      expect(entry.name.length).toBeGreaterThan(5);
    }
  });

  it("has a display label for every category", () => {
    for (const cat of ALL_CATEGORIES) {
      expect(CATEGORY_LABEL[cat]).toBeTruthy();
    }
  });
});

describe("sprsImpactForRisk", () => {
  it("weights criticals hardest and NONE/LOW at zero", () => {
    expect(sprsImpactForRisk("CRITICAL")).toBe(-5);
    expect(sprsImpactForRisk("HIGH")).toBe(-3);
    expect(sprsImpactForRisk("MEDIUM")).toBe(-1);
    expect(sprsImpactForRisk("LOW")).toBe(0);
    expect(sprsImpactForRisk("NONE")).toBe(0);
  });
});

describe("isDcsaReportable", () => {
  it("is true only for CRITICAL CUI/IP exposures", () => {
    expect(isDcsaReportable("IP", "CRITICAL")).toBe(true);
    expect(isDcsaReportable("IP", "HIGH")).toBe(false);
    expect(isDcsaReportable("PII", "CRITICAL")).toBe(false);
    expect(isDcsaReportable("HIPAA_PHI", "CRITICAL")).toBe(false);
  });
});

describe("actionLabel", () => {
  it("maps BLOCK to BLOCKED and everything else to QUARANTINED", () => {
    expect(actionLabel("BLOCK")).toBe("BLOCKED");
    expect(actionLabel("QUARANTINE")).toBe("QUARANTINED");
    expect(actionLabel("WARN")).toBe("QUARANTINED");
    expect(actionLabel("ALLOW")).toBe("QUARANTINED");
  });
});

describe("blockEventFromFinding", () => {
  const finding: SnapshotFinding = {
    patternName: "CUI marking",
    category: "IP",
    risk: "CRITICAL",
    action: "BLOCK",
    count: 2,
  };

  it("produces a valid evidence row from a finding", () => {
    const ev = blockEventFromFinding(finding, "2026-07-18T00:00:00.000Z");
    expect(ev.pattern_name).toBe("CUI marking");
    expect(ev.nist_control).toBe("SC.L2-3.13.1");
    expect(ev.action).toBe("BLOCKED");
    expect(ev.sprs_impact).toBe(-5);
    expect(ev.dcsa_reportable).toBe(true);
  });

  it("never leaks the matched substring — only the pattern name", () => {
    const ev = blockEventFromFinding(finding, "2026-07-18T00:00:00.000Z");
    // The evidence row shape has no field for matched content.
    expect(Object.keys(ev)).not.toContain("match");
    expect(Object.keys(ev)).not.toContain("text");
    expect(JSON.stringify(ev)).not.toContain("count");
  });
});
