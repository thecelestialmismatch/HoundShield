import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * Legal guard — the authenticated /partner portal is a multi-tenant RESELLER /
 * management surface. A C3PAO is legally barred from referring or reselling a
 * tool to a client it assesses (32 CFR Part 170 · ISO 17020 cooling-off), so
 * the channel is RPOs / MSPs / consultants — never C3PAOs.
 *
 * This test fails the build if any C3PAO channel-identity framing ever returns
 * to the authed portal. Product-feature mentions ("C3PAO-ready PDF", "hand to
 * your C3PAO assessor") are correct and live OUTSIDE this tree — they are not
 * what this guard polices.
 *
 * See tasks/lessons.md (2026-06-23, C3PAO-endorsement framing is a legal
 * violation) and the NEVER-DO list in CLAUDE.md.
 */

const PORTAL_DIR = resolve(process.cwd(), "app/partner");

function collectSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "__tests__" || entry === "node_modules") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectSourceFiles(full));
    } else if (/\.(tsx?|jsx?)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe("authed /partner portal channel framing (32 CFR Part 170)", () => {
  const files = collectSourceFiles(PORTAL_DIR);

  it("finds the portal source files (sanity check the path resolved)", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(
    // build the table lazily so a path mistake fails the sanity test above,
    // not with a confusing empty-each
    files.length ? files : [resolve(PORTAL_DIR, "layout.tsx")]
  )("contains no C3PAO channel-identity framing: %s", (file) => {
    const src = readFileSync(file, "utf8");
    const matches = src.match(/c3pao/gi) ?? [];
    expect(
      matches,
      `Authed /partner portal must not self-identify with the C3PAO assessor ` +
        `channel — C3PAOs cannot refer/resell tools to clients they assess ` +
        `(32 CFR Part 170). Use RPO / MSP framing. Offending file: ${file}`
    ).toHaveLength(0);
  });

  it("presents the correct RPO / MSP partner framing in the portal chrome", () => {
    const layout = readFileSync(resolve(PORTAL_DIR, "layout.tsx"), "utf8");
    expect(layout).toMatch(/RPO/);
    expect(layout).toMatch(/MSP/);
  });
});

describe("public /partners marketing metadata channel framing", () => {
  const marketingLayout = resolve(process.cwd(), "app/partners/layout.tsx");

  it("does not pitch C3PAOs as a partner/reseller channel in SEO metadata", () => {
    const src = readFileSync(marketingLayout, "utf8");
    // The legitimate exclusion note ("C3PAOs cannot refer...") is allowed; the
    // prohibited thing is marketing a "C3PAO partner" / reseller keyword.
    expect(src).not.toMatch(/C3PAO partner/i);
    expect(src).not.toMatch(/C3PAOs and MSPs (?:use|partner)/i);
    expect(src).toMatch(/RPO/);
  });
});
