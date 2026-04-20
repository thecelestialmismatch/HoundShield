import { queryBrain, updateBrain, getBrainSummary } from "../index";
import type { KnowledgeFact } from "../types";

describe("queryBrain", () => {
  it("returns relevant facts for a CMMC question", () => {
    const result = queryBrain("What are the CMMC Level 2 requirements?");
    expect(result.facts.length).toBeGreaterThan(0);
    expect(result.domain).toBe("cmmc-l2");
    expect(result.confidence).toMatch(/^(high|medium|low)$/);
    expect(result.sources.length).toBeGreaterThan(0);
  });

  it("returns relevant facts for a HIPAA question", () => {
    const result = queryBrain("What are the 18 PHI identifiers under HIPAA safe harbor?");
    expect(result.facts.length).toBeGreaterThan(0);
    expect(result.domain).toBe("hipaa");
  });

  it("returns relevant facts for a competitor question", () => {
    const result = queryBrain("Why can't Nightfall be used for CMMC compliance?");
    expect(result.facts.length).toBeGreaterThan(0);
    expect(result.answer).toContain("cloud");
  });

  it("returns low confidence and empty facts for unrecognized question", () => {
    const result = queryBrain("xyz xyz xyz xyz irrelevant question about nothing");
    expect(result.confidence).toBe("low");
    expect(result.facts).toHaveLength(0);
  });

  it("answer string contains claim text", () => {
    const result = queryBrain("SPRS score range");
    expect(result.answer).toContain("110");
  });
});

describe("updateBrain", () => {
  const newFact: KnowledgeFact = {
    claim: "CMMC Level 3 requires all NIST 800-172 enhanced controls.",
    evidence: "DoD CMMC 2.0 Level 3 documentation",
    confidence: "high",
    source: "https://www.acq.osd.mil/cmmc/",
    tags: ["cmmc", "level-3", "nist", "800-172"],
  };

  it("adds a fact to an existing domain", () => {
    const before = getBrainSummary();
    const beforeCount = before.domains.find((d) => d.id === "cmmc-l2")?.factCount ?? 0;

    updateBrain("cmmc-l2", newFact);

    const after = getBrainSummary();
    const afterCount = after.domains.find((d) => d.id === "cmmc-l2")?.factCount ?? 0;
    expect(afterCount).toBe(beforeCount + 1);
  });

  it("new fact is queryable after update", () => {
    updateBrain("cmmc-l2", {
      claim: "Unique marker fact XZY99 for test verification",
      evidence: "test",
      confidence: "high",
      source: "test",
      tags: ["xzy99", "marker", "test"],
    });
    const result = queryBrain("XZY99 marker");
    expect(result.facts.some((f) => f.tags.includes("xzy99"))).toBe(true);
  });

  it("throws on unknown domain", () => {
    expect(() => updateBrain("does-not-exist", newFact)).toThrow("does-not-exist");
  });
});

describe("getBrainSummary", () => {
  it("returns 5 domains", () => {
    const summary = getBrainSummary();
    expect(summary.domains.length).toBe(5);
  });

  it("totalFacts is sum of all domain factCounts", () => {
    const summary = getBrainSummary();
    const sum = summary.domains.reduce((acc, d) => acc + d.factCount, 0);
    expect(summary.totalFacts).toBe(sum);
  });

  it("lastUpdated is a valid date string", () => {
    const summary = getBrainSummary();
    expect(summary.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
