/**
 * Kaelus Streaming Gateway — Anthropic Provider Adapter
 *
 * Handles communication with the Anthropic Messages API in streaming mode.
 *
 * Anthropic uses a typed SSE event protocol rather than OpenAI's flat JSON stream.
 * Each SSE frame has both an `event:` type and a `data:` JSON payload:
 *
 *   event: message_start
 *   data: {"type":"message_start","message":{"id":"msg_...","usage":{"input_tokens":25},...}}
 *
 *   event: content_block_start
 *   data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}
 *
 *   event: content_block_delta
 *   data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}
 *
 *   event: message_delta
 *   data: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":15}}
 *
 *   event: message_stop
 *   data: {"type":"message_stop"}
 *
 * This adapter normalizes all of the above into Kaelus `StreamToken` objects.
 *
 * Supported models:
 *   claude-sonnet-4-20250514, claude-3-5-haiku-20241022, claude-3-opus-20240229
 */

import type {
  ProviderAdapter,
  ProviderName,
  StreamRequest,
  StreamToken,
  TokenUsage,
  ChatMessage,
} from "./types";
import { getAnthropicApiKey } from "../../secrets-manager";

// ---------------------------------------------------------------------------
// Anthropic SSE event types
// ---------------------------------------------------------------------------

interface AnthropicMessageStart {
  type: "message_start";
  message: {
    id: string;
    type: string;
    role: string;
    model: string;
    content: unknown[];
    usage: {
      input_tokens: number;
      output_tokens: number;
    };
  };
}

interface AnthropicContentBlockDelta {
  type: "content_block_delta";
  index: number;
  delta: {
    type: "text_delta";
    text: string;
  };
}

interface AnthropicMessageDelta {
  type: "message_delta";
  delta: {
    stop_reason: string | null;
    stop_sequence: string | null;
  };
  usage: {
    output_tokens: number;
  };
}

interface AnthropicMessageStop {
  type: "message_stop";
}

interface AnthropicContentBlockStart {
  type: "content_block_start";
  index: number;
  content_block: {
    type: string;
    text: string;
  };
}

interface AnthropicContentBlockStop {
  type: "content_block_stop";
  index: number;
}

type AnthropicEvent =
  | AnthropicMessageStart
  | AnthropicContentBlockStart
  | AnthropicContentBlockDelta
  | AnthropicContentBlockStop
  | AnthropicMessageDelta
  | AnthropicMessageStop;

// ---------------------------------------------------------------------------
// Adapter implementation
// ---------------------------------------------------------------------------

/**
 * Anthropic provider adapter.
 *
 * Stateless and thread-safe. Handles the Anthropic Messages API streaming
 * protocol, converting typed SSE events into normalized Kaelus tokens.
 */
