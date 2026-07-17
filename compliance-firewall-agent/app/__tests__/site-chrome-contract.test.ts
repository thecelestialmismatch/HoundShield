import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

/**
 * Site chrome contract — one nav, one cream footer, one font system.
 *
 * 1. Fonts: app/fonts.ts exposes --font-body / --font-display. Tailwind's
 *    font-sans / font-display MUST reference those exact variables — an
 *    undefined var() invalidates the whole font-family declaration and every
 *    `font-sans` page silently renders in the browser default (Times).
 *    That shipped (contact page in Times, founder screenshot 2026-07-03).
 *
 * 2. Footers: every routable public marketing/content/legal page renders
 *    <FooterV3 /> (the cream hermes footer). /privacy and /terms shipped
 *    without any footer once — this pins the full set.
 */

const CFA_ROOT = path.resolve(__dirname, "../..");
const read = (rel: string) => readFileSync(path.join(CFA_ROOT, rel), "utf8");

describe("font system wiring", () => {
  it("fonts.ts defines the variables tailwind consumes", () => {
    const fonts = read("app/fonts.ts");
    expect(fonts).toContain("'--font-display'");
    expect(fonts).toContain("'--font-body'");
  });

  it("tailwind font-sans/display reference ONLY variables fonts.ts defines", () => {
    const tw = read("tailwind.config.js");
    const fontBlock = tw.match(/fontFamily:\s*\{[\s\S]*?\n\s*\}/)?.[0] ?? "";
    // Every var(--font-*) used in the tailwind font stacks must exist in fonts.ts.
    const used = [...fontBlock.matchAll(/var\((--font-[a-z-]+)\)/g)].map((m) => m[1]);
    expect(used.length).toBeGreaterThan(0);
    const defined = new Set(
      [...read("app/fonts.ts").matchAll(/variable:\s*'(--font-[a-z-]+)'/g)].map((m) => m[1]),
    );
    const undefinedVars = used.filter((v) => !defined.has(v));
    expect(undefinedVars).toEqual([]);
  });
});

describe("every public page ends in the cream FooterV3", () => {
  const PUBLIC_PAGES = [
    "app/page.tsx",
    "app/features/page.tsx",
    "app/how-it-works/page.tsx",
    "app/faq/page.tsx",
    "app/pricing/page.tsx",
    "app/partners/page.tsx",
    "app/hipaa/page.tsx",
    "app/security/page.tsx",
    "app/trust/page.tsx",
    "app/brain-ai/page.tsx",
    "app/assessment/page.tsx",
    "app/about/page.tsx",
    "app/docs/page.tsx",
    "app/demo/page.tsx",
    "app/agents/page.tsx",
    "app/roadmap/page.tsx",
    "app/changelog/page.tsx",
    "app/contact/page.tsx",
    "app/blog/page.tsx",
    "app/status/page.tsx",
    "app/products/[industry]/page.tsx",
    "app/answers/[slug]/page.tsx",
    "app/report/thank-you/page.tsx",
    // Legal set — shipped once with NO footer; never again.
    "app/privacy/page.tsx",
    "app/terms/page.tsx",
    "app/dpa/page.tsx",
    "app/acceptable-use/page.tsx",
  ];

  it("renders <FooterV3 /> on every page in the public set", () => {
    const missing = PUBLIC_PAGES.filter((p) => !read(p).includes("<FooterV3"));
    expect(missing).toEqual([]);
  });

  it("no page hand-rolls a second footer implementation", () => {
    // The dead LandingFooter (dark bg, white logo, Security→/terms bug) was
    // deleted; nothing may import it or reintroduce one.
    const offenders = PUBLIC_PAGES.filter((p) => /LandingFooter/.test(read(p)));
    expect(offenders).toEqual([]);
  });
});
