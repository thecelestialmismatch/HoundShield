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

  /*
   * Tailwind components must keep their spacing inside the .hermes shell.
   *
   * hermes.css carries a universal reset:
   *   .hermes *, ::before, ::after { margin: 0; padding: 0; box-sizing: border-box }
   *
   * Tailwind v3 emits no cascade layer, so while that reset was UNLAYERED it sat
   * at specificity (0,1,0) — an exact tie with every `.px-5` / `.mx-auto`
   * utility — and won every tie on source order, because layout.tsx imports
   * globals.css before hermes.css. Every Tailwind component rendered inside
   * .hermes therefore lost all padding and margin: 236 dead utilities on /faq
   * (search input, category pills, all 38 accordion rows) and 36 on /pricing,
   * where the founder reported the FAQ block sitting off-centre. `max-w-*` kept
   * working and masked it — the reset never sets max-width, so boxes were the
   * right width in the wrong place with their contents flattened.
   *
   * The fix puts the reset in a cascade layer. Layered rules lose to ALL
   * unlayered author rules regardless of specificity, so utilities win, while UA
   * defaults still lose to the reset (UA loses to any author rule). Unlayering
   * it again silently restores the whole bug class, so that is what is pinned.
   */
  describe("the .hermes reset does not clobber Tailwind spacing utilities", () => {
    const HERMES_CSS = readFileSync(join(APP_DIR, "hermes.css"), "utf8");
    const FAQ_SECTION = readFileSync(
      join(APP_DIR, "..", "components", "seo", "FaqSection.tsx"),
      "utf8",
    );

    /** The `@layer <name> { ... }` block a rule sits in, or null if unlayered. */
    function layerOf(css: string, selector: string): string | null {
      const at = css.indexOf(selector);
      expect(at, `selector not found in hermes.css: ${selector}`).toBeGreaterThan(-1);
      // Walk backwards counting braces; a net-open `@layer x {` means we are inside it.
      let depth = 0;
      for (let i = at - 1; i >= 0; i--) {
        if (css[i] === "}") depth++;
        else if (css[i] === "{") {
          if (depth === 0) {
            const open = css.lastIndexOf("@layer", i);
            if (open === -1) return null;
            const head = css.slice(open, i).trim();
            return /^@layer\s+[\w-]+$/.test(head) ? head.split(/\s+/)[1] : null;
          }
          depth--;
        }
      }
      return null;
    }

    it("keeps the universal reset inside a cascade layer", () => {
      expect(
        layerOf(HERMES_CSS, ".hermes *,"),
        "the `.hermes *` reset must stay in an @layer — unlayered it outranks every Tailwind spacing utility inside .hermes",
      ).toBe("hermes-reset");
    });

    it("leaves hermes component rules unlayered so they still beat the reset", () => {
      // .container et al must outrank the reset; layering them too would break that.
      for (const sel of [".hermes .container", ".hermes .step "]) {
        expect(layerOf(HERMES_CSS, sel), `${sel} must stay unlayered`).toBeNull();
      }
    });

    it("FaqSection keeps its Tailwind layout classes and its hook class", () => {
      expect(FAQ_SECTION).toMatch(/className=\{`faq-section /);
      for (const util of ["max-w-3xl", "mx-auto", "px-6", "py-20"]) {
        expect(FAQ_SECTION, `FaqSection lost ${util}`).toContain(util);
      }
    });
  });

  it("the homepage and pricing page both surface the $499 report offer card", () => {
    for (const rel of ["page.tsx", join("pricing", "page.tsx")]) {
      const src = readFileSync(join(APP_DIR, rel), "utf8");
      expect(src.includes("<ReportOfferCard"), `missing ReportOfferCard: app/${rel}`).toBe(true);
    }
  });
});
