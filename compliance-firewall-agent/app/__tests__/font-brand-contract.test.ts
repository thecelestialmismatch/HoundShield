import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Brand typeface contract — Geist + Geist Mono everywhere, all self-hosted
 * (founder call, 2026-07-15).
 *
 * The whole app reaches its fonts through the next/font variables loaded in
 * app/fonts.ts (--font-display / --font-body / --font-mono). This guard pins
 * every place those variables are defined or given fallbacks, so a partial
 * swap (the "design split-brain" failure mode) fails loudly:
 *
 *  - app/fonts.ts must load Geist for both text roles AND Geist Mono for the
 *    metrics/code role; the old families must be gone (a leftover import
 *    silently ships an unused font).
 *  - Every fallback stack must be sans (or mono for the mono role) — a serif
 *    fallback would flash a serif on slow connections and render one wherever
 *    the next/font classes are absent (tests, isolated embeds).
 *  - No stylesheet may fetch fonts from a third-party CDN at runtime. Fonts
 *    self-host via next/font: a fonts.googleapis.com @import leaks every
 *    visitor's IP to Google — indefensible for a zero-data-exfiltration brand
 *    (and the basis of real GDPR rulings).
 *
 * public/hermes-demo.html and public/_bootstrap.html are byte-for-byte
 * archived design references with their own equality tests — they keep the
 * old families and CDN links on purpose and are deliberately NOT covered.
 */

const APP_ROOT = join(__dirname, "..", "..");
const read = (rel: string) => readFileSync(join(APP_ROOT, rel), "utf8");

/** Every live file that defines a font stack or font variable fallback. */
const STACK_FILES = [
  "app/globals.css",
  "app/hermes.css",
  "app/layout.tsx",
  "tailwind.config.js",
  "components/dashboard/lccStyles.ts",
  "components/landing/HeroDemoDashboard.tsx",
];

describe("brand typeface contract (Geist + Geist Mono)", () => {
  it("app/fonts.ts loads Geist (display + body) and Geist Mono", () => {
    const src = read("app/fonts.ts");
    expect(src).toMatch(/import\s*\{\s*Geist\s*,\s*Geist_Mono\s*\}\s*from\s*'next\/font\/google'/);
    expect(src).toMatch(/--font-display/);
    expect(src).toMatch(/--font-body/);
    expect(src).toMatch(/--font-mono/);
    expect(src).not.toMatch(/Fraunces|DM_Sans|JetBrains/);
  });

  it("the root layout applies all three font variables to <html>", () => {
    const src = read("app/layout.tsx");
    expect(src).toMatch(/displayFont\.variable.*bodyFont\.variable.*monoFont\.variable/s);
  });

  it("no live font stack references an old family or a serif fallback", () => {
    for (const rel of STACK_FILES) {
      const src = read(rel);
      expect(src, `${rel} still references an old font family`).not.toMatch(
        /'Fraunces'|"Fraunces"|'DM Sans'|"DM Sans"|JetBrains|'Fira Code'/,
      );
      expect(src, `${rel} still carries a serif fallback`).not.toMatch(
        /Georgia|ui-serif|'Times New Roman'|\bfont-serif\b/,
      );
    }
  });

  it("no live stylesheet or layout fetches fonts from a third-party CDN", () => {
    for (const rel of STACK_FILES) {
      const src = read(rel);
      expect(src, `${rel} loads fonts from a CDN at runtime`).not.toMatch(
        /fonts\.googleapis\.com|fonts\.gstatic\.com|use\.typekit|fonts\.bunny/,
      );
    }
  });
});
