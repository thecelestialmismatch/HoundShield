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

  it("leads with the $499 one-time report at $299 wholesale", () => {
    expect(RISK_REPORT.oneTimePrice).toBe(499);
    expect(RISK_REPORT.wholesalePrice).toBe(299);
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

  it("lists every canonical monthly price", () => {
    for (const amount of ["$199/month", "$499/month", "$999/month", "$2,499/month"]) {
      expect(llms, `llms.txt missing ${amount}`).toContain(amount);
    }
  });

  it("does not contain the retired $69 Pro price", () => {
    expect(llms).not.toContain("$69");
  });
});
