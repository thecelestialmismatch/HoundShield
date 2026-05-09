/**
 * Hound Shield Streaming Gateway — Shared Provider Types
 *
 * These types form the contract between the gateway engine, provider adapters,
 * and the compliance scanning pipeline. Every LLM provider adapter must
 * implement the `ProviderAdapter` interface to plug into the streaming proxy.
 *
 * Design rationale:
 * - `ProviderName` is a union type (not an enum) for tree-shaking and simpler serialization.
 * - `StreamRequest` carries the user-supplied API key so Hound Shield never stores provider credentials.
 * - `StreamEvent` is the universal event envelope emitted by the proxy — the API route
 *   converts these 1:1 into SSE frames for the client.
 * - "custom" provider allows self-hosted or fine-tuned model endpoints that speak
 *   the OpenAI-compatible API format (vLLM, Ollama, LiteLLM, etc).
 */

// ---------------------------------------------------------------------------
// Provider identification
// ---------------------------------------------------------------------------

/** Supported LLM provider identifiers. */
export type ProviderName =
  | "openai"
  | "anthropic"
  | "google"
  | "openrouter"
  | "cohere"
  | "mistral"
  | "custom";

// ---------------------------------------------------------------------------
// Provider configuration
// ---------------------------------------------------------------------------

/** Static configuration for a provider endpoint. */
export interface ProviderConfig {
  /** Provider identifier. */
  name: ProviderName;
  /** Base URL for the API (no trailing slash). */
  apiBase: string;
  /** Default model to use when the request doesn't specify one. */
  defaultModel: string;
  /** All models supported through this adapter. */
  models: string[];
  /** Path appended to `apiBase` for streaming completions. */
  streamPath: string;
  /** Name of the HTTP header that carries the API key. */
  authHeader: string;
  /** Maximum request timeout in milliseconds. */
  maxTimeoutMs: number;
}

// ---------------------------------------------------------------------------
// Streaming request / response types
// ---------------------------------------------------------------------------

/** A single message in the conversation history. */
export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  /** Optional name for multi-participant conversations. */
  name?: string;
}

/**
 * Inbound streaming request from a Hound Shield client.
 *
 * The `api_key` is the end-user's own provider key — Hound Shield acts as a
 * pass-through proxy and never persists this value.
 */
export interface StreamRequest {
  /** Target LLM provider. */
  provider: ProviderName;
  /** Model identifier (e.g. "gpt-4o", "claude-sonnet-4-20250514"). */
  model: string;
  /** Conversation messages. */
  messages: ChatMessage[];
  /** Sampling temperature (0-2). */
  temperature?: number;
  /** Maximum tokens to generate. */
  max_tokens?: number;
  /** Must be true — Hound Shield only supports streaming mode. */
  stream: true;
  /** User's API key for the target provider (never stored). */
  api_key: string;
  /** Hound Shield user identifier for audit logging. */
  user_id: string;
  /** Arbitrary metadata attached to the compliance event. */
  metadata?: Record<string, unknown>;
}

/**
 * A single parsed token from the provider's streaming response.
 *
 * This is the normalized representation — each adapter converts the
 * provider's native SSE format into this shape.
 */
export interface StreamToken {
  /** The text content of this token. */
  content: string;
  /** Zero-based index of this token in the stream. */
  index: number;
  /** Non-null only on the final chunk (e.g. "stop", "end_turn"). */
  finish_reason: string | null;
  /** Model that generated this token. */
  model: string;
  /** Provider that served this token. */
  provider: ProviderName;
}

/**
 * Universal event envelope emitted by the streaming proxy.
 *
 * The API route serializes each event as an SSE frame:
 *   `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`
 */
export interface StreamEvent {
  /** Discriminator for the event kind. */
  type:
    | "compliance_check"  // Input scan completed
    | "token"             // A content token from the LLM
    | "output_scan"       // Periodic output compliance scan result
    | "warning"           // Non-blocking compliance warning
    | "done"              // Stream finished successfully
    | "error"             // Unrecoverable error
    | "blocked"           // Input blocked by compliance policy
    | "quarantined";      // Input quarantined for human review
  /** Event payload — shape varies by `type`. */
  data: Record<string, unknown>;
  /** Unix epoch milliseconds when this event was created. */
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Token usage tracking
// ---------------------------------------------------------------------------

/** Token usage statistics returned by the provider. */
export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

// ---------------------------------------------------------------------------
// Provider adapter interface
// ---------------------------------------------------------------------------

/**
 * Contract that every LLM provider adapter must implement.
 *
 * The adapter is responsible for:
 * 1. Building the HTTP request in the provider's native format.
 * 2. Parsing the provider's SSE chunks into normalized `StreamToken` objects.
 * 3. Extracting usage information from the final chunk when available.
 *
 * Adapters are stateless — a single instance is reused across all requests
 * for that provider.
 */
export interface ProviderAdapter {
  /** Provider this adapter handles. */
  name: ProviderName;

