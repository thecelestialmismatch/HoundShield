// Prices in USD per 1,000,000 tokens (per-million avoids float precision loss at small counts)
// Sources: OpenAI pricing page, Anthropic pricing page, Google AI pricing page — 2025-05-13

export type Provider = "openai" | "anthropic" | "google";

export interface ModelPricing {
  provider: Provider;
  model: string;
  /** Canonical model ID as used in API requests */
  modelId: string;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  /** Cached input price (e.g. OpenAI prompt caching, Anthropic cache read) */
  cachedInputPricePerMillion?: number;
}

export const PRICING: readonly ModelPricing[] = [
  // ── OpenAI ──────────────────────────────────────────────────────────────
  {
    provider: "openai",
    model: "GPT-4o",
    modelId: "gpt-4o",
    inputPricePerMillion: 2.5,
    outputPricePerMillion: 10.0,
    cachedInputPricePerMillion: 1.25,
  },
  {
    provider: "openai",
    model: "GPT-4o mini",
    modelId: "gpt-4o-mini",
    inputPricePerMillion: 0.15,
    outputPricePerMillion: 0.6,
    cachedInputPricePerMillion: 0.075,
  },
  {
    provider: "openai",
    model: "o1",
    modelId: "o1",
    inputPricePerMillion: 15.0,
    outputPricePerMillion: 60.0,
    cachedInputPricePerMillion: 7.5,
  },
  {
    provider: "openai",
    model: "o1 mini",
    modelId: "o1-mini",
    inputPricePerMillion: 1.1,
    outputPricePerMillion: 4.4,
    cachedInputPricePerMillion: 0.55,
  },
  {
    provider: "openai",
    model: "o3 mini",
    modelId: "o3-mini",
    inputPricePerMillion: 1.1,
    outputPricePerMillion: 4.4,
    cachedInputPricePerMillion: 0.55,
  },
  {
    provider: "openai",
    model: "GPT-4 Turbo",
    modelId: "gpt-4-turbo",
    inputPricePerMillion: 10.0,
    outputPricePerMillion: 30.0,
  },
  {
    provider: "openai",
    model: "GPT-3.5 Turbo",
    modelId: "gpt-3.5-turbo",
    inputPricePerMillion: 0.5,
    outputPricePerMillion: 1.5,
  },

  // ── Anthropic ────────────────────────────────────────────────────────────
  {
    provider: "anthropic",
    model: "Claude Opus 4.7",
    modelId: "claude-opus-4-7",
    inputPricePerMillion: 15.0,
    outputPricePerMillion: 75.0,
    cachedInputPricePerMillion: 1.5,
  },
  {
    provider: "anthropic",
    model: "Claude Sonnet 4.6",
    modelId: "claude-sonnet-4-6",
    inputPricePerMillion: 3.0,
    outputPricePerMillion: 15.0,
    cachedInputPricePerMillion: 0.3,
  },
  {
    provider: "anthropic",
    model: "Claude Haiku 4.5",
    modelId: "claude-haiku-4-5-20251001",
    inputPricePerMillion: 0.8,
    outputPricePerMillion: 4.0,
    cachedInputPricePerMillion: 0.08,
  },
  {
    provider: "anthropic",
    model: "Claude Opus 3",
    modelId: "claude-3-opus-20240229",
    inputPricePerMillion: 15.0,
    outputPricePerMillion: 75.0,
    cachedInputPricePerMillion: 1.5,
  },
  {
    provider: "anthropic",
    model: "Claude Sonnet 3.5",
    modelId: "claude-3-5-sonnet-20241022",
    inputPricePerMillion: 3.0,
    outputPricePerMillion: 15.0,
    cachedInputPricePerMillion: 0.3,
  },
  {
    provider: "anthropic",
    model: "Claude Haiku 3.5",
    modelId: "claude-3-5-haiku-20241022",
    inputPricePerMillion: 0.8,
    outputPricePerMillion: 4.0,
    cachedInputPricePerMillion: 0.08,
  },

  // ── Google ───────────────────────────────────────────────────────────────
  {
    provider: "google",
    model: "Gemini 2.5 Pro",
    modelId: "gemini-2.5-pro",
    inputPricePerMillion: 1.25,  // ≤200k ctx
    outputPricePerMillion: 10.0,
    cachedInputPricePerMillion: 0.3125,
  },
  {
    provider: "google",
    model: "Gemini 2.5 Flash",
    modelId: "gemini-2.5-flash",
    inputPricePerMillion: 0.075,
    outputPricePerMillion: 0.3,
    cachedInputPricePerMillion: 0.01875,
  },
  {
    provider: "google",
    model: "Gemini 1.5 Pro",
    modelId: "gemini-1.5-pro",
    inputPricePerMillion: 1.25,
    outputPricePerMillion: 5.0,
    cachedInputPricePerMillion: 0.3125,
  },
  {
    provider: "google",
    model: "Gemini 1.5 Flash",
    modelId: "gemini-1.5-flash",
    inputPricePerMillion: 0.075,
    outputPricePerMillion: 0.3,
    cachedInputPricePerMillion: 0.01875,
  },
] as const;

/** Lookup by modelId — O(n) but table is tiny and results are hot-cached by JS engine */
function findPricing(modelId: string): ModelPricing | undefined {
  const lower = modelId.toLowerCase();
  return PRICING.find(
    (p) => p.modelId === lower || lower.startsWith(p.modelId)
  );
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens?: number;
}

export interface CostResult {
  costUsd: number;
  modelId: string;
  provider: Provider | "unknown";
  known: boolean;
}

/**
 * Calculate cost for a single API call.
 * Returns cost=0 with known=false when model is unrecognized so callers can decide how to handle.
 */
export function calculateCost(modelId: string, usage: TokenUsage): CostResult {
  const pricing = findPricing(modelId);

  if (!pricing) {
    return { costUsd: 0, modelId, provider: "unknown", known: false };
  }

  const inputCost =
    (usage.inputTokens / 1_000_000) * pricing.inputPricePerMillion;
  const outputCost =
    (usage.outputTokens / 1_000_000) * pricing.outputPricePerMillion;
  const cachedCost =
    usage.cachedInputTokens && pricing.cachedInputPricePerMillion
      ? (usage.cachedInputTokens / 1_000_000) *
        pricing.cachedInputPricePerMillion
      : 0;

  return {
    costUsd: inputCost + outputCost + cachedCost,
    modelId: pricing.modelId,
    provider: pricing.provider,
    known: true,
  };
}

/** Detect provider from modelId prefix — used to route proxy requests */
export function detectProvider(modelId: string): Provider | null {
  const lower = modelId.toLowerCase();
  if (lower.startsWith("gpt-") || lower.startsWith("o1") || lower.startsWith("o3")) {
    return "openai";
  }
  if (lower.startsWith("claude-")) return "anthropic";
  if (lower.startsWith("gemini-")) return "google";
  return null;
}

/** Upstream base URLs per provider */
export const PROVIDER_BASE_URLS: Record<Provider, string> = {
  openai: "https://api.openai.com",
  anthropic: "https://api.anthropic.com",
  google: "https://generativelanguage.googleapis.com",
};
