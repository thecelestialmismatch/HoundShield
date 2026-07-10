import { describe, it, expect } from "vitest";
import { ALL_CONTROLS, getControlById } from "../../lib/shieldready/controls";
import {
  CONTROL_SLUGS,
  controlSlug,
  getControlBySlug,
  relatedControls,
  aiRelevance,
  aiRelevanceCopy,
  AI_DIRECT,
  AI_SUPPORTING,
  controlMetaTitle,
  controlMetaDescription,
} from "../controls/_meta";

/**
 * Contract for the programmatic /controls surface (playbook Hack 13 done
 * honestly): all 110 pages resolve, each is substantive (never thin doorway
 * content), and the AI-relevance verdicts stay curated and truthful — a
 * page may claim direct AI-monitoring evidence ONLY for the curated set,
 * which itself must consist of real control IDs.
 */

describe("controls pages: slugs and lookup", () => {
  it("generates exactly one page per control (110)", () => {
    expect(ALL_CONTROLS.length).toBe(110);
    expect(CONTROL_SLUGS.length).toBe(110);
    expect(new Set(CONTROL_SLUGS).size).toBe(110);
  });

  it("uses kebab-case slugs that round-trip to the control", () => {
    for (const c of ALL_CONTROLS) {
      const slug = controlSlug(c.id);
      expect(slug).toMatch(/^[a-z]{2}-\d-\d{3}$/);
      expect(getControlBySlug(slug)?.id).toBe(c.id);
    }
    expect(getControlBySlug("not-a-control")).toBeUndefined();
  });
});

describe("controls pages: every page is substantive", () => {
  it.each(ALL_CONTROLS.map((c) => [c.id, c] as const))(
    "%s has complete content for a non-thin page",
    (_id, c) => {
      expect(c.title.length).toBeGreaterThan(5);
      // Some official NIST requirements are legitimately one short sentence
      // (shortest in the dataset: 32 chars) — substance comes from the
      // plain-English and remediation content asserted below.
      expect(c.officialDescription.length).toBeGreaterThan(25);
      expect(c.plainEnglish.length).toBeGreaterThan(80);
      expect(c.assessmentQuestion.length).toBeGreaterThan(40);
      expect(c.remediationSteps.length).toBeGreaterThanOrEqual(3);
      expect(c.evidenceRequired.length).toBeGreaterThanOrEqual(3);
      expect([1, 2]).toContain(c.cmmcLevel);
      expect(c.sprsDeduction).toBeLessThan(0);
    }
  );

  it("meta titles and descriptions are snippet-ready for every control", () => {
    for (const c of ALL_CONTROLS) {
      const title = controlMetaTitle(c);
      expect(title).toContain(c.id);
      expect(title.length).toBeLessThanOrEqual(90);
      const desc = controlMetaDescription(c);
      expect(desc.length).toBeGreaterThan(80);
      expect(desc.length).toBeLessThanOrEqual(300);
    }
  });

  it("related controls stay within the same family and never self-link", () => {
    for (const c of ALL_CONTROLS) {
      for (const r of relatedControls(c)) {
        expect(r.family).toBe(c.family);
        expect(r.id).not.toBe(c.id);
      }
    }
  });
});

describe("controls pages: honest AI-relevance verdicts", () => {
  it("every curated AI-relevant ID is a real control", () => {
    for (const id of [...AI_DIRECT, ...AI_SUPPORTING]) {
      expect(getControlById(id), `curated ID not in dataset: ${id}`).toBeDefined();
    }
  });

  it("direct and supporting sets do not overlap", () => {
    const overlap = AI_DIRECT.filter((id) => AI_SUPPORTING.includes(id));
    expect(overlap).toEqual([]);
  });

  it("most controls honestly say AI monitoring does NOT help", () => {
    const none = ALL_CONTROLS.filter((c) => aiRelevance(c.id) === "none");
    // Honesty check: the vast majority of 800-171 is NOT satisfied by an AI
    // firewall. If this ratio ever collapses, the pages have become spin.
    expect(none.length).toBeGreaterThan(90);
  });

  it("verdict copy matches the verdict — 'no' pages never claim evidence", () => {
    for (const c of ALL_CONTROLS) {
      const { heading, body } = aiRelevanceCopy(c);
      const verdict = aiRelevance(c.id);
      if (verdict === "none") {
        expect(heading).toMatch(/no\./i);
        expect(body).not.toMatch(/concretely evidences|directly/i);
      }
      if (verdict === "direct") {
        expect(heading).toMatch(/yes/i);
        // The CUI-safe claim must carry the Mode B / self-hosted qualifier.
        expect(body).toMatch(/self-hosted|own infrastructure/i);
      }
      expect(body.length).toBeGreaterThan(120);
    }
  });

  it("never pairs hosted/trial with a CUI-safe claim", () => {
    const allCopy = ALL_CONTROLS.map((c) => aiRelevanceCopy(c).body).join("\n");
    expect(allCopy).not.toMatch(/hosted[^.]{0,40}cui[- ]?safe/i);
    expect(allCopy).not.toMatch(/trial[^.]{0,40}cui[- ]?safe/i);
  });
});
