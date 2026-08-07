import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { CMMC_STATUS, PHASE2_SUSPENDED_ON, FCA_PITCH } from "../cmmc-status";

/* ──────────────────────────────────────────────────────────────────────
 * Regulatory-honesty contract.
 *
 * On 2026-07-13 the Department of War suspended CMMC Phase 2. For the two
 * weeks that followed, thirteen surfaces kept asserting the cancelled
 * 10 November 2026 certification deadline as live — including the site-wide
 * chat system prompt, which explicitly instructed the model to "emphasize
 * November 2026 CMMC enforcement". Only lib/seo/faqs.ts had been corrected.
 *
 * The rule enforced here is deliberately a CO-OCCURRENCE rule, not a ban:
 * naming the date is fine and often necessary ("...which would have applied
 * from 10 November 2026"), but any file that names it must also name the
 * suspension. That makes the honest phrasing the only phrasing that compiles,
 * without forcing us to scrub a real date out of the historical record.
 *
 * NEVER-DO (CLAUDE.md / primer): sell the November 10 deadline.
 * ────────────────────────────────────────────────────────────────────── */

const ROOT = join(__dirname, "..", "..", "..");
const SCAN_DIRS = ["app", "components", "lib"];
const SOURCE_EXT = [".ts", ".tsx"];

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "__tests__" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, acc);
    else if (SOURCE_EXT.some((ext) => entry.endsWith(ext)) && !entry.includes(".test."))
      acc.push(full);
  }
  return acc;
}

/** "November 2026", "November 10, 2026", "10 November 2026", "Nov 10 2026". */
const NAMES_THE_DATE = /\b(?:10\s+)?nov(?:\.|ember)?\s*(?:10\s*,?\s*)?2026\b/i;

/**
 * Any acknowledgement of the programme's actual status.
 *
 * "pause"/"paused" joined this list on 2026-08-07, when the product's framing
 * moved from "suspended, deadline gone" to "paused for review, November is
 * still the date to be ready for" (founder decision). The guard's job is
 * unchanged and is the reason it still has teeth: a file may name the November
 * date ONLY if it also says where the programme stands. Quoting the date bare,
 * as a live certification deadline, is what loses the buyer who checks.
 */
const NAMES_THE_SUSPENSION = /suspend|paus|2026-07-13|13 july 2026|july 13,? 2026|superseded/i;

describe("CMMC regulatory status", () => {
  const files = SCAN_DIRS.flatMap((d) => sourceFiles(join(ROOT, d)));

  it("scans a non-trivial number of source files", () => {
    // Guards the guard: a broken walker that finds nothing would pass silently.
    expect(files.length).toBeGreaterThan(100);
  });

  it("no source file cites the November 2026 date without naming the programme status", () => {
    const violations: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      if (!NAMES_THE_DATE.test(src)) continue;
      if (!NAMES_THE_SUSPENSION.test(src)) violations.push(file.replace(ROOT + "/", ""));
    }
    expect(
      violations,
      `names 10 Nov 2026 without saying where CMMC Phase 2 stands: ${violations.join(", ")}`,
    ).toEqual([]);
  });

  it("the canonical status names the suspension date and what survived it", () => {
    expect(PHASE2_SUSPENDED_ON).toBe("2026-07-13");
    expect(CMMC_STATUS.blurb).toMatch(NAMES_THE_SUSPENSION);
    expect(CMMC_STATUS.blurb).toContain("800-171");
    expect(CMMC_STATUS.blurb).toContain("SPRS");
    expect(CMMC_STATUS.blurb).toContain("252.204-7012");
    expect(CMMC_STATUS.stillInForce).toHaveLength(3);
  });

  it("the defense pitch sells liability, not a deadline", () => {
    expect(FCA_PITCH).toMatch(/false claims act/i);
    expect(FCA_PITCH).not.toMatch(NAMES_THE_DATE);
  });

  it("the correction actually reaches a customer-facing surface", () => {
    // If someone deletes every mention, the co-occurrence rule above would
    // pass vacuously. At least one shipped surface must state the suspension.
    const corrected = files.filter((f) => NAMES_THE_SUSPENSION.test(readFileSync(f, "utf8")));
    expect(corrected.length).toBeGreaterThanOrEqual(5);
  });
});
