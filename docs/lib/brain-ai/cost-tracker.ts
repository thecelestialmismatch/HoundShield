/**
 * Brain AI — Cost Tracker
 *
 * Tracks token usage and API costs per session and model.
 * Brain AI original implementation for Hound Shield.
 */

export interface ModelPricing {
  inputPer1k: number;   // USD per 1,000 input tokens
  outputPer1k: number;  // USD per 1,000 output tokens
}

// Pricing table (USD) — sourced from OpenRouter public pricing
export const BRAIN_AI_PRICING: Record<string, ModelPricing> = {
  // Free models
  "google/gemini-flash-1.5": { inputPer1k: 0, outputPer1k: 0 },
  "meta-llama/llama-3.3-70b-instruct:free": { inputPer1k: 0, outputPer1k: 0 },
  "deepseek/deepseek-chat": { inputPer1k: 0, outputPer1k: 0 },
  "qwen/qwen-2.5-72b-instruct:free": { inputPer1k: 0, outputPer1k: 0 },
  "microsoft/phi-3-medium-128k-instruct:free": { inputPer1k: 0, outputPer1k: 0 },
  // Paid models
  "anthropic/claude-sonnet-4-6": { inputPer1k: 0.003, outputPer1k: 0.015 },
  "openai/gpt-4o": { inputPer1k: 0.005, outputPer1k: 0.015 },
  "openai/gpt-4o-mini": { inputPer1k: 0.00015, outputPer1k: 0.0006 },
  "google/gemini-pro-1.5": { inputPer1k: 0.00125, outputPer1k: 0.005 },
  "anthropic/claude-3-haiku": { inputPer1k: 0.00025, outputPer1k: 0.00125 },
};

export interface CostEntry {
  sessionId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  timestamp: number;
}

export interface SessionCostSummary {
  sessionId: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  byModel: Record<string, { tokens: number; costUsd: number }>;
  entries: CostEntry[];
}

// In-memory store (indexed by sessionId)
const costStore = new Map<string, CostEntry[]>();

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = BRAIN_AI_PRICING[model] ?? { inputPer1k: 0.001, outputPer1k: 0.002 };
  return (
    (inputTokens / 1000) * pricing.inputPer1k +
    (outputTokens / 1000) * pricing.outputPer1k
  );
}

export function recordCost(
  sessionId: string,
  model: string,
  inputTokens: number,
  outputTokens: number
): CostEntry {
  const entry: CostEntry = {
    sessionId,
    model,
    inputTokens,
    outputTokens,
    costUsd: calculateCost(model, inputTokens, outputTokens),
    timestamp: Date.now(),
  };

  const existing = costStore.get(sessionId) ?? [];
  costStore.set(sessionId, [...existing, entry]);
  return entry;
}

export function getSessionCostSummary(sessionId: string): SessionCostSummary {
  const entries = costStore.get(sessionId) ?? [];
  const byModel: Record<string, { tokens: number; costUsd: number }> = {};

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCostUsd = 0;

  for (const entry of entries) {
    totalInputTokens += entry.inputTokens;
    totalOutputTokens += entry.outputTokens;
    totalCostUsd += entry.costUsd;

    const existing = byModel[entry.model] ?? { tokens: 0, costUsd: 0 };
    byModel[entry.model] = {
      tokens: existing.tokens + entry.inputTokens + entry.outputTokens,
      costUsd: existing.costUsd + entry.costUsd,
    };
  }

  return {
    sessionId,
    totalInputTokens,
    totalOutputTokens,
    totalCostUsd,
    byModel,
    entries,
  };
}

export function getTotalCostAllSessions(): number {
  let total = 0;
  for (const entries of costStore.values()) {
    for (const entry of entries) {
      total += entry.costUsd;
    }
  }
  return total;
}

export function formatCostUsd(costUsd: number): string {
  if (costUsd === 0) return "$0.00";
  if (costUsd < 0.001) return `$${(costUsd * 1000).toFixed(3)}m`;
  return `$${costUsd.toFixed(4)}`;
}
