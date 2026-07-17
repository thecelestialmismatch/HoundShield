import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  faqHubGroups,
  faqSlug,
  homeFaqs,
  pricingFaqs,
  reportFaqs,
  contactFaqs,
  hipaaFaqs,
  howItWorksFaqs,
  installFaqs,
  featuresFaqs,
  brainAiFaqs,
} from "@/lib/seo/faqs";

/**
 * /faq consolidated hub contract.
 *
 * The hub aggregates every page's FAQ dataset into one searchable, category-
 * navigable, deep-linkable surface. Two things it MUST get right:
 *
 *  1. Coverage + integrity — every dataset is represented exactly once, group
 *     ids are unique/stable (they are jump-nav anchors), and no two questions
 *     collide on their deep-link slug.
 *
 *  2. NO second FAQPage schema. Each Q&A already emits FAQPage JSON-LD on its
 *     origin page; re-emitting it on /faq would duplicate structured data
 *     across URLs (a silent SEO regression). The hub earns its value from UX
 *     and internal linking, not a competing schema.
 */

const PAGE = readFileSync(join(__dirname, "..", "faq", "page.tsx"), "utf8");

describe("/faq hub page wiring", () => {
  it("renders the searchable hub, the offer card, and the shared chrome", () => {
    expect(PAGE).toContain("<FaqHub");
    expect(PAGE).toContain("faqHubGroups");
    expect(PAGE).toContain("<ReportOfferCard");
    expect(PAGE).toContain("<NavV3");
    expect(PAGE).toContain("<FooterV3");
  });

  it("emits NO FAQPage structured data (avoids cross-URL duplication)", () => {
    expect(PAGE).not.toContain("faqPageSchema");
    expect(PAGE).not.toContain('"FAQPage"');
    // FaqSection auto-emits FAQPage schema — the hub must use the bare
    // accordion via FaqHub instead.
    expect(PAGE).not.toContain("<FaqSection");
  });
});

describe("faqHubGroups", () => {
  it("has unique, stable, url-safe group ids", () => {
    const ids = faqHubGroups.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
  });

  it("gives every group a title, a blurb, and at least one question", () => {
    for (const g of faqHubGroups) {
      expect(g.title.trim().length, `no title: ${g.id}`).toBeGreaterThan(0);
      expect(g.blurb.trim().length, `no blurb: ${g.id}`).toBeGreaterThan(0);
      expect(g.items.length, `empty group: ${g.id}`).toBeGreaterThan(0);
    }
  });

  it("covers every page FAQ dataset (nothing orphaned from the hub)", () => {
    const hubQuestions = new Set(faqHubGroups.flatMap((g) => g.items.map((i) => i.question)));
    const datasets = {
      homeFaqs,
      pricingFaqs,
      reportFaqs,
      contactFaqs,
      hipaaFaqs,
      howItWorksFaqs,
      installFaqs,
      featuresFaqs,
      brainAiFaqs,
    };
    for (const [name, set] of Object.entries(datasets)) {
      for (const item of set) {
        expect(hubQuestions.has(item.question), `hub is missing ${name}: ${item.question}`).toBe(
          true,
        );
      }
    }
  });

  it("does not duplicate a question across groups", () => {
    const all = faqHubGroups.flatMap((g) => g.items.map((i) => i.question.toLowerCase()));
    expect(new Set(all).size).toBe(all.length);
  });

  it("assigns a unique deep-link slug to every hub answer", () => {
    const slugs = faqHubGroups.flatMap((g) => g.items.map((i) => faqSlug(i.question)));
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
