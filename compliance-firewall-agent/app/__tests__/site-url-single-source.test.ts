import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SITE_URL, siteUrl } from "@/lib/site-url";

/**
 * The site's base URL is declared once.
 *
 * It was declared TWENTY-NINE times, each falling back to the apex host, and
 * `NEXT_PUBLIC_APP_URL` is unset in production — so every canonical tag, every
 * Open Graph URL, `sitemap.xml`, `robots.txt` and every onboarding email link
 * pointed at an address that 308s elsewhere:
 *
 *   GET https://houndshield.com/api/health -> 308 -> https://www.houndshield.com/...
 *
 * `lib/gateway/base-url.ts` already exists because the same failure happened on
 * the gateway host — eight copies across two dead subdomains, so fixing one
 * looked complete and was not. This guard stops the marketing surface
 * re-acquiring the habit.
 */

const APP = process.cwd();
const read = (rel: string) => readFileSync(join(APP, rel), "utf8");

/** Tracked source files, excluding the module that legitimately owns the value. */
function sourceFiles(): string[] {
  return execFileSync("git", ["ls-files", "app", "lib", "components"], {
    cwd: APP,
    encoding: "utf8",
  })
    .split("\n")
    .filter((f) => /\.(ts|tsx)$/.test(f))
    .filter((f) => !f.includes("__tests__"))
    .filter((f) => f !== "lib/site-url.ts");
}

describe("the base URL is single-sourced", () => {
  it("no file falls back to the production host on its own", () => {
    /*
     * Targets the DEFECT — an apex-host fallback — not every read of the env
     * var. The first draft matched `NEXT_PUBLIC_APP_URL ??` and flagged six
     * files that are all correct:
     *
     *   api/auth/otp, api/auth/signup  fall back to the REQUEST ORIGIN, so a
     *                                  confirm link matches the host the user
     *                                  is actually on
     *   lib/env.ts, lib/hitl/…         fall back to localhost (dev defaults)
     *   lib/gateway/cors.ts            must see the RAW value to decide demo mode
     *   lib/auth/reset-diagnostics.ts  exists to diagnose that raw value
     *
     * A guard that forces those to import a production constant would break
     * each of them. Only a hardcoded production fallback is the duplication.
     */
    const APEX_FALLBACK =
      /NEXT_PUBLIC_APP_URL[^;\n]*(?:\?\?|\|\|)\s*['"]https:\/\/(?:www\.)?houndshield\.com['"]/;
    const offenders = sourceFiles().filter((f) => APEX_FALLBACK.test(read(f)));
    expect(
      offenders,
      `these re-declare the site base URL instead of importing SITE_URL from lib/site-url:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });

  it("no file hardcodes the apex host as a base URL", () => {
    // Prose and comments may mention it; a bare string assignment may not.
    const HARDCODED = /=\s*['"]https:\/\/houndshield\.com['"]/;
    const offenders = sourceFiles().filter((f) => HARDCODED.test(read(f)));
    expect(offenders, `hardcoded apex base URL in:\n${offenders.join("\n")}`).toEqual([]);
  });
});

describe("the default host is the one production actually serves", () => {
  it("defaults to www, which is where Vercel redirects", () => {
    // Vercel 308s apex -> www (measured 2026-08-14). A canonical pointing at a
    // URL that redirects is a page contradicting itself.
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(SITE_URL).toBe("https://www.houndshield.com");
  });

  it("agrees with the gateway host printed to customers", () => {
    // lib/gateway/base-url.ts is the address in the docs, the console and the
    // onboarding email. Two different canonical hosts is how the apex/www split
    // survived in the first place.
    const gateway = read("lib/gateway/base-url.ts");
    const host = new URL(SITE_URL).host;
    expect(gateway).toContain(host);
  });

  it("agrees with CLAUDE.md, which records the canonical URL", () => {
    const brain = readFileSync(join(APP, "..", "CLAUDE.md"), "utf8");
    const declared = brain.match(/Canonical URL:\s*`([^`]+)`/)?.[1] ?? "";
    expect(declared, "CLAUDE.md no longer records a canonical URL").toBeTruthy();
    expect(new URL(declared).host).toBe(new URL(SITE_URL).host);
  });

  it("carries no trailing slash, so joins never double up", () => {
    expect(SITE_URL.endsWith("/")).toBe(false);
    expect(siteUrl("/pricing")).toBe(`${SITE_URL}/pricing`);
    expect(siteUrl("pricing")).toBe(`${SITE_URL}/pricing`);
  });
});
