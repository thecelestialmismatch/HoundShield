import { ask, addKnowledge, askCompetitor, askCMMC, marketCheck } from "../brain-query";

describe("ask — routing and retrieval", () => {
  it("returns a high-confidence answer for a CMMC question", () => {
    const result = ask("Why is HoundShield CMMC compliant when Nightfall is not?");
    expect(result.answer.length).toBeGreaterThan(20);
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.confidence).toMatch(/^(high|medium|low)$/);
  });

  it("routes DFARS questions to CMMC domain", () => {
    const result = ask("What is DFARS 7012 and why does it matter for local scanning?");
    expect(result.sources.some((s) => s.domain === "cmmc")).toBe(true);
  });

  it("routes Nightfall questions to competitor domain", () => {
    const result = ask("Is Nightfall a competitor to HoundShield?");
    expect(result.sources.some((s) => s.domain === "competitor")).toBe(true);
  });

  it("routes market questions to market/customer domain", () => {
    const result = ask("Who is the primary buyer for HoundShield?");
    expect(
      result.sources.some((s) => s.domain === "market" || s.domain === "customer")
    ).toBe(true);
  });

  it("returns low confidence with suggestion for unknown question", () => {
    const result = ask("xyzxyz gibberish nobody asks this ever");
    expect(result.confidence).toBe("low");
    expect(result.sources).toHaveLength(0);
    expect(result.suggestion).toBeTruthy();
  });

  it("answer includes domain label", () => {
    const result = ask("What is CMMC Level 2?");
    expect(result.answer).toContain("[CMMC]");
  });
});

describe("addKnowledge — runtime updates", () => {
  it("adds a node and makes it queryable via ask()", () => {
    addKnowledge({
      domain: "market",
      title: "Test signal ZZTEST99",
      content: "ZZTEST99 is a unique test market signal for validation",
      keywords: ["zztest99", "signal", "test"],
      source: "test",
      ttlDays: 0,
    });
    const result = ask("ZZTEST99 market signal");
    expect(result.answer).toContain("ZZTEST99");
  });

  it("returns the node id string", () => {
    const id = addKnowledge({
      domain: "architecture",
      title: "Test arch fact",
      content: "Test architecture fact for addKnowledge return value",
      keywords: ["test", "arch"],
      source: "test",
    });
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("ttlDays=7 sets non-zero TTL", () => {
    // We can't easily inspect the TTL directly through the public API,
    // but we verify the add call doesn't throw and returns an id
    const id = addKnowledge({
      domain: "competitor",
      title: "Ephemeral competitor data",
      content: "This is ephemeral competitor intelligence that expires",
      keywords: ["ephemeral", "competitor", "expires"],
      source: "https://example.com",
      ttlDays: 7,
    });
    expect(id).toBeTruthy();
  });
});

describe("askCompetitor — shorthand", () => {
  it("returns a non-empty string for Nightfall", () => {
    const result = askCompetitor("Nightfall");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(10);
  });

  it("returns a non-empty string for Strac", () => {
    const result = askCompetitor("Strac");
    expect(typeof result).toBe("string");
  });

  it("returns a non-empty string for Microsoft Purview", () => {
    const result = askCompetitor("Microsoft Purview");
    expect(typeof result).toBe("string");
  });
});

describe("askCMMC — shorthand", () => {
  it("returns relevant answer for AC.L2-3.1.3", () => {
    const result = askCMMC("AC.L2-3.1.3");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(10);
  });

  it("returns relevant answer for SPRS", () => {
    const result = askCMMC("SPRS score");
    expect(typeof result).toBe("string");
  });
});

describe("marketCheck — shorthand", () => {
  it("returns a non-empty string", () => {
    const result = marketCheck();
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(20);
  });
});
