import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
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

/**
 * The sample PDF's dates must track real time, not build time.
 *
 * `app/api/reports/sample/route.ts` declared `dynamic = "force-static"`, so the
 * handler was evaluated once per deployment and `buildSampleReportData()`'s
 * `now` froze to the build clock. A prospect downloading the artifact months
 * later got a "14-day window" ending on the day we last merged to main — on an
 * evidence product sold to buyers who verify things, that is the first thing a
 * careful assessor notices.
 *
 * These lock the route configuration rather than the rendered bytes: the bug
 * was never in the generator (which already takes an injectable `now`), it was
 * in how often the route was allowed to call it.
 */
describe("sample report freshness", () => {
  /*
   * Comments are stripped first. The route's own header explains the defect by
   * quoting the string it no longer sets, and a guard that reads its own
   * explanation as a violation is the failure mode `tasks/lessons.md` records
   * six times: six guards in this repo have flagged their own prose.
   */
  const routeSource = readFileSync(
    join(__dirname, "..", "..", "..", "app", "api", "reports", "sample", "route.ts"),
    "utf8",
  )
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");

  it("does not pin the route to build-time evaluation", () => {
    expect(routeSource).not.toContain('"force-static"');
  });

  it("pins the Node runtime, because the generator returns a Buffer", () => {
    // An edge promotion would fail at runtime rather than at build.
    expect(routeSource).toContain('runtime = "nodejs"');
  });

  it("caches at the shared CDN, not in the visitor's browser", () => {
    // A privately cached copy would keep showing one prospect the same dated
    // artifact across visits — the same defect, one hop closer to them.
    expect(routeSource).toContain("s-maxage=86400");
    expect(routeSource).toContain("max-age=0");
  });

  it("derives its window from the injected clock, so a fresh call moves it", () => {
    const early = buildSampleReportData(new Date("2026-01-15T00:00:00.000Z"));
    const later = buildSampleReportData(new Date("2026-09-02T00:00:00.000Z"));

    expect(early.summary.period.end).not.toBe(later.summary.period.end);
    expect(later.generated_at).toBe("2026-09-02T00:00:00.000Z");
  });
});
