import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";

/**
 * Brand guard: the company name is "HoundShield" — one word, no space.
 * The split two-word spelling must never appear in any shipped source. This
 * catches regressions before they reach the marketing site, where the split
 * spelling reads as a different (or careless) company to a buyer.
 *
 * The forbidden pattern is built dynamically so this guard file itself never
 * contains the literal it bans (otherwise it would flag itself).
 */

const ROOT = path.resolve(__dirname, "..", "..");
const SCAN_DIRS = ["app", "components", "lib"];
const SCAN_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mdx", ".json"]);
// Generated snapshots are regenerated from source, not authored — skip them.
const SKIP = new Set(["__snapshots__", "node_modules", ".next"]);
const SPLIT_BRAND = ["Hound", "Shield"].join(" ");
const BAD = new RegExp(SPLIT_BRAND);

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, acc);
    } else if (SCAN_EXT.has(path.extname(entry))) {
      acc.push(full);
    }
  }
  return acc;
}

describe("brand consistency", () => {
  it("contains no split-brand spelling in app/components/lib source", () => {
    const offenders: string[] = [];
    for (const dir of SCAN_DIRS) {
      const base = path.join(ROOT, dir);
      try {
        statSync(base);
      } catch {
        continue;
      }
      for (const file of walk(base)) {
        if (BAD.test(readFileSync(file, "utf8"))) {
          offenders.push(path.relative(ROOT, file));
        }
      }
    }
    expect(
      offenders,
      `Brand name must be one word "HoundShield". Found the split spelling in:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });
});
