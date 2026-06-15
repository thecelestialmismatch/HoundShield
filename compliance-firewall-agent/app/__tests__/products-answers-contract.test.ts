import { INDUSTRIES, INDUSTRY_SLUGS, getIndustry } from "../products/_industries";
import { ANSWERS, ANSWER_SLUGS, getAnswer } from "../answers/_answers";

/**
 * Contract tests for the Direction-A marketing surface. These guard the AEO +
 * navigation coherence that the build alone can't catch: unique slugs, complete
 * content for every page, FAQ presence (FAQPage schema requires it), an
 * answer-first lede, and the six industries the NavV3 mega-menu links to.
 */

const EXPECTED_INDUSTRIES = [
  "technology",
  "healthcare",
  "defense",
  "legal",
  "global",
  "government",
];

describe("industry product pages", () => {
  it("expose exactly the six industries the NavV3 mega-menu links to", () => {
    expect([...INDUSTRY_SLUGS].sort()).toEqual([...EXPECTED_INDUSTRIES].sort());
  });

  it("have unique slugs", () => {
    expect(new Set(INDUSTRY_SLUGS).size).toBe(INDUSTRIES.length);
  });

  it.each(INDUSTRIES.map((i) => [i.slug, i] as const))(
    "%s has complete, snippet-ready content",
    (_slug, ind) => {
      expect(ind.h1.length).toBeGreaterThan(10);
      expect(ind.sub.length).toBeGreaterThan(40); // answer-first lede
      expect(ind.metaTitle.length).toBeLessThanOrEqual(70);
      expect(ind.detects.length).toBeGreaterThanOrEqual(4);
      expect(ind.steps.length).toBeGreaterThanOrEqual(3);
      expect(ind.framework.length).toBeGreaterThanOrEqual(3);
      expect(ind.faqs.length).toBeGreaterThanOrEqual(3); // FAQPage schema needs entries
      ind.faqs.forEach((f) => {
        expect(f.q.length).toBeGreaterThan(5);
        expect(f.a.length).toBeGreaterThan(20);
      });
    }
  );

  it("never overstate FedRAMP — government keeps it on the roadmap", () => {
    const gov = getIndustry("government");
    expect(gov).toBeDefined();
    const fedramp = gov!.framework.find((r) => /fedramp/i.test(r.control));
    expect(fedramp?.status).toBe("Roadmap");
  });

  it("resolves a known slug and rejects an unknown one", () => {
    expect(getIndustry("defense")?.navLabel).toBe("Defense");
    expect(getIndustry("nope")).toBeUndefined();
  });
});

describe("AEO answer pages", () => {
  it("include the seeded high-intent queries", () => {
    expect(ANSWER_SLUGS).toContain("can-defense-contractors-use-chatgpt");
    expect(ANSWER_SLUGS).toContain("dfars-7012-ai-tools");
    expect(ANSWER_SLUGS).toContain("houndshield-vs-nightfall-cmmc");
  });

  it("have unique slugs", () => {
    expect(new Set(ANSWER_SLUGS).size).toBe(ANSWERS.length);
  });

  it.each(ANSWERS.map((a) => [a.slug, a] as const))(
    "%s leads with a complete answer and carries FAQ schema content",
    (_slug, ans) => {
      // Answer-first lede: a real, complete answer (not a teaser).
      const words = ans.lede.trim().split(/\s+/).length;
      expect(words).toBeGreaterThanOrEqual(25);
      expect(ans.h1.length).toBeGreaterThan(10);
      expect(ans.sections.length).toBeGreaterThanOrEqual(2);
      expect(ans.faqs.length).toBeGreaterThanOrEqual(3);
    }
  );

  it("resolves a known slug and rejects an unknown one", () => {
    expect(getAnswer("dfars-7012-ai-tools")).toBeDefined();
    expect(getAnswer("nope")).toBeUndefined();
  });
});
