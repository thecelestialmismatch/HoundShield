/**
 * Kaelus Streaming Gateway — OpenRouter Provider Adapter
 *
 * OpenRouter (https://openrouter.ai) is a unified API that provides access to
 * 200+ LLM models from OpenAI, Anthropic, Google, Meta, Mistral, and more
 * through a single endpoint and API key.
 *
 * This is a STRATEGIC provider for Kaelus because:
 * 1. Users only need ONE API key (OpenRouter) to access all models
 * 2. OpenRouter handles provider-level rate limits and fallbacks
 * 3. It supports the OpenAI-compatible format, so we reuse parsing logic
 * 4. It's the simplest path to multi-model compliance scanning
 *
 * SSE format: Identical to OpenAI (OpenRouter is OpenAI-compatible)
 *   data: {"id":"gen-...","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}
 *   ...
 *   data: [DONE]
 *
 * Popular models available through OpenRouter:
 *   - openai/gpt-4o, openai/gpt-4o-mini, openai/o1
 *   - anthropic/claude-sonnet-4-20250514, anthropic/claude-3.5-haiku
 *   - google/gemini-2.0-flash, google/gemini-1.5-pro
 *   - meta-llama/llama-3.3-70b-instruct
 *   - mistralai/mistral-large
 *   - deepseek/deepseek-r1, deepseek/deepseek-chat
 *   - And 200+ more
 *
 * Authentication: Bearer token via Authorization header.
 * Get your key at: https://openrouter.ai/settings/keys
 */

import type {
  ProviderAdapter,
  ProviderName,
  StreamRequest,
  StreamToken,
  TokenUsage,
} from "./types";

// ---------------------------------------------------------------------------
// OpenRouter SSE types (OpenAI-compatible)
// ---------------------------------------------------------------------------

interface OpenRouterDelta {
  role?: string;
  content?: string | null;
}

interface OpenRouterChoice {
  index: number;
  delta: OpenRouterDelta;
  finish_reason: string | null;
}

interface OpenRouterStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenRouterChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ---------------------------------------------------------------------------
// Adapter implementation
// ---------------------------------------------------------------------------

/**
 * OpenRouter provider adapter.
 *
 * Uses the OpenAI-compatible API at https://openrouter.ai/api/v1/chat/completions.
 * Supports ALL models available on OpenRouter — the model name is passed through
 * directly (e.g., "anthropic/claude-sonnet-4-20250514", "openai/gpt-4o").
 *
 * Stateless and thread-safe.
 */
export const openrouterAdapter: ProviderAdapter = {
  name: "openrouter" as ProviderName,

  /**
   * Builds an OpenRouter Chat Completions request.
   *
   * Key differences from raw OpenAI:
   * - Endpoint: https://openrouter.ai/api/v1/chat/completions
   * - Adds HTTP-Referer and X-Title headers for OpenRouter analytics
   * - Model names include provider prefix (e.g., "openai/gpt-4o")
   * - Supports stream_options.include_usage for token counting
   */
  buildRequest(req: StreamRequest): {
    url: string;
    headers: Record<string, string>;
    body: string;
  } {
    const url = "https://openrouter.ai/api/v1/chat/completions";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${req.api_key}`,
      // OpenRouter analytics headers — these help with rate limits
      "HTTP-Referer": "https://kaelus.online",
      "X-Title": "Kaelus AI Compliance Gateway",
    };

    const body: Record<string, unknown> = {
      model: req.model,
      messages: req.messages.map((m) => ({
        role: m.role,
        content: m.content,
        ...(m.name ? { name: m.name } : {}),
      })),
      stream: true,
      stream_options: { include_usage: true },
    };

    if (req.temperature !== undefined) body.temperature = req.temperature;
    if (req.max_tokens !== undefined) body.max_tokens = req.max_tokens;

    return { url, headers, body: JSON.stringify(body) };
  },

  /**
   * Parses a single SSE `data:` payload from the OpenRouter stream.
   *
   * The format is identical to OpenAI's — OpenRouter is fully compatible.
   * We reuse the same parsing logic, just tagged as "openrouter" provider.
   */
  parseStreamChunk(chunk: string): StreamToken | null {
    const trimmed = chunk.trim();
    if (trimmed === "[DONE]" || trimmed === "") return null;

    let parsed: OpenRouterStreamChunk;
    try {
      parsed = JSON.parse(trimmed) as OpenRouterStreamChunk;
    } catch {
      console.warn("[kaelus:openrouter] Failed to parse SSE chunk:", trimmed.slice(0, 200));
      return null;
    }

    if (!parsed.choices || parsed.choices.length === 0) {
      return null;
    }

    const choice = parsed.choices[0];
    const content = choice.delta?.content;

    if (content === undefined || content === null) {
      if (choice.finish_reason) {
        return {
          content: "",
          index: choice.index,
          finish_reason: choice.finish_reason,
          model: parsed.model,
          provider: "openrouter" as ProviderName,
        };
      }
      return null;
    }

    return {
      content,
      index: choice.index,
      finish_reason: choice.finish_reason,
      model: parsed.model,
      provider: "openrouter" as ProviderName,
    };
  },

  /**
   * Extracts token usage from an OpenRouter SSE chunk.
   * Present in the final chunk when stream_options.include_usage is set.
   */
  extractUsage(chunk: string): TokenUsage | null {
    const trimmed = chunk.trim();
    if (trimmed === "[DONE]" || trimmed === "") return null;

    try {
      const parsed = JSON.parse(trimmed) as OpenRouterStreamChunk;
      if (parsed.usage) {
        return {
          prompt_tokens: parsed.usage.prompt_tokens,
          completion_tokens: parsed.usage.completion_tokens,
          total_tokens: parsed.usage.total_tokens,
        };
      }
    } catch {
      // Not valid JSON or no usage
    }

    return null;
  },
};

// ---------------------------------------------------------------------------
// Popular models (curated subset — OpenRouter supports 200+)
// ---------------------------------------------------------------------------

/**
 * Curated list of popular models available through OpenRouter.
 *
 * This is NOT exhaustive — OpenRouter supports any model listed at
 * https://openrouter.ai/models. Users can specify any valid model ID.
 */
export const OPENROUTER_MODELS = [
  // OpenAI
  "openai/gpt-4o",
  "openai/gpt-4o-mini",
  "openai/o1",
  "openai/o3-mini",
  "openai/gpt-4-turbo",
  // Anthropic
  "anthropic/claude-sonnet-4-20250514",
  "anthropic/claude-3.5-haiku",
  "anthropic/claude-3-opus",
  // Google
  "google/gemini-2.0-flash",
  "google/gemini-1.5-pro",
  "google/gemini-1.5-flash",
  // Meta
  "meta-llama/llama-3.3-70b-instruct",
  "meta-llama/llama-3.1-405b-instruct",
  // Mistral
  "mistralai/mistral-large",
  "mistralai/mistral-small",
  // DeepSeek
  "deepseek/deepseek-r1",
  "deepseek/deepseek-chat",
  // Qwen
  "qwen/qwen-2.5-72b-instruct",
] as const;

export type OpenRouterModel = (typeof OPENROUTER_MODELS)[number];
