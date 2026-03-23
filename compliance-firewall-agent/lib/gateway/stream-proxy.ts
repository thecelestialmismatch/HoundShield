/**
 * Stream Proxy — Core streaming engine for the Kaelus gateway.
 *
 * This module is the heart of the product. It:
 *   1. Runs an input compliance scan on the user's messages.
 *   2. Proxies the request to the upstream LLM provider in streaming mode.
 *   3. Accumulates the response tokens and runs an output scan.
 *   4. Yields typed events that callers (SSE route, WebSocket handler) can
 *      convert to their wire format.
 *
 * The function is an AsyncGenerator so it works naturally with both
 * `for await...of` loops (SSE) and imperative `.next()` calls (WebSocket).
 *
 * Provider support: OpenAI, Anthropic, Google (Gemini). Each has its own
 * request/response format and SSE dialect, abstracted behind provider
 * adapters below.
 */

import { randomUUID } from "crypto";
import { classifyRisk } from "@/lib/classifier/risk-engine";
import { extractPromptFromBody } from "@/lib/interceptor/request-parser";
import type { RiskLevel, ActionTaken } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type StreamProvider = "openai" | "anthropic" | "google" | "openrouter";

export interface StreamRequest {
  request_id: string;
  provider: StreamProvider;
  model: string;
  messages: Array<{ role: string; content: string }>;
  api_key: string;
  temperature?: number;
  max_tokens?: number;
  user_id?: string;
}

/** Discriminated union of all event types emitted by the stream proxy. */
export type StreamEvent =
  | { type: "compliance_check"; data: ComplianceCheckData }
  | { type: "token"; data: TokenData }
  | { type: "output_scan"; data: OutputScanData }
  | { type: "done"; data: DoneData }
  | { type: "error"; data: ErrorData };

export interface ComplianceCheckData {
  status: "passed" | "blocked" | "quarantined";
  risk_level: RiskLevel;
  entities: Array<{ type: string; value_redacted: string; confidence: number }>;
  scan_time_ms: number;
  request_id: string;
}

export interface TokenData {
  content: string;
  index: number;
  model: string;
}

export interface OutputScanData {
  status: "clean" | "warning";
  tokens_scanned: number;
  alerts: string[];
  scan_time_ms: number;
}

export interface DoneData {
  total_tokens: number;
  compliance_summary: {
    input_status: "passed" | "blocked" | "quarantined";
    output_status: "clean" | "warning";
    risk_level: RiskLevel;
  };
  processing_time_ms: number;
  provider_time_ms: number;
  request_id: string;
}

export interface ErrorData {
  message: string;
  code?: string;
  request_id?: string;
}

// ---------------------------------------------------------------------------
// Provider adapters
// ---------------------------------------------------------------------------

interface ProviderConfig {
  url: string;
  buildHeaders: (apiKey: string) => Record<string, string>;
  buildBody: (req: StreamRequest) => Record<string, unknown>;
  parseChunk: (line: string) => string | null;
}

