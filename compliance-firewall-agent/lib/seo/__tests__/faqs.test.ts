import { describe, it, expect } from "vitest";
import {
  hipaaFaqs,
  pricingFaqs,
  featuresFaqs,
  howItWorksFaqs,
  brainAiFaqs,
  installFaqs,
  homeFaqs,
  reportFaqs,
  contactFaqs,
  installSteps,
  faqSlug,
  type FaqItem,
} from "../faqs";

const ALL_SETS: Record<string, FaqItem[]> = {
  hipaaFaqs,
  pricingFaqs,
  featuresFaqs,
  howItWorksFaqs,
  brainAiFaqs,
  installFaqs,
  homeFaqs,
  reportFaqs,
  contactFaqs,
};

const wordCount = (s: string) => s.trim().split(/\s+/).length;

describe("AEO FAQ datasets", () => {
  for (const [name, set] of Object.entries(ALL_SETS)) {
    describe(name, () => {
      it("is non-empty", () => {
        expect(set.length).toBeGreaterThan(0);
      });

      it("phrases every question as a real, PAA-style question", () => {
        for (const item of set) {
          expect(item.question.trim().endsWith("?"), `not a question: ${item.question}`).toBe(true);
          expect(wordCount(item.question)).toBeLessThanOrEqual(14);
        }
      });

      it("keeps answers in the snippet-optimal range", () => {
        for (const item of set) {
          const words = wordCount(item.answer);
          // Featured-snippet sweet spot is ~40-60 words; allow margin for
          // legitimately longer enumerations (e.g. the 18 HIPAA identifiers).
          expect(words, `too short: ${item.question} (${words}w)`).toBeGreaterThanOrEqual(25);
          expect(words, `too long: ${item.question} (${words}w)`).toBeLessThanOrEqual(85);
        }
      });

      it("leads each answer with a direct, complete sentence", () => {
        for (const item of set) {
          expect(item.answer.trim().length).toBeGreaterThan(0);
          // No filler preamble — answers should not open with hedging.
          expect(/^(in today'?s|when it comes to|there are many)/i.test(item.answer)).toBe(false);
        }
      });

      it("has unique questions within the set", () => {
        const questions = set.map((i) => i.question.toLowerCase());
        expect(new Set(questions).size).toBe(questions.length);
      });
    });
  }

  it("uses distinct questions across pages (no cross-URL FAQ duplication)", () => {
    const all = Object.values(ALL_SETS)
      .flat()
      .map((i) => i.question.toLowerCase());
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("FAQ answer links (actionable 'learn more' chips)", () => {
  const all = Object.values(ALL_SETS).flat();

  it("every link has a non-empty label and a site-internal href", () => {
    for (const item of all) {
      for (const link of item.links ?? []) {
        expect(link.label.trim().length, `empty label under: ${item.question}`).toBeGreaterThan(0);
        expect(
          link.href.startsWith("/"),
          `external/relative href "${link.href}" under: ${item.question}`,
        ).toBe(true);
      }
    }
  });

  it("does NOT put link markup in the answer text (snippet purity)", () => {
    for (const item of all) {
      expect(/https?:\/\/|<a\s|\]\(/.test(item.answer), `link in answer: ${item.question}`).toBe(
        false,
      );
    }
  });

  it("links never point a page's FAQ back at its own page (no self-links)", () => {
    // Each dataset lives on one page; a chip that links to that same page is
    // dead weight. This pins the intended cross-linking.
    const HOME: Record<string, string> = {
      hipaaFaqs: "/hipaa",
      pricingFaqs: "/pricing",
      featuresFaqs: "/features",
      brainAiFaqs: "/brain-ai",
      reportFaqs: "/assessment",
      homeFaqs: "/",
    };
    for (const [name, set] of Object.entries(ALL_SETS)) {
      const own = HOME[name];
      if (!own) continue;
      for (const item of set) {
        for (const link of item.links ?? []) {
          expect(link.href, `self-link on ${name}: ${item.question}`).not.toBe(own);
        }
      }
    }
  });
});

describe("faqSlug (deep-link anchors)", () => {
  const allQuestions = Object.values(ALL_SETS)
    .flat()
    .map((i) => i.question);

  it("produces url-safe, faq-prefixed slugs", () => {
    for (const q of allQuestions) {
      const slug = faqSlug(q);
      expect(slug, `bad slug for: ${q}`).toMatch(/^faq-[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(slug.length).toBeLessThanOrEqual(64);
    }
  });

  it("is deterministic", () => {
    for (const q of allQuestions) {
      expect(faqSlug(q)).toBe(faqSlug(q));
    }
  });

  it("is unique across every question on the site (no deep-link collisions)", () => {
    const slugs = allQuestions.map(faqSlug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("installSteps", () => {
  it("provides ordered, complete steps for HowTo schema", () => {
    expect(installSteps.length).toBeGreaterThanOrEqual(3);
    for (const step of installSteps) {
      expect(step.name.trim().length).toBeGreaterThan(0);
      expect(step.text.trim().length).toBeGreaterThan(0);
    }
  });
});
