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

  it("the homepage and pricing page both surface the $499 report offer card", () => {
    for (const rel of ["page.tsx", join("pricing", "page.tsx")]) {
      const src = readFileSync(join(APP_DIR, rel), "utf8");
      expect(src.includes("<ReportOfferCard"), `missing ReportOfferCard: app/${rel}`).toBe(true);
    }
  });
});
