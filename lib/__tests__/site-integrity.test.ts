/**
 * Site integrity guards — cheap insurance against the bugs we just fixed.
 *
 * 1. The pricing source of truth is well-formed (no "Federal" tier regression,
 *    Pro is the highlighted plan, brand name is exactly "HoundShield").
 * 2. No page links to the hyphenated "/sign-up" (the dead route that 404'd
 *    every homepage CTA). The real route is "/signup".
 * 3. Every internal nav/footer link resolves to a real App Router route or a
 *    same-page anchor — so the footer can't quietly point at a 404 again.
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { BRAND, PRICING, NAV_LINKS, FOOTER_SECTIONS } from "../site-config";

const APP_DIR = join(process.cwd(), "app");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith(".tsx") || full.endsWith(".ts")) out.push(full);
  }
  return out;
}

/** Map an internal href to the App Router file that would serve it. */
function routeExists(href: string): boolean {
  const path = href.split("#")[0].split("?")[0];
  if (path === "" || path === "/") return existsSync(join(APP_DIR, "page.tsx"));
  const base = join(APP_DIR, path.replace(/^\//, ""));
  return (
    existsSync(join(base, "page.tsx")) ||
    existsSync(`${base}.tsx`) ||
    existsSync(join(base, "route.ts"))
  );
}

describe("pricing source of truth", () => {
  it("has exactly five tiers with unique ids", () => {
    expect(PRICING).toHaveLength(5);
    const ids = PRICING.map((p) => p.id);
    expect(new Set(ids).size).toBe(5);
  });

  it("has Pro as the single highlighted plan", () => {
    expect(PRICING.filter((p) => p.highlight).map((p) => p.id)).toEqual(["pro"]);
  });

  it("uses 'Agency / MSP' (no 'Federal' regression) and reconciled scan limits", () => {
    const names = PRICING.map((p) => p.name);
    expect(names).toContain("Agency / MSP");
    expect(names).not.toContain("Federal");
    expect(PRICING.find((p) => p.id === "pro")?.scans).toBe("50,000 scans/mo");
  });

  it("brand name is exactly HoundShield", () => {
    expect(BRAND.name).toBe("HoundShield");
  });
});

describe("no dead links", () => {
  it("no page links to the hyphenated /sign-up route", () => {
    const offenders = walk(APP_DIR).filter((f) => /["'`]\/sign-up/.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });

  it("every nav + footer internal link resolves to a real route or anchor", () => {
    const links = [
      ...NAV_LINKS.map((l) => l.href),
      ...Object.values(FOOTER_SECTIONS).flat().map((l) => l.href),
      ...PRICING.map((p) => p.href),
    ].filter((h) => h.startsWith("/"));
    const broken = links.filter((h) => !routeExists(h));
    expect(broken).toEqual([]);
  });
});
