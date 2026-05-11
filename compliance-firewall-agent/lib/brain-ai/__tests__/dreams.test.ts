/**
 * Claude Dreams — unit tests for pure (non-API) functions.
 * No Anthropic API calls are made. DreamsService is not instantiated.
 */

import {
  nodeToMemoryContent,
  parseMemoryContent,
  defaultInstructions,
  buildDreamSummary,
  type DreamResult,
} from "../dreams";
import type { KnowledgeNode } from "../knowledge-graph";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const NOW = 1_700_000_000_000; // fixed epoch for determinism

function makeNode(overrides: Partial<KnowledgeNode> = {}): KnowledgeNode {
  return {
    id: "cmmc_test_abc1",
    domain: "cmmc",
    title: "CMMC Level 2 Overview",
    content: "CMMC Level 2 requires 110 NIST 800-171 Rev 2 controls. Baseline for most DoD contractors.",
    keywords: ["cmmc", "level2", "nist", "doi"],
    source: "https://dodcio.defense.gov/CMMC/",
    sourceType: "firecrawl",
    createdAt: NOW,
    updatedAt: NOW,
    ttl: 0,
    weight: 0.9,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// nodeToMemoryContent
// ---------------------------------------------------------------------------

describe("nodeToMemoryContent", () => {
  it("includes all required header fields", () => {
    const content = nodeToMemoryContent(makeNode());
    expect(content).toContain("DOMAIN: cmmc");
    expect(content).toContain("TITLE: CMMC Level 2 Overview");
    expect(content).toContain("SOURCE: https://dodcio.defense.gov/CMMC/ (firecrawl)");
    expect(content).toContain("WEIGHT: 0.9");
    expect(content).toContain("KEYWORDS: cmmc, level2, nist, doi");
  });

  it("marks permanent nodes with ttl=0 as 'permanent'", () => {
    const content = nodeToMemoryContent(makeNode({ ttl: 0 }));
    expect(content).toContain("TTL: permanent");
  });

  it("marks expiring nodes with day count", () => {
    const content = nodeToMemoryContent(makeNode({ ttl: 7 * 86400000 }));
    expect(content).toContain("TTL: expires after 7d");
  });

  it("includes node body after blank line separator", () => {
    const content = nodeToMemoryContent(makeNode());
    const parts = content.split("\n\n");
    expect(parts.length).toBeGreaterThanOrEqual(2);
    expect(parts[parts.length - 1]).toContain("CMMC Level 2 requires");
  });

  it("encodes ISO-8601 dates", () => {
    const content = nodeToMemoryContent(makeNode());
    expect(content).toContain("CREATED: " + new Date(NOW).toISOString());
    expect(content).toContain("UPDATED: " + new Date(NOW).toISOString());
  });
});

// ---------------------------------------------------------------------------
// parseMemoryContent — round-trip
// ---------------------------------------------------------------------------

describe("parseMemoryContent", () => {
  it("round-trips domain and title", () => {
    const node = makeNode();
    const raw = nodeToMemoryContent(node);
    const parsed = parseMemoryContent(raw);
    expect(parsed.domain).toBe("cmmc");
    expect(parsed.title).toBe("CMMC Level 2 Overview");
  });

  it("round-trips keywords", () => {
    const node = makeNode();
    const parsed = parseMemoryContent(nodeToMemoryContent(node));
    expect(parsed.keywords).toEqual(["cmmc", "level2", "nist", "doi"]);
  });

  it("round-trips ttl=0 (permanent)", () => {
    const parsed = parseMemoryContent(nodeToMemoryContent(makeNode({ ttl: 0 })));
    expect(parsed.ttl).toBe(0);
  });

  it("round-trips ttl=7d", () => {
    const parsed = parseMemoryContent(nodeToMemoryContent(makeNode({ ttl: 7 * 86400000 })));
    expect(parsed.ttl).toBe(7 * 86400000);
  });

  it("round-trips weight", () => {
    const parsed = parseMemoryContent(nodeToMemoryContent(makeNode({ weight: 0.9 })));
    expect(parsed.weight).toBeCloseTo(0.9);
  });

  it("round-trips source and sourceType", () => {
    const parsed = parseMemoryContent(nodeToMemoryContent(makeNode()));
    expect(parsed.source).toBe("https://dodcio.defense.gov/CMMC/");
    expect(parsed.sourceType).toBe("firecrawl");
  });

  it("recovers node body text", () => {
    const node = makeNode();
    const parsed = parseMemoryContent(nodeToMemoryContent(node));
    expect(parsed.content).toContain("CMMC Level 2 requires 110 NIST");
  });

  it("falls back gracefully on minimal input", () => {
    const parsed = parseMemoryContent("DOMAIN: market\nTITLE: Test\n\nBody text here.");
    expect(parsed.domain).toBe("market");
    expect(parsed.title).toBe("Test");
    expect(parsed.content).toBe("Body text here.");
  });

  it("defaults domain to 'market' when missing", () => {
    const parsed = parseMemoryContent("TITLE: Orphan\n\nNo domain header.");
    expect(parsed.domain).toBe("market");
  });
});

// ---------------------------------------------------------------------------
// defaultInstructions
// ---------------------------------------------------------------------------

describe("defaultInstructions", () => {
  it("returns a non-empty string", () => {
    expect(defaultInstructions().length).toBeGreaterThan(50);
  });

  it("instructs merging duplicates", () => {
    expect(defaultInstructions().toLowerCase()).toContain("merge");
  });

  it("instructs ISO-8601 date conversion", () => {
    expect(defaultInstructions()).toContain("ISO-8601");
  });

  it("instructs preserving regulatory facts", () => {
    expect(defaultInstructions()).toContain("cmmc");
  });

  it("instructs resolving contradictions", () => {
    expect(defaultInstructions().toLowerCase()).toContain("contradict");
  });
});

// ---------------------------------------------------------------------------
// buildDreamSummary
// ---------------------------------------------------------------------------

describe("buildDreamSummary", () => {
  it("reports failure clearly", () => {
    const result: DreamResult = {
      dreamId: "drm_abc",
      status: "failed",
      error: "Model overloaded",
    };
    const summary = buildDreamSummary(result);
    expect(summary).toContain("failed");
    expect(summary).toContain("Model overloaded");
    expect(summary).toContain("drm_abc");
  });

  it("reports pending status", () => {
    const result: DreamResult = { dreamId: "drm_pending", status: "pending" };
    expect(buildDreamSummary(result)).toContain("pending");
  });

  it("reports success with output store ID", () => {
    const result: DreamResult = {
      dreamId: "drm_ok",
      status: "succeeded",
      outputStoreId: "memstore_xyz",
      nodeCount: 12,
    };
    const summary = buildDreamSummary(result);
    expect(summary).toContain("succeeded");
    expect(summary).toContain("memstore_xyz");
    expect(summary).toContain("12");
    expect(summary).toContain("promote");
  });

  it("handles success with no node count", () => {
    const result: DreamResult = {
      dreamId: "drm_ok",
      status: "succeeded",
      outputStoreId: "memstore_xyz",
    };
    const summary = buildDreamSummary(result);
    expect(summary).toContain("succeeded");
    expect(summary).toContain("unknown");
  });
});

// ---------------------------------------------------------------------------
// Full round-trip: serialize → parse multiple domains
// ---------------------------------------------------------------------------

describe("multi-domain round-trip", () => {
  const domains: Array<KnowledgeNode["domain"]> = [
    "cmmc", "hipaa", "soc2", "nist", "competitor",
    "market", "architecture", "pricing", "customer",
  ];

  for (const domain of domains) {
    it(`round-trips domain: ${domain}`, () => {
      const node = makeNode({ domain, title: `${domain} test node` });
      const parsed = parseMemoryContent(nodeToMemoryContent(node));
      expect(parsed.domain).toBe(domain);
      expect(parsed.title).toBe(`${domain} test node`);
    });
  }
});
