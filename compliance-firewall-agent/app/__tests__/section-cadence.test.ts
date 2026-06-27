import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

/**
 * Section-colour cadence guard. The brief was "every section a distinct colour
 * from the hero, not one flat background." A page satisfies the cadence if it
 * either opts into auto-striping (`section-stripe`) or hand-tints with at least
 * two distinct surface tones (steel/cream/navy beyond the default white). This
 * stops a marketing page from regressing to a single flat background.
 */

const ROOT = path.resolve(__dirname, "..", "..");
const MARKETING_PAGES = [
  "app/page.tsx",
  "app/pricing/page.tsx",
  "app/features/page.tsx",
  "app/how-it-works/page.tsx",
  "app/about/page.tsx",
  "app/hipaa/page.tsx",
  "app/security/page.tsx",
  "app/trust/page.tsx",
  "app/partners/page.tsx",
];

function tones(src: string): Set<string> {
  return new Set(src.match(/hs-surface-[0-3]|hs-navy/g) ?? []);
}

describe("marketing pages have visible section cadence", () => {
  for (const rel of MARKETING_PAGES) {
    it(`${rel} is not a single flat background`, () => {
      const src = readFileSync(path.join(ROOT, rel), "utf8");
      const striped = src.includes("section-stripe");
      const distinctTones = tones(src).size;
      expect(
        striped || distinctTones >= 2,
        `${rel} looks monotone — add section-stripe or ≥2 surface tones`,
      ).toBe(true);
    });
  }
});
