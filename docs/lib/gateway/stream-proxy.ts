/**
 * Stream Proxy — Core streaming engine for the Hound Shield gateway.
 *
 * This module is the heart of the product. It:
 *   1. Runs an input compliance scan on the user's messages.
 *   2. Proxies the request to the upstream LLM provider in streaming mode.
 *   3. Scans output tokens IN REAL-TIME using StreamScanner (not post-hoc).
 *   4. Yields typed events that callers (SSE route, WebSocket handler) can
 *      convert to their wire format.
 *
 * Evolution highlights vs. the previous implementation:
 *
 * - **Real-time output scanning**: StreamScanner is now integrated into the
 *   token-streaming loop. Alerts surface mid-stream instead of at the end.
 *   The proxy can truncate the stream immediately when a CRITICAL alert fires.
 *
 * - **Provider retry with exponential backoff**: 429 (rate-limit) and 503
 *   (service unavailable) responses are retried up to 3 times before failing.
 *
 * - **`scan_alert` event type**: Callers receive real-time compliance alerts
 *   as a new `scan_alert` event during streaming — not just a summary at done.
 *
 * - **First-token timeout**: If the provider doesn't produce the first token
 *   within `firstTokenTimeoutMs` (default 30s), the stream is aborted.
 *
 * The function is an AsyncGenerator so it works naturally with both
 * `for await...of` loops (SSE) and imperative `.next()` calls (WebSocket).
 *
 * Provider support: OpenAI, Anthropic, Google (Gemini), OpenRouter.
 */

import { randomUUID } from "crypto";
import { classifyRisk } from "@/lib/classifier/risk-engine";
import { StreamScanner } from "./stream-scanner";
import { modelLeaderboard } from "./model-leaderboard";
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
  /** Truncate the stream when output scan finds content at or above this level. */
  truncate_on_severity?: "HIGH" | "CRITICAL";
}

export interface StreamProxyOptions {
  /** Scan output every N characters (default: 500). */
  outputScanInterval?: number;
  /** Milliseconds to wait for first token before aborting (default: 30 000). */
  firstTokenTimeoutMs?: number;
  /** Maximum retries on 429/503 from provider (default: 3). */
  maxProviderRetries?: number;
}

/** Discriminated union of all event types emitted by the stream proxy. */
export type StreamEvent =
  | { type: "compliance_check"; data: ComplianceCheckData }
  | { type: "token"; data: TokenData }
  | { type: "scan_alert"; data: ScanAlertData }
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

export interface ScanAlertData {
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  matched_rule: string;
  redacted_match: string;
  position: number;
  truncated: boolean;
  request_id: string;
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
// Retry delays for provider errors (ms)
// ---------------------------------------------------------------------------

/** Exponential backoff delays for provider 429 / 503 retries. */
const RETRY_DELAYS_MS = [1_000, 2_000, 4_000];

/**
 * Fetches from `url` with automatic retry on 429 (Too Many Requests) and
 * 503 (Service Unavailable). Respects the `Retry-After` header when present.
 */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  maxRetries: number
): Promise<Response> {
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let response: Response;

    try {
      response = await fetch(url, init);
    } catch (err) {
      // Network error — retry if attempts remain
      if (attempt < maxRetries) {
        await delay(RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)]);
        continue;
      }
      throw err;
    }

    if (
      (response.status === 429 || response.status === 503) &&
      attempt < maxRetries
    ) {
      lastResponse = response;
      // Honour Retry-After if provided, otherwise use exponential backoff
      const retryAfterSec = parseInt(
        response.headers.get("retry-after") ?? "0",
        10
      );
      const waitMs =
        retryAfterSec > 0
          ? retryAfterSec * 1_000
          : RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)];
      await delay(waitMs);
      continue;
    }

    return response;
  }

  // Return the last received response (will be handled as an error downstream)
  return lastResponse!;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
      "HTTP-Referer": "https://houndshield.com",
      "X-Title": "Hound Shield AI Compliance Gateway",
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
 *   1. `compliance_check`      — result of the input scan
 *   2. `token` (0..N)          — streamed response tokens from the provider
 *   3. `scan_alert` (0..M)     — real-time output compliance alerts (NEW)
 *   4. `output_scan`           — final output scan summary
 *   5. `done`                  — overall summary with timing and token counts
 *
 * If the input scan blocks/quarantines the request, only `compliance_check`
 * and `done` are yielded (no provider call).
 *
 * If the output scanner finds a CRITICAL alert and `truncate_on_severity`
 * is set to `"CRITICAL"` (or `"HIGH"`), the stream is truncated immediately
 * after that `scan_alert` event.
 */
