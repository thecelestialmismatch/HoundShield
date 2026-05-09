import { KnowledgeGraph, getKnowledgeGraph, getSeedKnowledge } from "../knowledge-graph";

describe("KnowledgeGraph — seed data", () => {
  it("loads seed knowledge on construction", () => {
    const graph = new KnowledgeGraph();
    const results = graph.query({ query: "CMMC dfars cui local scanning" });
    expect(results.length).toBeGreaterThan(0);
  });

  it("getSeedKnowledge returns at least 10 nodes", () => {
    const seed = getSeedKnowledge();
    expect(seed.length).toBeGreaterThanOrEqual(10);
  });

  it("seed nodes have required fields", () => {
    const seed = getSeedKnowledge();
    for (const node of seed) {
      expect(node.id).toBeTruthy();
      expect(node.domain).toBeTruthy();
      expect(node.title).toBeTruthy();
      expect(node.content.length).toBeGreaterThan(20);
      expect(node.keywords.length).toBeGreaterThan(0);
      expect(node.ttl).toBeGreaterThanOrEqual(0);
      expect(node.weight).toBeGreaterThan(0);
    }
  });

  it("permanent nodes have ttl of 0", () => {
    const seed = getSeedKnowledge();
    const regulatory = seed.filter((n) => n.domain === "cmmc" || n.domain === "hipaa");
    for (const node of regulatory) {
      expect(node.ttl).toBe(0);
    }
  });
});

describe("KnowledgeGraph — query", () => {
  let graph: KnowledgeGraph;

  beforeEach(() => {
    graph = new KnowledgeGraph();
  });

  it("returns relevant results for CMMC question", () => {
    const results = graph.query({ query: "CMMC Level 2 DFARS CUI local scanning" });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].score).toBeGreaterThan(0);
  });

  it("returns competitor results for Nightfall question", () => {
    const results = graph.query({ query: "Nightfall cloud DLP competitor CMMC" });
    expect(results.length).toBeGreaterThan(0);
    const topNode = results[0].node;
    expect(
      topNode.domain === "competitor" || topNode.keywords.includes("nightfall")
    ).toBe(true);
  });

  it("filters by domain", () => {
    const results = graph.query({ query: "compliance enforcement", domains: ["cmmc"] });
    for (const r of results) {
      expect(r.node.domain).toBe("cmmc");
    }
  });

  it("respects limit parameter", () => {
    const results = graph.query({ query: "compliance", limit: 2 });
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it("returns empty array for gibberish query", () => {
    const results = graph.query({ query: "xyzxyzxyz qqqqq 9999zz" });
    expect(results).toHaveLength(0);
  });

  it("results are sorted by score descending", () => {
    const results = graph.query({ query: "CMMC DFARS CUI contractor" });
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });
});

describe("KnowledgeGraph — addNode", () => {
  let graph: KnowledgeGraph;

  beforeEach(() => {
    graph = new KnowledgeGraph();
  });

  it("adds a node and makes it queryable", () => {
    graph.addNode({
      domain: "market",
      title: "Test market fact ZZUNIQUE",
      content: "ZZUNIQUE fact for testing the add node path",
      keywords: ["zzunique", "test", "market"],
      source: "test",
      sourceType: "manual",
      ttl: 0,
      weight: 1.0,
    });
    const results = graph.query({ query: "ZZUNIQUE fact testing" });
    expect(results.some((r) => r.node.title.includes("ZZUNIQUE"))).toBe(true);
  });

  it("returns the full node from addNode", () => {
    const node = graph.addNode({
      domain: "architecture",
      title: "Test arch node",
      content: "Test architecture content for add node return value test",
      keywords: ["test"],
      source: "test",
      sourceType: "manual",
      ttl: 0,
      weight: 1.0,
    });
    expect(node.id).toBeTruthy();
    expect(node.createdAt).toBeGreaterThan(0);
    expect(node.updatedAt).toBeGreaterThan(0);
  });
});

describe("KnowledgeGraph — TTL / staleness", () => {
  it("permanent nodes (ttl=0) are never stale", () => {
    const graph = new KnowledgeGraph();
    const permanentNodes = getSeedKnowledge().filter((n) => n.ttl === 0);
    for (const node of permanentNodes) {
      expect(graph.isStale(node)).toBe(false);
    }
  });

  it("expired nodes are stale", () => {
    const graph = new KnowledgeGraph();
    const node = graph.addNode({
      domain: "competitor",
      title: "Stale test",
      content: "This node is stale content",
      keywords: ["stale"],
      source: "test",
      sourceType: "manual",
      ttl: 1, // 1ms — instantly stale
      weight: 1.0,
    });
    // Wait 2ms
    const pastNode = { ...node, updatedAt: Date.now() - 10 };
    expect(graph.isStale(pastNode)).toBe(true);
  });
});

describe("KnowledgeGraph — answer", () => {
  it("returns a string answer for a known question", () => {
    const graph = new KnowledgeGraph();
    const answer = graph.answer("What is DFARS 7012?");
    expect(typeof answer).toBe("string");
    expect(answer.length).toBeGreaterThan(10);
  });

  it("returns a fallback message for unknown question", () => {
    const graph = new KnowledgeGraph();
    const answer = graph.answer("xyzxyzxyz irrelevant gibberish qqqqq");
    expect(answer).toContain("No knowledge found");
  });
});

describe("getKnowledgeGraph — singleton", () => {
  it("returns the same instance on repeated calls", () => {
    const a = getKnowledgeGraph();
    const b = getKnowledgeGraph();
    expect(a).toBe(b);
  });
});