const PROVIDERS: Record<StreamProvider, ProviderConfig> = {
  openai: {
    url: "https://api.openai.com/v1/chat/completions",
    buildHeaders: (apiKey) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    buildBody: (req) => ({
      model: req.model,
      messages: req.messages,
      stream: true,
      temperature: req.temperature ?? 0.7,
      max_tokens: req.max_tokens ?? 4096,
    }),
    parseChunk: (line) => {
      if (line === "data: [DONE]") return null;
      if (!line.startsWith("data: ")) return null;
      try {
        const json = JSON.parse(line.slice(6));
        return json.choices?.[0]?.delta?.content ?? null;
      } catch {
        return null;
      }
    },
  },

  openrouter: {
    url: "https://openrouter.ai/api/v1/chat/completions",
    buildHeaders: (apiKey) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://kaelus.online",
      "X-Title": "Kaelus AI Compliance Gateway",
    }),
    buildBody: (req) => ({
      model: req.model,
      messages: req.messages,
      stream: true,
      temperature: req.temperature ?? 0.7,
      max_tokens: req.max_tokens ?? 4096,
    }),
    parseChunk: (line) => {
      if (line === "data: [DONE]") return null;
      if (!line.startsWith("data: ")) return null;
      try {
        const json = JSON.parse(line.slice(6));
        return json.choices?.[0]?.delta?.content ?? null;
      } catch {
        return null;
      }
    },
  },

  anthropic: {
    url: "https://api.anthropic.com/v1/messages",
    buildHeaders: (apiKey) => ({
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    }),
    buildBody: (req) => ({
      model: req.model,
      messages: req.messages,
      stream: true,
      temperature: req.temperature ?? 0.7,
      max_tokens: req.max_tokens ?? 4096,
    }),
    parseChunk: (line) => {
      if (!line.startsWith("data: ")) return null;
      try {
        const json = JSON.parse(line.slice(6));
        if (json.type === "content_block_delta") {
          return json.delta?.text ?? null;
        }
        return null;
      } catch {
        return null;
      }
    },
  },

  google: {
    url: "https://generativelanguage.googleapis.com/v1beta/models",
    buildHeaders: () => ({
      "Content-Type": "application/json",
    }),
    buildBody: (req) => ({
      contents: req.messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        temperature: req.temperature ?? 0.7,
        maxOutputTokens: req.max_tokens ?? 4096,
      },
    }),
    parseChunk: (line) => {
      // Gemini streams JSON arrays; each chunk has candidates[0].content.parts[0].text
      if (!line.startsWith("data: ")) return null;
      try {
        const json = JSON.parse(line.slice(6));
        return json.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
      } catch {
        return null;
      }
    },
  },
};

// ---------------------------------------------------------------------------
// Core stream proxy
// ---------------------------------------------------------------------------

/**
 * Streams an LLM request through the compliance pipeline.
 *
 * Yields events in order:
 *   1. `compliance_check` — result of the input scan
 *   2. `token` (0..N)    — streamed response tokens from the provider
 *   3. `output_scan`     — result of scanning the assembled output
 *   4. `done`            — summary with timing and token counts
 *
 * If the input scan blocks or quarantines the request, only
 * `compliance_check` and `done` are yielded (no provider call).
 *
 * If any error occurs, an `error` event is yielded and the generator returns.
 */
