import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
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
