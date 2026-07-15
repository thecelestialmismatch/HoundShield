import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Brand typeface contract — Geist everywhere (founder call, 2026-07-15).
 *
 * The whole app reaches its fonts through the next/font variables loaded in
 * app/fonts.ts (--font-display / --font-body). This guard pins the four
 * places those variables are defined or given fallbacks, so a partial swap
 * (the "design split-brain" failure mode) fails loudly:
 *
 *  - app/fonts.ts must load Geist for BOTH roles, and the old families must
 *    be gone (a leftover Fraunces import silently ships an unused ~80KB font).
 *  - Every fallback stack must be sans — a serif fallback (Georgia/ui-serif)
 *    would flash a serif on slow connections and render one in any context
 *    where the next/font classes are absent (tests, isolated embeds).
 *
 * public/hermes-demo.html and public/_bootstrap.html are byte-for-byte
 * archived design references with their own equality tests — they keep the
 * old families on purpose and are deliberately NOT covered here.
 */

const APP_ROOT = join(__dirname, "..", "..");
const read = (rel: string) => readFileSync(join(APP_ROOT, rel), "utf8");

describe("brand typeface contract (Geist)", () => {
  it("app/fonts.ts loads Geist for both display and body", () => {
    const src = read("app/fonts.ts");
    expect(src).toMatch(/import\s*\{\s*Geist\s*\}\s*from\s*'next\/font\/google'/);
    expect(src).toMatch(/--font-display/);
    expect(src).toMatch(/--font-body/);
    expect(src).not.toMatch(/Fraunces|DM_Sans/);
  });

  it("no live font stack falls back to a serif or the old families", () => {
    const stacks = [
      "app/globals.css",
      "app/hermes.css",
      "tailwind.config.js",
      "components/dashboard/lccStyles.ts",
    ];
    for (const rel of stacks) {
      const src = read(rel);
      // Old family names must be gone from every live stylesheet/config.
      expect(src, `${rel} still references an old font family`).not.toMatch(
        /'Fraunces'|"Fraunces"|'DM Sans'|"DM Sans"/,
      );
      // Serif fallbacks would flash/regress to a serif where next/font
      // classes are absent. (Word-boundary avoids matching sans-serif.)
      expect(src, `${rel} still carries a serif fallback`).not.toMatch(
        /Georgia|ui-serif|'Times New Roman'|\bfont-serif\b/,
      );
    }
  });
});
