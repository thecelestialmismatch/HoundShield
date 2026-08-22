import { describe, it, expect } from "vitest";
import { SAMPLE_SCENARIOS, sampleForAudience } from "../samples";
import { scanForSnapshot, summarizeFindings } from "@/lib/reports/snapshot-from-scan";
import { CATEGORY_NIST_MAP, CATEGORY_REMEDIATION } from "@/lib/reports/category-nist-map";

/* ──────────────────────────────────────────────────────────────────
 * A sample that finds nothing teaches the visitor the product does nothing.
 *
 * These four scenarios are the first thing most people click on /demo, and
 * three of them are named by name in cold outreach emails. Their coverage is
 * therefore a product property, not a fixture detail: if a pattern is renamed,
 * retuned or removed and a scenario stops tripping the engine, the demo quietly
 * becomes a demonstration of nothing.
 *
 * Two of the originals were dropped for exactly this reason. The old "Network
 * Scan" sample leaned on internal-IP and `password=` patterns that the canned
 * demo scanner had and the REAL engine does not, so against the shipped engine
 * it produced a single finding. It was replaced with a legal/M&A scenario,
 * measured at four.
 * ────────────────────────────────────────────────────────────────── */

describe("every sample scenario trips the real engine", () => {
  it.each(SAMPLE_SCENARIOS.map((s) => [s.name, s.text] as const))(
    '"%s" produces findings',
    (name, text) => {
      const findings = scanForSnapshot(text);
      expect(
        findings.length,
        `"${name}" matched no pattern — the demo would show an empty result`,
      ).toBeGreaterThan(0);
    },
  );

  it.each(SAMPLE_SCENARIOS.map((s) => [s.name, s.text] as const))(
    '"%s" produces at least one CRITICAL or HIGH finding',
    (name, text) => {
      const s = summarizeFindings(scanForSnapshot(text));
      expect(
        s.criticalCount + s.highCount,
        `"${name}" found only low-severity items — an unconvincing demo`,
      ).toBeGreaterThan(0);
    },
  );

  it.each(SAMPLE_SCENARIOS.map((s) => [s.name, s.text] as const))(
    '"%s" maps to at least one NIST control with remediation to show',
    (name, text) => {
      const findings = scanForSnapshot(text);
      const s = summarizeFindings(findings);
      expect(s.controls.length, `"${name}" maps to no NIST control`).toBeGreaterThan(0);
      // Every finding's category must have both a control and remediation copy,
      // or the expandable "How to fix" panel renders blank.
      for (const f of findings) {
        expect(CATEGORY_NIST_MAP[f.category], `no control for ${f.category}`).toBeTruthy();
        const fix = CATEGORY_REMEDIATION[f.category];
        expect(fix, `no remediation for ${f.category}`).toBeTruthy();
        expect(fix.impact.length).toBeGreaterThan(20);
        expect(fix.quickFix.length).toBeGreaterThan(20);
        expect(fix.permanentFix.length).toBeGreaterThan(20);
      }
    },
  );

  it("covers all three industries the selector offers", () => {
    const verticals = new Set(SAMPLE_SCENARIOS.map((s) => s.vertical));
    for (const v of ["defense", "healthcare", "legal"]) {
      expect(verticals, `no sample scenario for the "${v}" industry`).toContain(v);
    }
  });

  it("resolves a distinct scenario for every outreach audience", () => {
    const names = (["defense", "healthcare", "legal", "technical"] as const).map(
      sampleForAudience,
    );
    expect(new Set(names).size, `audiences collapse onto one scenario: ${names}`).toBe(
      names.length,
    );
  });

  it("throws loudly for an audience with no scenario, rather than returning undefined", () => {
    // A silent undefined would render `Click "undefined"` into a cold email.
    // @ts-expect-error deliberately invalid audience
    expect(() => sampleForAudience("nonexistent")).toThrow();
  });

  it("contains no real-looking credential a scanner would flag as a live leak", () => {
    // The AWS key is AWS's own published documentation example, and the SSN and
    // card number are reserved test values. Assert the well-known markers stay,
    // so nobody "improves realism" by pasting something genuine into a file
    // that ships to the browser.
    const all = SAMPLE_SCENARIOS.map((s) => s.text).join("\n");
    expect(all).toContain("AKIAIOSFODNN7EXAMPLE");
    expect(all).toContain("123-45-6789");
  });
});
