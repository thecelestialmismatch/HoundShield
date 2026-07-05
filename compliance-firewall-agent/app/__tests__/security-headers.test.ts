import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Security-header guard. The /security page tells buyers that HSTS, CSP,
 * X-Frame-Options DENY, nosniff, and a strict referrer policy "ship on every
 * response." Two layers deliver that promise:
 *   - middleware.ts        → dynamic (server-rendered) responses
 *   - next.config.js       → statically-generated pages served from Vercel's CDN,
 *                            where middleware is bypassed on cache hits
 *
 * This test fails the build if EITHER layer stops sending a required header, so
 * the claim can never silently become false and the two layers can't drift
 * apart. Values are asserted on source (not a live request) so it runs in CI
 * without a server; live verification happens at deploy time.
 */

function read(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

const LAYERS: Array<[string, string]> = [
  ["next.config.js (static/CDN layer)", read("next.config.js")],
  ["middleware.ts (dynamic layer)", read("middleware.ts")],
];

const REQUIRED_HEADERS: Array<[string, RegExp]> = [
  ["Strict-Transport-Security", /Strict-Transport-Security[^]*?max-age=\d+[^]*?includeSubDomains/i],
  ["X-Frame-Options: DENY", /X-Frame-Options[^]*?DENY/i],
  ["X-Content-Type-Options: nosniff", /X-Content-Type-Options[^]*?nosniff/i],
  ["Referrer-Policy", /Referrer-Policy[^]*?strict-origin-when-cross-origin/i],
  ["Permissions-Policy", /Permissions-Policy/i],
  ["Content-Security-Policy", /Content-Security-Policy/i],
  ["CSP frame-ancestors 'none'", /frame-ancestors 'none'/],
];

describe("security headers ship on every response (both layers)", () => {
  for (const [layerName, src] of LAYERS) {
    describe(layerName, () => {
      it.each(REQUIRED_HEADERS)("sends %s", (_label, pattern) => {
        expect(src).toMatch(pattern);
      });
    });
  }

  it("next.config applies its headers to every path", () => {
    expect(read("next.config.js")).toMatch(/source:\s*["']\/\(\.\*\)["']/);
  });

  it("the two layers agree on the HSTS max-age (no drift)", () => {
    const grab = (src: string) => src.match(/Strict-Transport-Security[^]*?max-age=(\d+)/i)?.[1];
    const next = grab(read("next.config.js"));
    const mw = grab(read("middleware.ts"));
    expect(next).toBeDefined();
    expect(mw).toBeDefined();
    expect(next).toBe(mw);
  });
});
