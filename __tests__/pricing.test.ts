import { describe, it, expect } from "vitest";
import {
  calculateCost,
  detectProvider,
  PRICING,
  PROVIDER_BASE_URLS,
} from "@/lib/providers/pricing";

describe("PRICING table", () => {
  it("has no duplicate modelIds", () => {
    const ids = PRICING.map((p) => p.modelId);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("every model has positive prices", () => {
    for (const m of PRICING) {
      expect(m.inputPricePerMillion).toBeGreaterThan(0);
      expect(m.outputPricePerMillion).toBeGreaterThan(0);
    }
  });

  it("output price >= input price for all models (generation costs more)", () => {
    for (const m of PRICING) {
      expect(m.outputPricePerMillion).toBeGreaterThanOrEqual(m.inputPricePerMillion);
    }
  });

  it("has entries for all three providers", () => {
    const providers = new Set(PRICING.map((p) => p.provider));
    expect(providers).toContain("openai");
    expect(providers).toContain("anthropic");
    expect(providers).toContain("google");
  });
});

describe("calculateCost", () => {
  it("computes GPT-4o cost correctly", () => {
    // $2.50 per 1M input, $10.00 per 1M output
    const result = calculateCost("gpt-4o", {
      inputTokens: 1_000_000,
      outputTokens: 1_000_000,
    });
    expect(result.known).toBe(true);
    expect(result.provider).toBe("openai");
    expect(result.costUsd).toBeCloseTo(12.5, 4); // $2.50 + $10.00
  });

  it("computes claude-sonnet-4-6 cost correctly", () => {
    // $3.00 per 1M input, $15.00 per 1M output
    const result = calculateCost("claude-sonnet-4-6", {
      inputTokens: 500_000,
      outputTokens: 100_000,
    });
    expect(result.known).toBe(true);
    expect(result.provider).toBe("anthropic");
    expect(result.costUsd).toBeCloseTo(1.5 + 1.5, 4); // $1.50 + $1.50
  });

  it("includes cached input cost when provided", () => {
    const withCache = calculateCost("gpt-4o", {
      inputTokens: 1_000_000,
      outputTokens: 0,
      cachedInputTokens: 1_000_000,
    });
    const withoutCache = calculateCost("gpt-4o", {
      inputTokens: 1_000_000,
      outputTokens: 0,
    });
    // Cached tokens use cachedInputPricePerMillion ($1.25) not inputPricePerMillion ($2.50)
    expect(withCache.costUsd).toBeCloseTo(2.5 + 1.25, 4);
    expect(withoutCache.costUsd).toBeCloseTo(2.5, 4);
  });

  it("returns known=false for unrecognised model", () => {
    const result = calculateCost("gpt-99-turbo-ultra", {
      inputTokens: 1000,
      outputTokens: 500,
    });
    expect(result.known).toBe(false);
    expect(result.costUsd).toBe(0);
    expect(result.provider).toBe("unknown");
  });

  it("handles zero tokens gracefully", () => {
    const result = calculateCost("gpt-4o-mini", { inputTokens: 0, outputTokens: 0 });
    expect(result.costUsd).toBe(0);
    expect(result.known).toBe(true);
  });

  it("matches on modelId prefix (versioned IDs)", () => {
    // claude-3-5-sonnet-20241022 should match claude-3-5-sonnet-20241022 exactly
    const result = calculateCost("claude-3-5-sonnet-20241022", {
      inputTokens: 1_000_000,
      outputTokens: 0,
    });
    expect(result.known).toBe(true);
    expect(result.provider).toBe("anthropic");
  });
});

describe("detectProvider", () => {
  it("detects openai from gpt- prefix", () => {
    expect(detectProvider("gpt-4o")).toBe("openai");
    expect(detectProvider("gpt-4o-mini")).toBe("openai");
    expect(detectProvider("gpt-3.5-turbo")).toBe("openai");
  });

  it("detects openai from o1/o3 prefix", () => {
    expect(detectProvider("o1")).toBe("openai");
    expect(detectProvider("o1-mini")).toBe("openai");
    expect(detectProvider("o3-mini")).toBe("openai");
  });

  it("detects anthropic from claude- prefix", () => {
    expect(detectProvider("claude-opus-4-7")).toBe("anthropic");
    expect(detectProvider("claude-3-5-sonnet-20241022")).toBe("anthropic");
  });

  it("detects google from gemini- prefix", () => {
    expect(detectProvider("gemini-2.5-pro")).toBe("google");
    expect(detectProvider("gemini-1.5-flash")).toBe("google");
  });

  it("returns null for unknown model", () => {
    expect(detectProvider("llama-3-70b")).toBeNull();
    expect(detectProvider("")).toBeNull();
  });
});

describe("PROVIDER_BASE_URLS", () => {
  it("contains valid HTTPS URLs for all providers", () => {
    for (const [, url] of Object.entries(PROVIDER_BASE_URLS)) {
      expect(url).toMatch(/^https:\/\//);
    }
  });
});
