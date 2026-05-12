/**
 * Hound Shield Streaming Gateway — OpenAI Provider Adapter
 *
 * Handles communication with the OpenAI Chat Completions API in streaming mode.
 *
 * SSE format from OpenAI:
 *   data: {"id":"chatcmpl-...","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}
 *   ...
 *   data: [DONE]
 *
 * The adapter normalizes this into Hound Shield `StreamToken` objects, handling:
 * - Content deltas from `choices[0].delta.content`
 * - Finish reasons ("stop", "length", "content_filter", "tool_calls")
 * - Usage extraction from the final chunk (when `stream_options.include_usage` is set)
 * - The `[DONE]` sentinel that signals end of stream
 *
 * Supported models:
 *   gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo, o1, o3-mini
 */

import type {
  ProviderAdapter,
  ProviderName,
  StreamRequest,
  StreamToken,
  TokenUsage,
} from "./types";

// ---------------------------------------------------------------------------
// OpenAI SSE response types (subset relevant to streaming)
// ---------------------------------------------------------------------------

interface OpenAIDelta {
  role?: string;
  content?: string | null;
  tool_calls?: unknown[];
}

interface OpenAIChoice {
  index: number;
  delta: OpenAIDelta;
  finish_reason: string | null;
}

interface OpenAIStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIChoice[];
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
 * OpenAI provider adapter.
 *
 * Stateless — a single instance is reused for all OpenAI requests.
 * Thread-safe because it holds no mutable state.
 */
export const openaiAdapter: ProviderAdapter = {
  name: "openai" as ProviderName,

  /**
   * Builds an OpenAI Chat Completions API request.
   *
   * We always enable `stream_options.include_usage` so the final chunk
   * contains token counts — this powers Hound Shield usage dashboards without
   * requiring a separate API call.
   */
  buildRequest(req: StreamRequest): {
    url: string;
    headers: Record<string, string>;
    body: string;
  } {
    const url = "https://api.openai.com/v1/chat/completions";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${req.api_key}`,
    };

    const body: Record<string, unknown> = {
      model: req.model,
      messages: req.messages.map((m) => ({
        role: m.role,
        content: m.content,
        ...(m.name ? { name: m.name } : {}),
      })),
      stream: true,
      // Ask OpenAI to include token usage in the final SSE chunk.
      // This avoids a separate billing/usage API call.
      stream_options: { include_usage: true },
    };

    // Only include optional params if explicitly set — sending undefined
    // values can cause 400 errors on some OpenAI model variants.
    if (req.temperature !== undefined) body.temperature = req.temperature;
    if (req.max_tokens !== undefined) body.max_tokens = req.max_tokens;

    return { url, headers, body: JSON.stringify(body) };
  },

  /**
   * Parses a single SSE `data:` payload from the OpenAI stream.
   *
   * Returns `null` for:
   * - The `[DONE]` sentinel
   * - Chunks with no content delta (e.g. role-only first chunk)
   * - Malformed JSON (logged but not thrown — we don't want one bad
   *   chunk to kill the entire stream)
   */
  parseStreamChunk(chunk: string): StreamToken | null {
    // OpenAI signals end-of-stream with a literal `[DONE]` data payload
    const trimmed = chunk.trim();
    if (trimmed === "[DONE]") return null;

    // Empty lines between SSE frames
    if (trimmed === "") return null;

    let parsed: OpenAIStreamChunk;
    try {
      parsed = JSON.parse(trimmed) as OpenAIStreamChunk;
    } catch {
      // Malformed chunk — log and skip rather than crashing the stream.
      // This handles edge cases like partial JSON from chunked transfer encoding.
      console.warn("[houndshield:openai] Failed to parse SSE chunk:", trimmed.slice(0, 200));
      return null;
    }

    // Validate structure
    if (!parsed.choices || parsed.choices.length === 0) {
      // Usage-only final chunk (no choices) — return null for content,
      // usage is extracted separately via `extractUsage`.
      return null;
    }

    const choice = parsed.choices[0];
    const content = choice.delta?.content;

    // Skip chunks that are role-only (first chunk) or have no content
    if (content === undefined || content === null) {
      // Still propagate finish_reason if present (stream end without final content)
      if (choice.finish_reason) {
        return {
          content: "",
          index: choice.index,
          finish_reason: choice.finish_reason,
          model: parsed.model,
          provider: "openai",
        };
      }
      return null;
    }

    return {
      content,
      index: choice.index,
      finish_reason: choice.finish_reason,
      model: parsed.model,
      provider: "openai",
    };
  },

  /**
   * Extracts token usage from an OpenAI SSE chunk.
   *
   * Usage is only present in the final chunk when `stream_options.include_usage`
   * was set in the request. We attempt extraction on every chunk (cheap) so the
   * proxy doesn't need to know which chunk is "final".
   */
  extractUsage(chunk: string): TokenUsage | null {
    const trimmed = chunk.trim();
    if (trimmed === "[DONE]" || trimmed === "") return null;

    try {
      const parsed = JSON.parse(trimmed) as OpenAIStreamChunk;

      if (parsed.usage) {
        return {
          prompt_tokens: parsed.usage.prompt_tokens,
          completion_tokens: parsed.usage.completion_tokens,
          total_tokens: parsed.usage.total_tokens,
        };
      }
    } catch {
      // Not valid JSON or no usage — that's fine
    }

    return null;
  },
};

// ---------------------------------------------------------------------------
// Supported models
// ---------------------------------------------------------------------------

/**
 * Models officially supported through this adapter.
 *
 * This list is used for validation in the provider registry. Models not
 * in this list can still be used by specifying `provider: "custom"` —
 * this adapter is also the basis for OpenAI-compatible endpoints.
 */
export const OPENAI_MODELS = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4-turbo",
  "gpt-4-turbo-preview",
  "gpt-3.5-turbo",
  "o1",
  "o1-mini",
  "o1-preview",
  "o3-mini",
] as const;

export type OpenAIModel = (typeof OPENAI_MODELS)[number];