export const anthropicAdapter: ProviderAdapter = {
  name: "anthropic" as ProviderName,

  /**
   * Builds an Anthropic Messages API request.
   *
   * Key differences from OpenAI:
   * - Auth uses `x-api-key` header (not Bearer token)
   * - Requires `anthropic-version` header
   * - System message is a top-level `system` param, not a message
   * - Max tokens is required (not optional)
   */
  buildRequest(req: StreamRequest): {
    url: string;
    headers: Record<string, string>;
    body: string;
  } {
    const url = "https://api.anthropic.com/v1/messages";

    // getAnthropicApiKey reads process.env — no true async needed at build-request time.
    const apiKey = req.api_key ||
      process.env.ANTHROPIC_API_KEY_PRIMARY ||
      process.env.ANTHROPIC_API_KEY ||
      "";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    };

    // Anthropic requires the system message as a separate top-level parameter.
    // Extract it from the messages array if present.
    const { systemPrompt, conversationMessages } = extractSystemMessage(req.messages);

    const body: Record<string, unknown> = {
      model: req.model,
      messages: conversationMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
      // Anthropic requires max_tokens — default to a generous limit.
      // 4096 is a safe default that works across all Claude models.
      max_tokens: req.max_tokens ?? 4096,
    };

    if (systemPrompt) {
      body.system = systemPrompt;
    }

    if (req.temperature !== undefined) {
      body.temperature = req.temperature;
    }

    return { url, headers, body: JSON.stringify(body) };
  },

  /**
   * Parses a single SSE `data:` payload from the Anthropic stream.
   *
   * Only `content_block_delta` events produce content tokens.
   * `message_delta` events carry the finish reason.
   * All other event types return `null`.
   */
  parseStreamChunk(chunk: string): StreamToken | null {
    const trimmed = chunk.trim();
    if (trimmed === "" || trimmed === "[DONE]") return null;

    let parsed: AnthropicEvent;
    try {
      parsed = JSON.parse(trimmed) as AnthropicEvent;
    } catch {
      console.warn("[kaelus:anthropic] Failed to parse SSE chunk:", trimmed.slice(0, 200));
      return null;
    }

    switch (parsed.type) {
      case "content_block_delta": {
        // This is the main content event — contains actual generated text
        if (parsed.delta.type !== "text_delta") return null;
        return {
          content: parsed.delta.text,
          index: parsed.index,
          finish_reason: null,
          model: "", // Model is only in message_start; proxy tracks it
          provider: "anthropic",
        };
      }

      case "message_delta": {
        // End-of-message event with stop reason
        return {
          content: "",
          index: 0,
          finish_reason: parsed.delta.stop_reason ?? "end_turn",
          model: "",
          provider: "anthropic",
        };
      }

      case "message_start":
      case "content_block_start":
      case "content_block_stop":
      case "message_stop":
        // Control events — no content to emit
        return null;

      default:
        // Unknown event type — log and skip
        return null;
    }
  },

  /**
   * Extracts token usage from Anthropic SSE events.
   *
   * Usage appears in two places:
   * - `message_start` contains `input_tokens` (prompt tokens)
   * - `message_delta` contains `output_tokens` (completion tokens)
   *
   * We extract from both and let the proxy merge them.
   * For simplicity, we return the fullest usage object we can build
   * from a single chunk.
   */
  extractUsage(chunk: string): TokenUsage | null {
    const trimmed = chunk.trim();
    if (trimmed === "" || trimmed === "[DONE]") return null;

    try {
      const parsed = JSON.parse(trimmed) as AnthropicEvent;

      if (parsed.type === "message_start" && parsed.message?.usage) {
        return {
          prompt_tokens: parsed.message.usage.input_tokens,
          completion_tokens: parsed.message.usage.output_tokens,
          total_tokens:
            parsed.message.usage.input_tokens +
            parsed.message.usage.output_tokens,
        };
      }

      if (parsed.type === "message_delta" && parsed.usage) {
        // message_delta only has output_tokens — prompt_tokens comes from message_start.
        // Return what we have; the proxy accumulates both.
        return {
          prompt_tokens: 0, // Will be merged with message_start data
          completion_tokens: parsed.usage.output_tokens,
          total_tokens: parsed.usage.output_tokens,
        };
      }
    } catch {
      // Not valid JSON or unexpected shape — that's fine
    }

    return null;
  },
};

// ---------------------------------------------------------------------------
// Helper: Extract system message
// ---------------------------------------------------------------------------

/**
 * Separates the system message from conversation messages.
 *
 * OpenAI/Kaelus format puts system as a message with role "system".
 * Anthropic requires it as a separate top-level `system` parameter.
 * This function performs that conversion.
 */
function extractSystemMessage(messages: ChatMessage[]): {
  systemPrompt: string | null;
  conversationMessages: ChatMessage[];
} {
  const systemMessages = messages.filter((m) => m.role === "system");
  const conversationMessages = messages.filter((m) => m.role !== "system");

  const systemPrompt =
    systemMessages.length > 0
      ? systemMessages.map((m) => m.content).join("\n\n")
      : null;

  return { systemPrompt, conversationMessages };
}

// ---------------------------------------------------------------------------
// Supported models
// ---------------------------------------------------------------------------

/**
 * Models officially supported through this adapter.
 *
 * Anthropic uses date-stamped model identifiers. We include both the
 * specific version and any stable aliases where applicable.
 */
export const ANTHROPIC_MODELS = [
  "claude-sonnet-4-20250514",
  "claude-3-5-haiku-20241022",
  "claude-3-opus-20240229",
  "claude-3-5-sonnet-20241022",
  "claude-3-haiku-20240307",
] as const;

export type AnthropicModel = (typeof ANTHROPIC_MODELS)[number];
