import { PLANS, COMPARISON, FAQ, annualMonthly, annualTotal, annualSavings, type PlanId } from "../_data";

// ─── Plan structure ────────────────────────────────────────────────────────────

describe("PLANS — structure", () => {
  it("has exactly 5 tiers", () => {
    expect(PLANS).toHaveLength(5);
  });

  it("tier IDs are starter, pro, growth, enterprise, agency in order", () => {
    expect(PLANS.map((p) => p.id)).toEqual(["starter", "pro", "growth", "enterprise", "agency"]);
  });

  it("only one plan is highlighted", () => {
    const highlighted = PLANS.filter((p) => p.highlighted);
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0].id).toBe("pro");
  });

  it("every plan has at least 5 features", () => {
    for (const plan of PLANS) {
      expect(plan.features.length).toBeGreaterThanOrEqual(5);
    }
  });

  it("starter is free", () => {
    const starter = PLANS.find((p) => p.id === "starter")!;
    expect(starter.monthlyPrice).toBe(0);
    expect(starter.annualMonthly).toBe(0);
    expect(starter.annualTotal).toBe(0);
  });

  it("paid plans have annualMonthly < monthlyPrice (annual discount)", () => {
    const paid = PLANS.filter((p) => p.monthlyPrice > 0);
    for (const plan of paid) {
      expect(plan.annualMonthly).toBeLessThan(plan.monthlyPrice);
    }
  });
});

// ─── Correct prices ────────────────────────────────────────────────────────────

describe("PLANS — prices match PRD v2", () => {
  const prices: Record<PlanId, number> = {
    starter: 0,
    pro: 199,
    growth: 499,
    enterprise: 999,
    agency: 2499,
  };

  for (const [id, expected] of Object.entries(prices)) {
    it(`${id} monthly price is $${expected}`, () => {
      const plan = PLANS.find((p) => p.id === id)!;
      expect(plan.monthlyPrice).toBe(expected);
    });
  }

  it("pro annualMonthly is $159 (20% off $199)", () => {
    const pro = PLANS.find((p) => p.id === "pro")!;
    expect(pro.annualMonthly).toBe(159);
  });

  it("growth annualMonthly is $399 (20% off $499)", () => {
    const growth = PLANS.find((p) => p.id === "growth")!;
    expect(growth.annualMonthly).toBe(399);
  });

  it("enterprise annualMonthly is $799 (20% off $999)", () => {
    const ent = PLANS.find((p) => p.id === "enterprise")!;
    expect(ent.annualMonthly).toBe(799);
  });

  it("agency annualMonthly is $1999 (20% off $2499)", () => {
    const agency = PLANS.find((p) => p.id === "agency")!;
    expect(agency.annualMonthly).toBe(1999);
  });

  it("annualTotal = annualMonthly * 12 for all paid plans", () => {
    for (const plan of PLANS.filter((p) => p.monthlyPrice > 0)) {
      expect(plan.annualTotal).toBe(plan.annualMonthly * 12);
    }
  });
});

// ─── Pricing helpers ───────────────────────────────────────────────────────────

describe("annualMonthly()", () => {
  it("returns 80% of monthly price rounded to nearest dollar", () => {
    expect(annualMonthly(199)).toBe(159);
    expect(annualMonthly(499)).toBe(399);
    expect(annualMonthly(999)).toBe(799);
    expect(annualMonthly(2499)).toBe(1999);
  });

  it("returns 0 for free tier", () => {
    expect(annualMonthly(0)).toBe(0);
  });
});

describe("annualTotal()", () => {
  it("returns annualMonthly * 12", () => {
    expect(annualTotal(199)).toBe(annualMonthly(199) * 12);
    expect(annualTotal(499)).toBe(annualMonthly(499) * 12);
  });
});

describe("annualSavings()", () => {
  it("pro annual saves $480/yr vs monthly", () => {
    expect(annualSavings(199)).toBe(199 * 12 - annualTotal(199));
  });

  it("savings are always positive for paid tiers", () => {
    for (const price of [199, 499, 999, 2499]) {
      expect(annualSavings(price)).toBeGreaterThan(0);
    }
  });
});

// ─── Comparison table ──────────────────────────────────────────────────────────

describe("COMPARISON — structure", () => {
  it("has at least 20 rows", () => {
    expect(COMPARISON.length).toBeGreaterThanOrEqual(20);
  });

  it("every row has all 5 plan keys", () => {
    const keys: PlanId[] = ["starter", "pro", "growth", "enterprise", "agency"];
    for (const row of COMPARISON) {
      for (const key of keys) {
        expect(row).toHaveProperty(key);
      }
    }
  });

  it("SPRS score calculator is available on all tiers", () => {
    const row = COMPARISON.find((r) => r.feature === "SPRS score calculator")!;
    expect(row).toBeDefined();
    expect(row.starter).toBe(true);
    expect(row.pro).toBe(true);
    expect(row.growth).toBe(true);
    expect(row.enterprise).toBe(true);
    expect(row.agency).toBe(true);
  });

  it("PDF reports require Growth or above", () => {
    const row = COMPARISON.find((r) => r.feature === "PDF compliance reports")!;
    expect(row).toBeDefined();
    expect(row.starter).toBe(false);
    expect(row.pro).toBe(false);
    expect(row.growth).toBe(true);
  });

  it("on-prem deployment requires Enterprise or above", () => {
    const row = COMPARISON.find((r) => r.feature === "On-prem / air-gapped")!;
    expect(row).toBeDefined();
    expect(row.starter).toBe(false);
    expect(row.pro).toBe(false);
    expect(row.growth).toBe(false);
    expect(row.enterprise).toBe(true);
    expect(row.agency).toBe(true);
  });

  it("client accounts are agency-only", () => {
    const row = COMPARISON.find((r) => r.feature === "Client accounts")!;
    expect(row).toBeDefined();
    expect(row.starter).toBe(false);
    expect(row.pro).toBe(false);
    expect(row.growth).toBe(false);
    expect(row.enterprise).toBe(false);
    expect(row.agency).toBe("Unlimited");
  });

  it("categories are grouped and consistent", () => {
    const validCategories = ["AI Gateway", "CMMC & Compliance", "Platform", "Support"];
    for (const row of COMPARISON) {
      expect(validCategories).toContain(row.category);
    }
  });
});

// ─── FAQ ───────────────────────────────────────────────────────────────────────

describe("FAQ", () => {
  it("has at least 5 entries", () => {
    expect(FAQ.length).toBeGreaterThanOrEqual(5);
  });

  it("all entries have non-empty q and a", () => {
    for (const item of FAQ) {
      expect(item.q.length).toBeGreaterThan(10);
      expect(item.a.length).toBeGreaterThan(20);
    }
  });

  it("no FAQ answer mentions '14-day' trial (consistent messaging)", () => {
    for (const item of FAQ) {
      expect(item.a).not.toMatch(/14.day/i);
    }
  });

  it("DFARS 7012 is explained in FAQ", () => {
    const dfarsEntry = FAQ.find((f) => f.a.includes("DFARS"));
    expect(dfarsEntry).toBeDefined();
  });

  it("C3PAO question explains which plan to buy", () => {
    const c3paoEntry = FAQ.find((f) => f.q.toLowerCase().includes("c3pao"));
    expect(c3paoEntry).toBeDefined();
    expect(c3paoEntry!.a).toMatch(/growth/i);
  });
});
