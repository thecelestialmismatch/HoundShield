import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  COMPARISONS,
  COMPARISON_SLUGS,
  getComparison,
  CORE_MOAT,
  type Advantage,
} from "../competitors";

/**
 * Guards the /compare hub's editorial contract (see competitors.ts header):
 *  - honest (competitors get credit, not swept),
 *  - on-mission ($499 report, local-scan moat),
 *  - never violates the CLAUDE.md NEVER-DO list (no "hosted = CUI-safe").
 */

const VALID_ADVANTAGES: Advantage[] = ["houndshield", "competitor", "even"];

describe("comparison data integrity", () => {
  it("has comparisons with unique kebab-case slugs", () => {
    expect(COMPARISONS.length).toBeGreaterThanOrEqual(4);
    const slugs = COMPARISONS.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("exposes COMPARISON_SLUGS matching the data", () => {
    expect(COMPARISON_SLUGS.sort()).toEqual(COMPARISONS.map((c) => c.slug).sort());
  });

  it("getComparison resolves known slugs and rejects unknown", () => {
    expect(getComparison(COMPARISONS[0].slug)?.slug).toBe(COMPARISONS[0].slug);
    expect(getComparison("does-not-exist")).toBeUndefined();
  });

  it("each comparison has complete, SEO-grade metadata", () => {
    for (const c of COMPARISONS) {
      expect(c.metaTitle).toMatch(/houndshield/i);
      expect(c.metaTitle.length).toBeGreaterThan(20);
      // Meta descriptions must be substantial for search snippets.
      expect(c.metaDescription.length).toBeGreaterThan(80);
      expect(c.metaDescription.length).toBeLessThan(320);
      expect(c.summary.length).toBeGreaterThan(40);
      expect(c.competitor.length).toBeGreaterThan(0);
      expect(c.competitorShort.length).toBeGreaterThan(0);
    }
  });

  it("matrix rows use only valid advantages", () => {
    for (const c of COMPARISONS) {
      expect(c.matrix.length).toBeGreaterThanOrEqual(4);
      for (const row of c.matrix) {
        expect(VALID_ADVANTAGES).toContain(row.advantage);
        expect(row.dimension.length).toBeGreaterThan(0);
        expect(row.houndshield.length).toBeGreaterThan(0);
        expect(row.competitor.length).toBeGreaterThan(0);
      }
    }
  });

  it("is HONEST — every comparison credits the competitor somewhere", () => {
    // A page that sweeps every row for HoundShield reads as spin and loses trust.
    // Each comparison must concede at least one row AND list real strengths.
    for (const c of COMPARISONS) {
      const concedes = c.matrix.some((r) => r.advantage === "competitor");
      expect(concedes, `${c.slug} must concede at least one matrix row`).toBe(true);
      expect(c.theirStrengths.length, `${c.slug} must list competitor strengths`).toBeGreaterThanOrEqual(2);
      expect(c.chooseThemWhen.length, `${c.slug} must say when to pick them`).toBeGreaterThanOrEqual(1);
    }
  });

  it("each comparison has edge points, buyer fit, and snippet-ready FAQs", () => {
    for (const c of COMPARISONS) {
      expect(c.ourEdge.length).toBeGreaterThanOrEqual(2);
      expect(c.buyerFit.length).toBeGreaterThan(20);
      expect(c.faqs.length).toBeGreaterThanOrEqual(1);
      for (const f of c.faqs) {
        expect(f.q.trim().endsWith("?")).toBe(true);
        expect(f.a.length).toBeGreaterThan(40);
      }
    }
  });
});

describe("editorial NEVER-DO guardrails", () => {
  const allText = [
    CORE_MOAT,
    ...COMPARISONS.flatMap((c) => [
      c.tagline,
      c.summary,
      c.theirApproach,
      c.metaDescription,
      ...c.ourEdge.map((e) => e.body),
      ...c.faqs.map((f) => f.a),
      ...c.chooseUsWhen,
      ...c.chooseThemWhen,
    ]),
  ].join("\n");

  it("never claims the hosted/Vercel/trial endpoint is CUI-safe", () => {
    // The CUI-safe claim holds ONLY in Mode B. Any pairing of hosted/trial/cloud
    // with a CUI-safe assertion violates the CLAUDE.md NEVER-DO list.
    expect(allText).not.toMatch(/hosted[^.]{0,40}cui[- ]?safe/i);
    expect(allText).not.toMatch(/trial[^.]{0,40}cui[- ]?safe/i);
    expect(allText).not.toMatch(/vercel[^.]{0,40}cui[- ]?safe/i);
  });

  it("anchors on the $499 report (never a sub-$499 price)", () => {
    expect(allText).toMatch(/\$499/);
    expect(allText).not.toMatch(/\$(?:9|9\d|1\d\d|2\d\d|3\d\d|4[0-8]\d)\b.{0,30}report/i);
  });

  it("keeps the local-scan / DFARS 7012 moat as the core claim", () => {
    expect(CORE_MOAT).toMatch(/local/i);
    expect(CORE_MOAT).toMatch(/DFARS 7012/);
    expect(CORE_MOAT).toMatch(/nothing leaves your network/i);
  });
});

describe("compare pages use the approved palette only", () => {
  // CLAUDE.md design rule: public pages use --hs-* tokens; never indigo/emerald/
  // amber/yellow/blue utility classes.
  const files = [
    "app/compare/page.tsx",
    "app/compare/[slug]/page.tsx",
  ].map((p) => readFileSync(resolve(process.cwd(), p), "utf8"));

  it("contains no forbidden color utility classes", () => {
    const forbidden = /\b(?:bg|text|border|from|to|via)-(?:indigo|emerald|amber|yellow|blue|purple|violet)-\d{2,3}\b/;
    for (const src of files) {
      expect(src).not.toMatch(forbidden);
    }
  });
});
