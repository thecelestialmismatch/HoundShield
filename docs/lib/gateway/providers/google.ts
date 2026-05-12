/**
 * Hound Shield Streaming Gateway — Google Gemini Provider Adapter
 *
 * Handles communication with the Google Generative Language API (Gemini)
 * in streaming mode.
 *
 * Gemini uses a different authentication and message format than OpenAI/Anthropic:
 * - API key is passed as a URL query parameter (not a header)
 * - Messages use "parts" with "text" fields instead of "content" strings
 * - Roles are "user" and "model" (not "user" and "assistant")
 * - System instructions are a separate top-level field
 * - Streaming uses `streamGenerateContent` with `alt=sse`
 *
 * SSE format from Gemini:
 *   data: {"candidates":[{"content":{"parts":[{"text":"Hello"}],"role":"model"},"index":0}],...}
 *   ...
 *   data: {"candidates":[{"content":{"parts":[{"text":"!"}],"role":"model"},"finishReason":"STOP","index":0}],"usageMetadata":{...}}
 *
 * Supported models:
 *   gemini-2.0-flash, gemini-1.5-pro, gemini-1.5-flash
 */

import type {
  ProviderAdapter,
  ProviderName,
  StreamRequest,
  StreamToken,
  TokenUsage,
  ChatMessage,
} from "./types";

// ---------------------------------------------------------------------------
// Gemini API types (subset relevant to streaming)
// ---------------------------------------------------------------------------

interface GeminiPart {
  text?: string;
}

interface GeminiContent {
  parts: GeminiPart[];
  role: string;
}

interface GeminiCandidate {
  content: GeminiContent;
  finishReason?: string;
  index: number;
  safetyRatings?: Array<{
    category: string;
    probability: string;
  }>;
}

interface GeminiUsageMetadata {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

interface GeminiStreamChunk {
  candidates?: GeminiCandidate[];
  usageMetadata?: GeminiUsageMetadata;
  modelVersion?: string;
}

// ---------------------------------------------------------------------------
// Gemini message format types
// ---------------------------------------------------------------------------

interface GeminiMessage {
  role: "user" | "model";
  parts: GeminiPart[];
}

interface GeminiRequestBody {
  contents: GeminiMessage[];
  systemInstruction?: {
    parts: GeminiPart[];
  };
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    candidateCount?: number;
  };
}

// ---------------------------------------------------------------------------
// Adapter implementation
// ---------------------------------------------------------------------------

/**
 * Google Gemini provider adapter.
 *
 * Stateless and thread-safe. Converts between the OpenAI-style message
 * format used internally by Hound Shield and Gemini's native format.
 */
export const googleAdapter: ProviderAdapter = {
  name: "google" as ProviderName,

  /**
   * Builds a Gemini streamGenerateContent request.
   *
   * Key differences from OpenAI/Anthropic:
   * - API key goes in the URL (not a header) per Google's convention
   * - Messages must be converted from OpenAI format to Gemini format
   * - System instructions use a dedicated field
   * - `alt=sse` query param enables SSE streaming mode
   */
  buildRequest(req: StreamRequest): {
    url: string;
    headers: Record<string, string>;
    body: string;
  } {
    // Gemini passes the API key as a URL parameter.
    // The model name is part of the URL path.
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${req.model}` +
      `:streamGenerateContent?alt=sse&key=${req.api_key}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Convert OpenAI-format messages to Gemini format
    const { systemInstruction, contents } = convertToGeminiFormat(req.messages);

    const body: GeminiRequestBody = {
      contents,
    };

    if (systemInstruction) {
      body.systemInstruction = systemInstruction;
    }

    // Generation config
    const generationConfig: GeminiRequestBody["generationConfig"] = {};
    if (req.temperature !== undefined) {
      generationConfig.temperature = req.temperature;
    }
    if (req.max_tokens !== undefined) {
      generationConfig.maxOutputTokens = req.max_tokens;
    }

    if (Object.keys(generationConfig).length > 0) {
      body.generationConfig = generationConfig;
    }

    return { url, headers, body: JSON.stringify(body) };
  },

  /**
   * Parses a single SSE `data:` payload from the Gemini stream.
   *
   * Gemini wraps content in `candidates[0].content.parts[0].text`.
   * The `finishReason` field appears on the final candidate chunk.
   */
  parseStreamChunk(chunk: string): StreamToken | null {
    const trimmed = chunk.trim();
    if (trimmed === "" || trimmed === "[DONE]") return null;

    let parsed: GeminiStreamChunk;
    try {
      parsed = JSON.parse(trimmed) as GeminiStreamChunk;
    } catch {
      console.warn("[houndshield:google] Failed to parse SSE chunk:", trimmed.slice(0, 200));
      return null;
    }

    // No candidates means this is a usage-only or error chunk
    if (!parsed.candidates || parsed.candidates.length === 0) {
      return null;
    }

    const candidate = parsed.candidates[0];

    // Extract text from parts — Gemini can return multiple parts,
    // but for text generation there's typically just one.
    const text = candidate.content?.parts
      ?.map((p) => p.text ?? "")
      .join("") ?? "";

    // Map Gemini finish reasons to our normalized format
    const finishReason = mapGeminiFinishReason(candidate.finishReason);

    // Skip empty chunks with no finish reason
    if (text === "" && !finishReason) return null;

    return {
      content: text,
      index: candidate.index,
      finish_reason: finishReason,
      model: parsed.modelVersion ?? "",
      provider: "google",
    };
  },

  /**
   * Extracts token usage from a Gemini SSE chunk.
   *
   * Gemini includes `usageMetadata` in chunks (often the final one).
   * Field names differ from OpenAI: `promptTokenCount`, `candidatesTokenCount`.
   */
  extractUsage(chunk: string): TokenUsage | null {
    const trimmed = chunk.trim();
    if (trimmed === "" || trimmed === "[DONE]") return null;

    try {
      const parsed = JSON.parse(trimmed) as GeminiStreamChunk;

      if (parsed.usageMetadata) {
        return {
          prompt_tokens: parsed.usageMetadata.promptTokenCount ?? 0,
          completion_tokens: parsed.usageMetadata.candidatesTokenCount ?? 0,
          total_tokens: parsed.usageMetadata.totalTokenCount ?? 0,
        };
      }
    } catch {
      // Not valid JSON or no usage — that's fine
    }

    return null;
  },
};

