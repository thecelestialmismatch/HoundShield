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

/**
 * The `script-src` DIRECTIVE, not prose that happens to mention it.
 *
 * An unanchored "script-src followed by anything up to a quote" pattern looks
 * equivalent and is not: both files discuss `script-src` in comments above the
 * directive, so such a pattern captures English and asserts against it —
 * passing or failing on the wording of a comment rather than on the shipped
 * policy. Anchoring to the opening double quote of the JS string literal is
 * what makes this read the header. (Observed: the first draft of this helper
 * did exactly that and reported a diff of prose.)
 */
function scriptSrcOf(src: string): string {
  return src.match(/"script-src[^"]*"/)?.[0].replace(/"/g, "") ?? "";
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
  // Both of these were present in middleware.ts and MISSING from next.config.js
  // until 2026-08-12. That gap was invisible in review precisely because this
  // list did not name them and the middleware copy looked like coverage — while
  // middleware does not execute on this deployment at all (repo-root
  // vercel.json uses the legacy `builds`/`routes` keys, which replace the
  // routing table it lives in). Asserted per-layer so the dead layer can never
  // again stand in for the live one.
  //
  // base-uri:    without it an injected <base href> re-points every relative
  //              script and form at an attacker origin — sharper than usual
  //              while script-src still carries 'unsafe-inline'.
  // form-action: CSP is the ONLY control over where a form may submit;
  //              default-src and frame-ancestors do not constrain it.
  ["CSP base-uri 'self'", /base-uri 'self'/],
  ["CSP form-action 'self'", /form-action 'self'/],
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

  it.each(LAYERS)("%s does not allow 'unsafe-eval' in script-src", (_label, src) => {
    // Audit #8b. This compounds with #2: the session cookie is httpOnly:false
    // by @supabase/ssr design, so any XSS that lands is immediate session theft
    // rather than a contained defacement. Tightening script-src is the half of
    // that pair which is actually tractable.
    //
    // Asserted per-layer and scoped to script-src specifically: 'unsafe-inline'
    // is still required there (App Router, no nonce plumbing) and 'unsafe-inline'
    // in style-src is untouched, so a blunt search for "unsafe" would fail on
    // directives that are meant to be present.
    expect(scriptSrcOf(src), "script-src directive should exist").not.toBe("");
    expect(scriptSrcOf(src)).not.toMatch(/unsafe-eval/);
  });

  it("the two layers agree on script-src (no drift)", () => {
    // The dead middleware layer must never carry a weaker policy than the live
    // one — that mismatch is precisely how the missing base-uri/form-action
    // read as covered in review for months. Compared as a SET so the two files
    // may list the sources in different orders.
    const sources = (src: string) => scriptSrcOf(src).split(/\s+/).filter(Boolean).sort().join(" ");
    expect(sources(read("next.config.js"))).toBe(sources(read("middleware.ts")));
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
