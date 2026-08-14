import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * One canonical host, declared in one direction.
 *
 * THE DEFECT THIS PREVENTS IS AN OUTAGE, NOT AN SEO NITPICK.
 *
 * `next.config.js` carried a permanent redirect www -> apex. Vercel's domain
 * configuration redirects apex -> WWW; measured on 2026-08-14:
 *
 *   GET https://houndshield.com/api/health  ->  308  ->  https://www.houndshield.com/...
 *
 * Both live at once is an infinite redirect loop on every URL of the site. It
 * had never fired only because the legacy repo-root `vercel.json` prevents
 * next.config redirects from reaching the edge — so the loop was armed by the
 * very change that restores middleware (docs/DEPLOYMENT-MIDDLEWARE.md), and
 * would have detonated on the deploy that was supposed to fix things.
 *
 * The audit predicted exactly this ("Item 13 last, and carefully") and it was
 * still nearly shipped, because the two halves live in different systems: one
 * in a config file, one in a dashboard nobody diffs.
 */

const CONFIG = readFileSync(resolve(process.cwd(), "next.config.js"), "utf8");

/** Redirect rules only — comments explaining the removal must not match. */
function redirectRules(): string {
  const start = CONFIG.indexOf("async redirects()");
  if (start === -1) return "";
  const body = CONFIG.slice(start, CONFIG.indexOf("async headers()", start));
  return body
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("//"))
    .join("\n");
}

describe("the app never redirects against Vercel's canonical host", () => {
  it("declares no www -> apex redirect", () => {
    // Vercel canonicalises apex -> www. A rule pointing the other way is one
    // deploy away from an infinite loop, so it must not exist in source at all.
    const rules = redirectRules();
    const hasWwwSource = /host'?,?\s*value:\s*'www\.houndshield\.com'/.test(rules);
    expect(
      hasWwwSource,
      "next.config.js matches on host www.houndshield.com — Vercel already 308s apex -> www, " +
        "so this creates apex -> www -> apex once framework routing is live",
    ).toBe(false);
  });

  it("has no redirect whose destination is the bare apex host", () => {
    const rules = redirectRules();
    const apexDestinations = rules.match(/destination:\s*'https:\/\/houndshield\.com/g) ?? [];
    // The http -> https rule is allowed to name a host; assert it is the only one.
    expect(
      apexDestinations.length,
      "a redirect targets the apex host, which Vercel immediately 308s to www — " +
        "every such redirect costs an extra hop and risks a loop",
    ).toBeLessThanOrEqual(1);
  });

  it("keeps the canonical host consistent with what the product prints", () => {
    // lib/gateway/base-url.ts is the address printed to customers in the docs,
    // the console and the onboarding email. If the site canonicalises to www,
    // that constant must be www too, or a paying customer copies a URL that
    // redirects.
    const baseUrl = readFileSync(resolve(process.cwd(), "lib/gateway/base-url.ts"), "utf8");
    expect(baseUrl).toMatch(/www\.houndshield\.com/);
  });
});