export async function* streamProxy(
  request: StreamRequest
): AsyncGenerator<StreamEvent, void, undefined> {
  const overallStart = performance.now();
  const requestId = request.request_id || randomUUID();

  // -----------------------------------------------------------------------
  // Step 1: Input compliance scan
  // -----------------------------------------------------------------------
  const scanStart = performance.now();
  const promptText = extractPromptFromBody(
    { messages: request.messages } as Record<string, unknown>,
    request.provider
  );
  const classification = await classifyRisk(promptText);
  const scanTimeMs = Math.round(performance.now() - scanStart);

  const inputStatus: "passed" | "blocked" | "quarantined" =
    classification.should_block
      ? "blocked"
      : classification.should_quarantine
        ? "quarantined"
        : "passed";

  yield {
    type: "compliance_check",
    data: {
      status: inputStatus,
      risk_level: classification.risk_level,
      entities: classification.entities.map((e) => ({
        type: e.type,
        value_redacted: e.value_redacted,
        confidence: e.confidence,
      })),
      scan_time_ms: scanTimeMs,
      request_id: requestId,
    },
  };

  // If blocked or quarantined, do not call the upstream provider
  if (inputStatus !== "passed") {
    yield {
      type: "done",
      data: {
        total_tokens: 0,
        compliance_summary: {
          input_status: inputStatus,
          output_status: "clean",
          risk_level: classification.risk_level,
        },
        processing_time_ms: Math.round(performance.now() - overallStart),
        provider_time_ms: 0,
        request_id: requestId,
      },
    };
    return;
  }

  // -----------------------------------------------------------------------
  // Step 2: Stream from the upstream LLM provider
  // -----------------------------------------------------------------------
  const provider = PROVIDERS[request.provider];
  if (!provider) {
    yield {
      type: "error",
      data: {
        message: `Unsupported provider: ${request.provider}`,
        code: "UNSUPPORTED_PROVIDER",
        request_id: requestId,
      },
    };
    return;
  }

  let providerUrl = provider.url;
  if (request.provider === "google") {
    providerUrl = `${provider.url}/${request.model}:streamGenerateContent?alt=sse&key=${request.api_key}`;
  }

  const headers = provider.buildHeaders(request.api_key);
  const body = provider.buildBody(request);

  const providerStart = performance.now();
  let response: Response;

  try {
    response = await fetch(providerUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch (fetchError) {
    yield {
      type: "error",
      data: {
        message: `Failed to connect to ${request.provider}: ${fetchError instanceof Error ? fetchError.message : "Unknown error"}`,
        code: "PROVIDER_CONNECTION_ERROR",
        request_id: requestId,
      },
    };
    return;
  }

  if (!response.ok) {
    let errorBody = "";
    try {
      errorBody = await response.text();
    } catch {
      // ignore read errors
    }
    yield {
      type: "error",
      data: {
        message: `Provider returned ${response.status}: ${errorBody.slice(0, 500)}`,
        code: "PROVIDER_ERROR",
        request_id: requestId,
      },
    };
    return;
  }

  if (!response.body) {
    yield {
      type: "error",
      data: {
        message: "Provider returned empty response body",
        code: "EMPTY_RESPONSE",
        request_id: requestId,
      },
    };
    return;
  }

  // -----------------------------------------------------------------------
  // Step 3: Read the SSE stream from the provider, yield token events
  // -----------------------------------------------------------------------
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let tokenIndex = 0;
  const outputParts: string[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      // Keep the last partial line in the buffer
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const content = provider.parseChunk(trimmed);
        if (content !== null && content.length > 0) {
          outputParts.push(content);
          yield {
            type: "token",
            data: {
              content,
              index: tokenIndex++,
              model: request.model,
            },
          };
        }
      }
    }

    // Process any remaining buffer content
    if (buffer.trim()) {
      const content = provider.parseChunk(buffer.trim());
      if (content !== null && content.length > 0) {
        outputParts.push(content);
        yield {
          type: "token",
          data: {
            content,
            index: tokenIndex++,
            model: request.model,
          },
        };
      }
    }
  } catch (streamError) {
    yield {
      type: "error",
      data: {
        message: `Stream read error: ${streamError instanceof Error ? streamError.message : "Unknown error"}`,
        code: "STREAM_READ_ERROR",
        request_id: requestId,
      },
    };
    return;
  }

  const providerTimeMs = Math.round(performance.now() - providerStart);

  // -----------------------------------------------------------------------
  // Step 4: Output compliance scan
  // -----------------------------------------------------------------------
  const outputText = outputParts.join("");
  const outputScanStart = performance.now();
  const outputClassification = await classifyRisk(outputText);
  const outputScanTimeMs = Math.round(performance.now() - outputScanStart);

  const outputAlerts: string[] = [];
  if (outputClassification.entities.length > 0) {
    for (const entity of outputClassification.entities) {
      outputAlerts.push(
        `${entity.type}: ${entity.value_redacted} (${Math.round(entity.confidence * 100)}%)`
      );
    }
  }

  const outputStatus: "clean" | "warning" =
    outputClassification.entities.length > 0 ? "warning" : "clean";

  yield {
    type: "output_scan",
    data: {
      status: outputStatus,
      tokens_scanned: tokenIndex,
      alerts: outputAlerts,
      scan_time_ms: outputScanTimeMs,
    },
  };

  // -----------------------------------------------------------------------
  // Step 5: Done
  // -----------------------------------------------------------------------
  yield {
    type: "done",
    data: {
      total_tokens: tokenIndex,
      compliance_summary: {
        input_status: inputStatus,
        output_status: outputStatus,
        risk_level: classification.risk_level,
      },
      processing_time_ms: Math.round(performance.now() - overallStart),
      provider_time_ms: providerTimeMs,
      request_id: requestId,
    },
  };
}
