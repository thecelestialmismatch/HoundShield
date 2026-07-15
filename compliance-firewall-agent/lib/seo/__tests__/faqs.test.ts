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

describe("installSteps", () => {
  it("provides ordered, complete steps for HowTo schema", () => {
    expect(installSteps.length).toBeGreaterThanOrEqual(3);
    for (const step of installSteps) {
      expect(step.name.trim().length).toBeGreaterThan(0);
      expect(step.text.trim().length).toBeGreaterThan(0);
    }
  });
});