export async function* streamProxy(
  request: StreamRequest,
  options: StreamProxyOptions = {}
): AsyncGenerator<StreamEvent, void, undefined> {
  const overallStart = performance.now();
  const requestId = request.request_id || randomUUID();
  const {
    outputScanInterval = 500,
    firstTokenTimeoutMs = 30_000,
    maxProviderRetries = 3,
  } = options;

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
  // Step 2: Build and send the upstream provider request (with retry)
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
    response = await fetchWithRetry(
      providerUrl,
      { method: "POST", headers, body: JSON.stringify(body) },
      maxProviderRetries
    );
  } catch (fetchError) {
    yield {
      type: "error",
      data: {
        message: `Failed to connect to ${request.provider}: ${
          fetchError instanceof Error ? fetchError.message : "Unknown error"
        }`,
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
  // Step 3: Stream tokens + real-time output scanning
  // -----------------------------------------------------------------------
  const scanner = new StreamScanner({ scanInterval: outputScanInterval });
  const truncateSeverity = request.truncate_on_severity;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let tokenIndex = 0;
  let truncated = false;
  let firstTokenReceived = false;

  // First-token timeout: abort the stream if the provider stalls
  let firstTokenTimer: ReturnType<typeof setTimeout> | null = null;
  const firstTokenController = new AbortController();

  const firstTokenTimeoutPromise = new Promise<never>((_, reject) => {
    firstTokenTimer = setTimeout(() => {
      firstTokenController.abort();
      reject(new Error(`Provider did not produce the first token within ${firstTokenTimeoutMs}ms`));
    }, firstTokenTimeoutMs);
  });

  try {
    outer: while (true) {
      // Race the read against the first-token timeout (only until first token)
      const readPromise = reader.read();
      const { done, value } = firstTokenReceived
        ? await readPromise
        : await Promise.race([readPromise, firstTokenTimeoutPromise]);

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const content = provider.parseChunk(trimmed);
        if (content !== null && content.length > 0) {
          if (!firstTokenReceived) {
            firstTokenReceived = true;
            if (firstTokenTimer) clearTimeout(firstTokenTimer);
          }

          yield {
            type: "token",
            data: { content, index: tokenIndex++, model: request.model },
          };

          // Real-time output scan — await so alerts are immediate
          const newAlerts = await scanner.addToken(content);
          for (const alert of newAlerts) {
            const isTruncating =
              truncateSeverity !== undefined &&
              (alert.severity === truncateSeverity ||
                (truncateSeverity === "HIGH" && alert.severity === "CRITICAL"));

            yield {
              type: "scan_alert",
              data: {
                severity: alert.severity,
                matched_rule: alert.matched_rule,
                redacted_match: alert.redacted_match,
                position: alert.position,
                truncated: isTruncating,
                request_id: requestId,
              },
            };

            if (isTruncating) {
              truncated = true;
              break outer;
            }
          }
        }
      }
    }

    // Flush any remaining partial buffer line
    if (!truncated && buffer.trim()) {
      const content = provider.parseChunk(buffer.trim());
      if (content !== null && content.length > 0) {
        yield {
          type: "token",
          data: { content, index: tokenIndex++, model: request.model },
        };
        const newAlerts = await scanner.addToken(content);
        for (const alert of newAlerts) {
          yield {
            type: "scan_alert",
            data: {
              severity: alert.severity,
              matched_rule: alert.matched_rule,
              redacted_match: alert.redacted_match,
              position: alert.position,
              truncated: false,
              request_id: requestId,
            },
          };
        }
      }
    }
  } catch (streamError) {
    if (firstTokenTimer) clearTimeout(firstTokenTimer);
    yield {
      type: "error",
      data: {
        message: `Stream read error: ${
          streamError instanceof Error ? streamError.message : "Unknown error"
        }`,
        code: "STREAM_READ_ERROR",
        request_id: requestId,
      },
    };
    return;
  } finally {
    if (firstTokenTimer) clearTimeout(firstTokenTimer);
    // Ensure reader is released even if we broke out of the loop early
    reader.releaseLock();
  }

  const providerTimeMs = Math.round(performance.now() - providerStart);

  // -----------------------------------------------------------------------
  // Step 4: Finalize output scan (catches any unscanned tail content)
  // -----------------------------------------------------------------------
  const outputScanResult = await scanner.finalize();

  const outputAlerts: string[] = outputScanResult.alerts.map(
    (a) =>
      `${a.severity} [${a.matched_rule}]: ${a.redacted_match}`
  );

  const outputStatus: "clean" | "warning" =
    outputScanResult.alerts.length > 0 ? "warning" : "clean";

  yield {
    type: "output_scan",
    data: {
      status: outputStatus,
      tokens_scanned: tokenIndex,
      alerts: outputAlerts,
      scan_time_ms: outputScanResult.scan_time_ms,
    },
  };

  // -----------------------------------------------------------------------
  // Step 5: Record to model leaderboard (non-blocking, O(1))
  // -----------------------------------------------------------------------
  modelLeaderboard.record({
    model: request.model,
    provider: request.provider,
    action: inputStatus === "passed"
      ? outputStatus === "warning" ? "QUARANTINED" : "ALLOWED"
      : inputStatus === "blocked" ? "BLOCKED" : "QUARANTINED",
    riskLevel: classification.risk_level,
    categories: classification.classifications ?? [],
    confidence: classification.confidence,
    outputTruncated: truncated,
    latencyMs: Math.round(performance.now() - overallStart),
  });

  // -----------------------------------------------------------------------
  // Step 6: Done
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
