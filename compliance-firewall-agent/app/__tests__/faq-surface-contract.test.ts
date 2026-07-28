import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * FAQ surface contract.
 *
 * 1. Any page that emits FAQPage JSON-LD must also render the shared visible
 *    FAQ UI (FaqSection / FaqAccordion) — Google ignores FAQPage markup whose
 *    Q&A is not visible on the page, and a hidden-schema page is an AEO
 *    honesty violation. (/controls/[slug] is the one documented exception:
 *    its three schema questions are answered in visible prose sections.)
 *
 * 2. The core marketing pages must each carry a FAQ — the founder-approved
 *    2026-07-14 sweep put one on every page; a redesign that drops one
 *    should fail loudly here, not ship silently.
 */

const APP_DIR = join(__dirname, "..");

function pageFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) pageFiles(full, acc);
    else if (entry === "page.tsx") acc.push(full);
  }
  return acc;
}

const emitsFaqSchema = (src: string) =>
  src.includes("faqPageSchema(") || src.includes('"FAQPage"');

const rendersVisibleFaq = (src: string) =>
  src.includes("<FaqSection") || src.includes("<FaqAccordion");

// Prose-parity exception: the control pages answer their schema questions in
// visible article sections rather than an accordion.
const PROSE_PARITY_EXCEPTIONS = [join("controls", "[slug]", "page.tsx")];

// The /faq hub is the one deliberate variant: FaqHub renders grouped,
// searchable accordions and emits NO FAQPage JSON-LD, because every Q&A it
// lists already carries that schema on its own page. Duplicating it there
// would be the dup Google penalises.
const SHARED_SURFACE_EXCEPTIONS = [join("faq", "page.tsx")];

describe("FAQ surface contract", () => {
  const pages = pageFiles(APP_DIR);

  it("every page emitting FAQPage JSON-LD renders the shared visible FAQ UI", () => {
    const violations: string[] = [];
    for (const file of pages) {
      const src = readFileSync(file, "utf8");
      if (!emitsFaqSchema(src)) continue;
      if (PROSE_PARITY_EXCEPTIONS.some((ex) => file.endsWith(ex))) continue;
      if (!rendersVisibleFaq(src)) violations.push(file.replace(APP_DIR, "app"));
    }
    expect(violations, `FAQPage schema without visible FAQ UI: ${violations.join(", ")}`).toEqual([]);
  });

  it("core marketing pages each carry a visible FAQ", () => {
    const required = [
      "page.tsx", // homepage
      join("pricing", "page.tsx"),
      join("features", "page.tsx"),
      join("how-it-works", "page.tsx"),
      join("contact", "page.tsx"),
      join("assessment", "page.tsx"),
      join("hipaa", "page.tsx"),
      join("brain-ai", "page.tsx"),
    ];
    for (const rel of required) {
      const src = readFileSync(join(APP_DIR, rel), "utf8");
      expect(rendersVisibleFaq(src), `missing visible FAQ: app/${rel}`).toBe(true);
    }
  });

  it("every page renders FAQs through the shared FaqSection, not a bare accordion", () => {
    // The founder asked for "this style of the FAQs everywhere" after seeing
    // /contact. Three pages (answers/[slug], products/[industry], partners/kit)
    // still hand-rolled a heading around a bare <FaqAccordion> — and two of
    // them hand-rolled their own FAQPage JSON-LD beside it, free to drift out
    // of sync with the visible copy. FaqSection emits heading and schema
    // together, so this asserts the single surface rather than the look.
    const violations: string[] = [];
    for (const file of pages) {
      if (SHARED_SURFACE_EXCEPTIONS.some((ex) => file.endsWith(ex))) continue;
      const src = readFileSync(file, "utf8");
      if (src.includes("<FaqAccordion")) violations.push(file.replace(APP_DIR, "app"));
    }
    expect(
      violations,
      `renders a bare FaqAccordion instead of FaqSection: ${violations.join(", ")}`,
    ).toEqual([]);
  });

  it("no page hand-rolls FAQPage JSON-LD around the shared surface", () => {
    // FaqSection already emits faqPageSchema(items) from the same array it
    // renders. A page that also builds its own "@type": "FAQPage" script
    // double-publishes the schema and can disagree with what is on screen.
    const violations: string[] = [];
    for (const file of pages) {
      const src = readFileSync(file, "utf8");
      if (!src.includes("<FaqSection")) continue;
      if (src.includes('"FAQPage"')) violations.push(file.replace(APP_DIR, "app"));
    }
    expect(
      violations,
      `duplicate hand-rolled FAQPage schema alongside FaqSection: ${violations.join(", ")}`,
    ).toEqual([]);
  });

  it("the homepage and pricing page both surface the $499 report offer card", () => {
    for (const rel of ["page.tsx", join("pricing", "page.tsx")]) {
      const src = readFileSync(join(APP_DIR, rel), "utf8");
      expect(src.includes("<ReportOfferCard"), `missing ReportOfferCard: app/${rel}`).toBe(true);
    }
  });
});