// ---------------------------------------------------------------------------
// Message format conversion
// ---------------------------------------------------------------------------

/**
 * Converts OpenAI-style messages to Gemini's native format.
 *
 * Key conversions:
 * - "system" messages become `systemInstruction`
 * - "assistant" role becomes "model"
 * - "user" role stays "user"
 * - Content strings become `parts` arrays with `text` fields
 *
 * Gemini requires strict user/model alternation. If the input has
 * consecutive messages from the same role, we merge them to maintain
 * the required alternation pattern.
 */
function convertToGeminiFormat(messages: ChatMessage[]): {
  systemInstruction: { parts: GeminiPart[] } | null;
  contents: GeminiMessage[];
} {
  // Extract system messages
  const systemMessages = messages.filter((m) => m.role === "system");
  const systemInstruction =
    systemMessages.length > 0
      ? {
          parts: [{ text: systemMessages.map((m) => m.content).join("\n\n") }],
        }
      : null;

  // Convert non-system messages
  const nonSystemMessages = messages.filter((m) => m.role !== "system");
  const contents: GeminiMessage[] = [];

  for (const msg of nonSystemMessages) {
    const geminiRole: "user" | "model" =
      msg.role === "assistant" || msg.role === "tool" ? "model" : "user";

    const part: GeminiPart = { text: msg.content };

    // Gemini requires strict alternation between user and model.
    // If the last message has the same role, merge into it.
    const lastContent = contents[contents.length - 1];
    if (lastContent && lastContent.role === geminiRole) {
      lastContent.parts.push(part);
    } else {
      contents.push({ role: geminiRole, parts: [part] });
    }
  }

  // Gemini requires the first message to be from the user.
  // If it starts with "model", prepend an empty user turn.
  if (contents.length > 0 && contents[0].role === "model") {
    contents.unshift({ role: "user", parts: [{ text: "" }] });
  }

  return { systemInstruction, contents };
}

// ---------------------------------------------------------------------------
// Finish reason mapping
// ---------------------------------------------------------------------------

/**
 * Maps Gemini's finish reasons to a normalized string.
 *
 * Gemini uses UPPER_CASE enum values:
 * - STOP: Normal completion
 * - MAX_TOKENS: Hit the token limit
 * - SAFETY: Blocked by safety filters
 * - RECITATION: Blocked for potential copyright
 * - OTHER: Unknown reason
 */
function mapGeminiFinishReason(reason: string | undefined): string | null {
  if (!reason) return null;

  switch (reason) {
    case "STOP":
      return "stop";
    case "MAX_TOKENS":
      return "length";
    case "SAFETY":
      return "content_filter";
    case "RECITATION":
      return "content_filter";
    case "OTHER":
      return "stop";
    default:
      return reason.toLowerCase();
  }
}

// ---------------------------------------------------------------------------
// Supported models
// ---------------------------------------------------------------------------

/**
 * Models officially supported through this adapter.
 */
export const GOOGLE_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
] as const;

export type GoogleModel = (typeof GOOGLE_MODELS)[number];