  /**
   * Transforms a `StreamRequest` into the provider's native HTTP request.
   *
   * @returns An object with the full URL, headers, and JSON-serialized body
   *          ready to pass to `fetch()`.
   */
  buildRequest(req: StreamRequest): {
    url: string;
    headers: Record<string, string>;
    body: string;
  };

  /**
   * Parses a single SSE data line from the provider into a `StreamToken`.
   *
   * @param chunk - The raw `data:` payload from the SSE stream (not the full
   *                SSE frame — the `data: ` prefix is already stripped).
   * @returns A `StreamToken` if the chunk contains content, or `null` for
   *          control frames (e.g. `[DONE]`, `message_start`).
   */
  parseStreamChunk(chunk: string): StreamToken | null;

  /**
   * Attempts to extract token usage from a chunk (usually the final one).
   *
   * Many providers only include usage in the last SSE frame. Returns `null`
   * if usage information is not present in this chunk.
   */
  extractUsage(chunk: string): TokenUsage | null;
}

// ---------------------------------------------------------------------------
// Streaming proxy options
// ---------------------------------------------------------------------------

/** Configuration options for the streaming proxy engine. */
export interface StreamProxyOptions {
  /** Scan output every N characters (default: 500). */
  outputScanInterval?: number;
  /** Maximum time to wait for first token in ms (default: 30000). */
  firstTokenTimeoutMs?: number;
  /** Maximum total stream duration in ms (default: 300000 = 5 min). */
  maxStreamDurationMs?: number;
  /** If true, truncate the stream when output scan detects sensitive data (default: false). */
  truncateOnSensitiveOutput?: boolean;
  /** Risk level threshold that triggers stream truncation (default: "CRITICAL"). */
  truncationThreshold?: "HIGH" | "CRITICAL";
  /** If true, skip input compliance scan (for testing only). */
  skipInputScan?: boolean;
}

// ---------------------------------------------------------------------------
// Scan alert types
// ---------------------------------------------------------------------------

/** Alert raised by the output stream scanner. */
export interface ScanAlert {
  /** Severity level of the detected content. */
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  /** Human-readable description of what was detected. */
  message: string;
  /** Character position in the accumulated buffer where the detection starts. */
  position: number;
  /** The rule or pattern name that triggered this alert. */
  matched_rule: string;
  /** Redacted snippet of the detected content. */
  redacted_match: string;
  /** Unix epoch ms when the alert was raised. */
  timestamp: number;
}

/** Final result of scanning the complete output stream. */
export interface OutputScanResult {
  /** Whether any sensitive content was detected. */
  clean: boolean;
  /** Total characters scanned. */
  characters_scanned: number;
  /** Total tokens processed. */
  tokens_processed: number;
  /** Number of scan passes executed. */
  scans_performed: number;
  /** All alerts raised during the stream. */
  alerts: ScanAlert[];
  /** Time spent scanning in milliseconds. */
  scan_time_ms: number;
}

// ---------------------------------------------------------------------------
// Performance metrics
// ---------------------------------------------------------------------------

/** Timing and performance data for a single proxy request. */
export interface StreamMetrics {
  /** Total wall-clock time from request start to stream end. */
  total_time_ms: number;
  /** Time spent on input compliance scanning. */
  input_scan_time_ms: number;
  /** Time spent on output compliance scanning (cumulative). */
  output_scan_time_ms: number;
  /** Time from request to first token received from provider. */
  first_token_time_ms: number;
  /** Total time spent waiting on the provider. */
  provider_time_ms: number;
  /** Total tokens streamed. */
  tokens_streamed: number;
  /** Token usage reported by the provider (if available). */
  usage: TokenUsage | null;
}
