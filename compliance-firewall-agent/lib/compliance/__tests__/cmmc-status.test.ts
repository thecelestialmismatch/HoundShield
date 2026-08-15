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

/* ──────────────────────────────────────────────────────────────────────
 * The same contract, for the documents that steer the NEXT session.
 *
 * The guard above scans app/, components/ and lib/ for .ts/.tsx only. That
 * blind spot is not academic: it is exactly how CLAUDE.md — the brain doc
 * every session reads FIRST, before any code — went on describing
 * "Stage 3 (Nov 10 — Phase 2 enforcement day)" and a kill criterion keyed to
 * the deadline being "extended", six weeks after the Department of War paused
 * it. Shipped code told the buyer the truth while the governing document told
 * the operator something else, and the operator writes the code.
 *
 * Scope is deliberately the GOVERNING docs — the ones that direct future
 * decisions — not every markdown file in the repo. Dated historical records
 * are excluded by name below, because a changelog entry written in June that
 * names the then-live deadline is accurate history, and rewriting history to
 * satisfy a guard is how an audit trail stops being evidence.
 * ────────────────────────────────────────────────────────────────────── */

const REPO_ROOT = join(ROOT, "..");

/**
 * Append-only or point-in-time records. Excluded because their value IS that
 * they say what was true on the day they were written.
 *
 * The second pattern catches any date-stamped filename
 * (VALIDATION-2026-07-12.md, written the day before the pause). Rewriting a
 * dated record so it reflects facts that post-date it destroys the only thing
 * it was keeping.
 */
const HISTORICAL = /^(CHANGELOG|AUDIT-\d|PRE-LAUNCH-AUDIT-\d|DECISIONS)|-\d{4}-\d{2}-\d{2}\.md$/;

function governingDocs(): string[] {
  const acc: string[] = [];

  const walk = (dir: string, depth: number) => {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return; // optional directory
    }
    for (const entry of entries) {
      if (entry === "node_modules" || entry.startsWith(".")) continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        if (depth > 0) walk(full, depth - 1);
      } else if (entry.endsWith(".md") && !HISTORICAL.test(entry)) {
        acc.push(full);
      }
    }
  };

  // Repo root itself is not recursed (depth 0) — only its own *.md files —
  // so this never wanders into compliance-firewall-agent/ or skills/.
  walk(REPO_ROOT, 0);
  walk(join(REPO_ROOT, "tasks"), 1);
  walk(join(REPO_ROOT, "docs"), 2);
  return acc;
}

describe("CMMC regulatory status — governing documents", () => {
  const docs = governingDocs();

  it("finds the brain doc and the task queue", () => {
    // Guards the guard twice over: a walker that finds nothing, or one that
    // silently stops finding CLAUDE.md, would let the drift back in unseen.
    const names = docs.map((d) => d.replace(REPO_ROOT + "/", ""));
    expect(names).toContain("CLAUDE.md");
    expect(names).toContain("tasks/todo.md");
    expect(docs.length).toBeGreaterThan(5);
  });

  it("no governing doc cites the November 2026 date without naming the programme status", () => {
    const violations: string[] = [];
    for (const doc of docs) {
      const src = readFileSync(doc, "utf8");
      if (!NAMES_THE_DATE.test(src)) continue;
      if (!NAMES_THE_SUSPENSION.test(src)) violations.push(doc.replace(REPO_ROOT + "/", ""));
    }
    expect(
      violations,
      `names 10 Nov 2026 without saying where CMMC Phase 2 stands: ${violations.join(", ")}`,
    ).toEqual([]);
  });

  it("the brain doc does not present a passed Stage 1 date as upcoming", () => {
    // The 2026-06-25 Stage 1 checkpoint lapsed. A doc that still says
    // "by June 25" produces a briefing block counting down to a date in the
    // past, which is how a session starts by orienting to a fiction.
    const brain = readFileSync(join(REPO_ROOT, "CLAUDE.md"), "utf8");
    const claimsFutureJune = /\b(?:by|→)\s*(?:2026-06-25|June 25)\b/i.test(brain);
    expect(
      claimsFutureJune,
      "CLAUDE.md still frames the lapsed 2026-06-25 checkpoint as a future deadline",
    ).toBe(false);
  });
});
