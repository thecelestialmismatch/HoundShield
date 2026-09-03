import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";
import {
  PRICING_PLANS,
  RISK_REPORT,
  getPlan,
  getPlanPrice,
  annualMonthly,
  formatUSD,
} from "@/lib/pricing/plans";

const ROOT = path.resolve(__dirname, "..", "..", "..");

describe("pricing source of truth", () => {
  it("locks the canonical subscription ladder", () => {
    expect(PRICING_PLANS.map((p) => [p.id, p.monthlyPrice])).toEqual([
      ["free", 0],
      ["pro", 199],
      ["growth", 499],
      ["enterprise", 999],
      ["agency", 2499],
    ]);
  });

  it("locks annual totals at ~20% off monthly", () => {
    expect(PRICING_PLANS.map((p) => p.annualTotal)).toEqual([
      0, 1910, 4790, 9590, 23990,
    ]);
  });

  it("leads with the $499 one-time report at $399 partner wholesale", () => {
    expect(RISK_REPORT.oneTimePrice).toBe(499);
    // Retail less the flat $100 partner discount — see partner-offer-coherence.test.ts.
    expect(RISK_REPORT.wholesalePrice).toBe(399);
  });

  it("formats USD with thousands separators", () => {
    expect(formatUSD(0)).toBe("$0");
    expect(formatUSD(2499)).toBe("$2,499");
  });

  it("derives the annual-billing monthly figure the pricing page shows", () => {
    // These are the $159 / $399 / $799 numbers an audit once mistook for a
    // contradiction — they are just annualTotal / 12.
    expect(annualMonthly(getPlan("pro"))).toBe(159);
    expect(annualMonthly(getPlan("growth"))).toBe(399);
    expect(annualMonthly(getPlan("enterprise"))).toBe(799);
  });

  it("getPlanPrice mirrors annualTotal into annualPrice for plan cards", () => {
    expect(getPlanPrice("agency")).toEqual({
      monthlyPrice: 2499,
      annualPrice: 23990,
      annualTotal: 23990,
    });
  });
});

describe("llms.txt stays in sync with the pricing source of truth", () => {
  const llms = readFileSync(path.join(ROOT, "public", "llms.txt"), "utf8");

  it("advertises the $499 one-time lead report", () => {
    expect(llms).toContain("$499 one-time");
  });

  /**
   * INVERTED 2026-08-19. This assertion used to REQUIRE llms.txt to list every
   * monthly tier, which is why the retired subscription grid survived every
   * pricing correction: the guard made publishing it mandatory.
   *
   * PRICING_PLANS is dormant Stage-2 data — no page renders it (verified: no
   * non-test importer of PRICING_PLANS/getPlan/ANNUAL_DISCOUNT exists). The one
   * purchasable offer is RISK_REPORT. llms.txt is read by ChatGPT, Claude and
   * Perplexity to describe what a buyer can buy, so publishing an unbuyable
   * $199/month tier there sends every AI answer engine to the wrong product and
   * undercuts the $499 anchor.
   *
   * Same failure mode as the Netskope "43%" assertion in tasks/lessons.md: a
   * test that pins a wrong value converts an error into a requirement. Restore
   * these prices here only when a subscription is genuinely purchasable.
   */
  it("does not advertise a monthly subscription that cannot be bought", () => {
    for (const amount of ["$199/month", "$999/month", "$2,499/month", "$199/mo"]) {
      expect(llms, `llms.txt still advertises the unbuyable ${amount}`).not.toContain(
        amount,
      );
    }
  });

  it("names exactly one offer — the one-time report, not a subscription ladder", () => {
    expect(llms).toContain(formatUSD(RISK_REPORT.wholesalePrice));
    expect(llms).not.toMatch(/subscription tiers?\s*\(secondary\)/i);
  });

  it("does not contain the retired $69 Pro price", () => {
    expect(llms).not.toContain("$69");
  });
});

/**
 * PRICING_PLANS must stay DORMANT.
 *
 * The test above states, in a comment, that "no page renders it (verified: no
 * non-test importer of PRICING_PLANS/getPlan/ANNUAL_DISCOUNT exists)". That
 * verification was true and was performed by hand, which means it stopped being
 * true the moment anyone imported the constant — and nothing would have said so.
 *
 * That is the exact failure this session's other fix came out of:
 * `lib/detection/engines.ts` deleted a bad number from a CONSTANT while two
 * consumers went on computing it, and `engines.test.ts` stayed green because it
 * asserted the constant rather than the consumers. A hand-verified invariant
 * recorded in prose is not a guard.
 *
 * It matters here because the dormant data disagrees with CLAUDE.md. `plans.ts`
 * holds Free $0 / Pro $199 / Growth $499 / Enterprise $999 / Agency $2,499;
 * CLAUDE.md's Stage 2 grid holds Starter $299 / Pro $799 / Enterprise $1,499.
 * Neither matches the other, CLAUDE.md's NEVER-DO list forbids leading with a
 * $199/mo subscription before the $499 report sells, and "Growth $499/mo" wears
 * the same number as the one-time report with a 12x annual difference behind it.
 *
 * Reconciling those numbers is a FOUNDER decision and is deliberately not made
 * in code — picking one silently would set pricing by side effect, the same
 * reasoning that left the 20%-vs-40% partner ruling to the founder. What this
 * guard does is make sure the unreconciled data cannot reach a buyer while the
 * decision is outstanding.
 */
describe("the retired subscription grid cannot reach a page by accident", () => {
  const APP_ROOT = path.join(__dirname, "..", "..", "..");

  function sourceFiles(dir: string, acc: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
      if (entry === "node_modules" || entry === "__tests__" || entry.startsWith(".")) continue;
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) sourceFiles(full, acc);
      else if ((entry.endsWith(".ts") || entry.endsWith(".tsx")) && !entry.includes(".test."))
        acc.push(full);
    }
    return acc;
  }

  it("has no non-test importer of the dormant Stage-2 symbols", () => {
    const DORMANT = /\b(PRICING_PLANS|ANNUAL_DISCOUNT|getPlan)\b/;
    const importers: string[] = [];

    for (const file of sourceFiles(path.join(APP_ROOT, "app"))
      .concat(sourceFiles(path.join(APP_ROOT, "components")), sourceFiles(path.join(APP_ROOT, "lib")))) {
      // The definition itself is not an importer.
      if (file.endsWith(path.join("lib", "pricing", "plans.ts"))) continue;
      const src = readFileSync(file, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
      if (DORMANT.test(src)) importers.push(file.replace(APP_ROOT + path.sep, ""));
    }

    expect(
      importers,
      `PRICING_PLANS is retired Stage-2 data that disagrees with CLAUDE.md's grid and ` +
        `contains the $199/mo tier the NEVER-DO list forbids. Rendering it publishes an ` +
        `unbuyable price ladder next to the $499 anchor. Imported by: ${importers.join(", ")}`,
    ).toEqual([]);
  });
});
