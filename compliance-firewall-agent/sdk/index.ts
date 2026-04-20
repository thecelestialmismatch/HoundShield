/**
 * @houndshield/sdk — Real-time AI Compliance Gateway SDK
 *
 * Framework-agnostic SDK for integrating with the Hound Shield AI Compliance Firewall.
 * Works in Node.js (>=18) and modern browsers. Zero external dependencies.
 *
 * @example
 * ```typescript
 * import { Hound Shield } from "@houndshield/sdk";
 *
 * const houndshield = new Hound Shield({
 *   apiKey: "houndshield-key-...",
 *   gateway: "https://your-houndshield-instance.com",
 * });
 *
 * // SSE streaming
 * const stream = await houndshield.stream({
 *   provider: "openai",
 *   model: "gpt-4o",
 *   apiKey: "sk-...",
 *   messages: [{ role: "user", content: "Hello" }],
 * });
 *
 * for await (const event of stream) {
 *   if (event.type === "token") process.stdout.write(event.data.content);
 *   if (event.type === "compliance_check") console.log("Scan:", event.data);
 *   if (event.type === "done") console.log("Done:", event.data);
 * }
 *
 * // Quick scan
 * const result = await houndshield.scan("Check this text for PII");
 * console.log(result.risk_level, result.entities);
 * ```
 *
 * @packageDocumentation
 */

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

/** Risk severity levels assigned by the compliance engine. */
export type RiskLevel = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

/** Actions the firewall can take on a request. */
export type ActionTaken = "ALLOWED" | "BLOCKED" | "QUARANTINED";

/** Supported LLM providers. */
export type Provider =
  | "openai"
  | "anthropic"
  | "google"
  | "cohere"
  | "mistral"
  | "huggingface"
  | (string & {});

/** A chat message in the standard role/content format. */
export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool" | (string & {});
  content: string | Record<string, unknown>;
}

/** Configuration for the Hound Shield client. */
export interface HoundShieldConfig {
  /** API key for authenticating with the Hound Shield gateway. */
  apiKey: string;
  /** Base URL of the Hound Shield gateway instance (no trailing slash). */
  gateway: string;
  /** Request timeout in milliseconds. Defaults to 30000. */
  timeout?: number;
  /** Custom headers to include with every request. */
  headers?: Record<string, string>;
  /** Optional user ID to attach to all requests. */
  userId?: string;
}

/** Request payload for streaming through the compliance gateway. */
export interface StreamRequest {
  /** The LLM provider to route through. */
  provider: Provider;
  /** Model identifier (e.g. "gpt-4o", "claude-sonnet-4-20250514"). */
  model: string;
  /** The provider's API key. Encrypted in transit, never logged. */
  apiKey: string;
  /** Chat messages to send. */
  messages: ChatMessage[];
  /** Optional system prompt (Anthropic-style). */
  system?: string;
  /** Sampling temperature. */
  temperature?: number;
  /** Maximum tokens to generate. */
  maxTokens?: number;
  /** Abort signal for cancellation. */
  signal?: AbortSignal;
  /** Additional provider-specific parameters. */
  metadata?: Record<string, unknown>;
}

/** Request payload for non-streaming intercept. */
export interface InterceptRequest {
  /** Chat messages to scan. */
  messages: ChatMessage[];
  /** Destination LLM API URL. */
  destination: string;
  /** User identifier. */
  userId?: string;
  /** Abort signal for cancellation. */
  signal?: AbortSignal;
  /** Additional metadata. */
  metadata?: Record<string, unknown>;
}

/** A detected sensitive entity. */
export interface DetectedEntity {
  type: string;
  value_redacted: string;
  confidence: number;
}

/** Result of a compliance scan. */
export interface ScanResult {
  risk_level: RiskLevel;
  confidence: number;
  classifications: string[];
  entities_found: number;
  entities: DetectedEntity[];
  should_block: boolean;
  should_quarantine: boolean;
  processing_time_ms: number;
  ai_classification: {
    top_label: string;
    top_score: number;
    is_sensitive: boolean;
    model: string;
    powered_by: string;
  } | null;
}

/** Result of a non-streaming intercept decision. */
export interface InterceptResult {
  allowed: boolean;
  action: ActionTaken;
  request_id: string;
  risk_level: RiskLevel;
  classifications: string[];
  message: string;
  processing_time_ms: number;
}

/** Gateway health status. */
export interface HealthResult {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  uptime_seconds: number;
  checks: Record<string, { status: string; latency_ms: number }>;
}

// -- Stream event types --

export interface StreamTokenEvent {
  type: "token";
  data: { content: string; index: number };
}

export interface StreamComplianceCheckEvent {
  type: "compliance_check";
  data: {
    risk_level: RiskLevel;
    action: ActionTaken;
    classifications: string[];
    latency_ms: number;
  };
}

export interface StreamDoneEvent {
  type: "done";
  data: {
    finish_reason: string;
    usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    compliance: {
      risk_level: RiskLevel;
      action: ActionTaken;
      request_id: string;
      processing_time_ms: number;
    };
  };
}

export interface StreamErrorEvent {
  type: "error";
  data: { code: string; message: string; retryable: boolean };
}

/** Union of all SSE stream event types. */
export type StreamEvent =
  | StreamTokenEvent
  | StreamComplianceCheckEvent
  | StreamDoneEvent
  | StreamErrorEvent;

// -- WebSocket event types --

export interface WSResponseDelta {
  type: "response.delta";
  content: string;
  index: number;
}

export interface WSComplianceEvent {
  type: "compliance.check";
  risk_level: RiskLevel;
  action: ActionTaken;
  classifications: string[];
}

export interface WSDoneEvent {
  type: "response.done";
  finish_reason: string;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export interface WSErrorEvent {
  type: "error";
  code: string;
  message: string;
}

/** Union of all WebSocket event types. */
export type WSEvent = WSResponseDelta | WSComplianceEvent | WSDoneEvent | WSErrorEvent;

// ---------------------------------------------------------------------------
// Error classes
// ---------------------------------------------------------------------------

/** Base error for all Hound Shield SDK errors. */
export class HoundShieldError extends Error {
  readonly code: string;
  readonly statusCode: number | undefined;
  readonly retryable: boolean;

  constructor(
    message: string,
    code: string,
    statusCode?: number,
    retryable = false
  ) {
    super(message);
    this.name = "HoundShieldError";
    this.code = code;
    this.statusCode = statusCode;
    this.retryable = retryable;
    Object.setPrototypeOf(this, HoundShieldError.prototype);
  }
}

/** Thrown when authentication with the gateway fails. */
export class AuthenticationError extends HoundShieldError {
  constructor(message = "Invalid or missing API key") {
    super(message, "AUTH_ERROR", 401, false);
    this.name = "AuthenticationError";
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/** Thrown when the gateway rate-limits the client. */
export class RateLimitError extends HoundShieldError {
  readonly retryAfterMs: number;

  constructor(retryAfterMs = 60_000) {
    super(
      `Rate limited. Retry after ${Math.ceil(retryAfterMs / 1000)}s`,
      "RATE_LIMIT",
      429,
      true
    );
    this.name = "RateLimitError";
    this.retryAfterMs = retryAfterMs;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/** Thrown when the compliance firewall blocks a request. */
export class ComplianceBlockError extends HoundShieldError {
  readonly riskLevel: RiskLevel;
  readonly classifications: string[];

  constructor(result: InterceptResult) {
    super(result.message, "COMPLIANCE_BLOCKED", 403, false);
    this.name = "ComplianceBlockError";
    this.riskLevel = result.risk_level as RiskLevel;
    this.classifications = result.classifications;
    Object.setPrototypeOf(this, ComplianceBlockError.prototype);
  }
}

/** Thrown when the request times out. */
export class TimeoutError extends HoundShieldError {
  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`, "TIMEOUT", undefined, true);
    this.name = "TimeoutError";
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Generate a unique request ID. */
function generateRequestId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Create an AbortController that fires after `ms` milliseconds. */
function timeoutController(
  ms: number,
  external?: AbortSignal
): { controller: AbortController; clear: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new TimeoutError(ms)), ms);

  const clear = () => clearTimeout(timer);

  // Forward external abort
  if (external) {
    if (external.aborted) {
      controller.abort(external.reason);
      clear();
    } else {
      const onAbort = () => {
        controller.abort(external.reason);
        clear();
      };
      external.addEventListener("abort", onAbort, { once: true });
    }
  }

  return { controller, clear };
}

/** Parse an HTTP response and throw typed errors for non-OK statuses. */
async function handleResponseError(response: Response): Promise<never> {
  let body: Record<string, unknown> = {};
  try {
    body = await response.json();
  } catch {
    // Response body wasn't JSON
  }

  const message =
    (body.error as string) ||
    (body.message as string) ||
    `Request failed with status ${response.status}`;

  switch (response.status) {
    case 401:
      throw new AuthenticationError(message);
    case 429: {
      const retryAfter = response.headers.get("Retry-After");
      const retryMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 60_000;
      throw new RateLimitError(retryMs);
    }
    case 403:
      throw new HoundShieldError(message, "FORBIDDEN", 403, false);
    default:
      throw new HoundShieldError(
        message,
        "REQUEST_FAILED",
        response.status,
        response.status >= 500
      );
  }
}

// ---------------------------------------------------------------------------
// SSE parser (zero-dependency)
// ---------------------------------------------------------------------------

/**
 * Parses a ReadableStream of SSE bytes into an async iterable of typed events.
 * Handles multi-byte characters, multi-line data fields, and reconnection IDs.
 */
async function* parseSSEStream<T>(
  stream: ReadableStream<Uint8Array>,
  signal?: AbortSignal
): AsyncGenerator<T> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      if (signal?.aborted) {
        break;
      }

      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE events are separated by double newlines
      const parts = buffer.split("\n\n");
      // The last part may be incomplete
      buffer = parts.pop() || "";

      for (const part of parts) {
        if (!part.trim()) continue;

        let eventType = "message";
        const dataLines: string[] = [];

        for (const line of part.split("\n")) {
          if (line.startsWith("event:")) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            dataLines.push(line.slice(5).trim());
          }
          // Ignore 'id:' and 'retry:' lines for now
        }

        if (dataLines.length === 0) continue;

        const rawData = dataLines.join("\n");

        // [DONE] is the conventional end-of-stream signal
        if (rawData === "[DONE]") break;

        try {
          const parsed = JSON.parse(rawData);
          // If the SSE event type is present, use it; otherwise rely on the JSON type field
          if (eventType !== "message" && !parsed.type) {
            parsed.type = eventType;
          }
          yield parsed as T;
        } catch {
          // Skip malformed JSON lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ---------------------------------------------------------------------------
// HoundShieldWebSocket
// ---------------------------------------------------------------------------

/** Internal pending request tracker. */
interface PendingRequest {
  resolve: (value: WSEvent) => void;
  reject: (err: Error) => void;
  requestId: string;
}

/**
 * Persistent WebSocket connection to the Hound Shield gateway.
 * Supports multiplexed streaming requests with async iteration.
 */
export class HoundShieldWebSocket {
  private ws: WebSocket | null = null;
  private _connected = false;
  private pendingRequests = new Map<string, {
    buffer: WSEvent[];
    resolve: ((value: IteratorResult<WSEvent, undefined>) => void) | null;
    done: boolean;
    error: Error | null;
  }>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private url: string;
  private apiKey: string;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  /** @internal */
  constructor(ws: WebSocket, url: string, apiKey: string) {
    this.ws = ws;
    this.url = url;
    this.apiKey = apiKey;
    this._connected = true;
    this.setupListeners();
    this.startHeartbeat();
  }

  /** Whether the WebSocket connection is currently open. */
  get connected(): boolean {
    return this._connected && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Send a streaming request through the WebSocket connection.
   * Returns an async iterable of response events.
   */
  async request(req: StreamRequest): Promise<AsyncIterable<WSEvent>> {
    if (!this.connected) {
      throw new HoundShieldError(
        "WebSocket is not connected",
        "WS_NOT_CONNECTED",
        undefined,
        true
      );
    }

    const requestId = generateRequestId();

    // Set up the response channel
    this.pendingRequests.set(requestId, {
      buffer: [],
      resolve: null,
      done: false,
      error: null,
    });

    // Send the request
    this.ws!.send(
      JSON.stringify({
        type: "request",
        id: requestId,
        payload: {
          provider: req.provider,
          model: req.model,
          api_key: req.apiKey,
          messages: req.messages,
          system: req.system,
          temperature: req.temperature,
          max_tokens: req.maxTokens,
          metadata: req.metadata,
        },
      })
    );

    // If the caller passed an abort signal, handle cancellation
    if (req.signal) {
      const onAbort = () => {
        const channel = this.pendingRequests.get(requestId);
        if (channel && !channel.done) {
          channel.done = true;
          channel.error = new HoundShieldError(
            "Request was cancelled",
            "CANCELLED",
            undefined,
            false
          );
          if (channel.resolve) {
            channel.resolve({ done: true, value: undefined });
            channel.resolve = null;
          }
          // Tell the server to cancel
          if (this.connected) {
            this.ws!.send(JSON.stringify({ type: "cancel", id: requestId }));
          }
        }
      };
      req.signal.addEventListener("abort", onAbort, { once: true });
    }

    // Return async iterable
    const self = this;
    return {
      [Symbol.asyncIterator](): AsyncIterator<WSEvent> {
        return {
          next(): Promise<IteratorResult<WSEvent, undefined>> {
            const channel = self.pendingRequests.get(requestId);
            if (!channel) {
              return Promise.resolve({ done: true, value: undefined });
            }

            if (channel.error) {
              self.pendingRequests.delete(requestId);
              return Promise.reject(channel.error);
            }

            // If there are buffered events, return the next one
            if (channel.buffer.length > 0) {
              const event = channel.buffer.shift()!;
              if (event.type === "response.done" || event.type === "error") {
                channel.done = true;
                self.pendingRequests.delete(requestId);
                return Promise.resolve({ done: false, value: event });
              }
              return Promise.resolve({ done: false, value: event });
            }

            // If the channel is done, clean up
            if (channel.done) {
              self.pendingRequests.delete(requestId);
              return Promise.resolve({ done: true, value: undefined });
            }

            // Otherwise, wait for the next event
            return new Promise<IteratorResult<WSEvent, undefined>>((resolve) => {
              channel.resolve = resolve;
            });
          },
          return(): Promise<IteratorResult<WSEvent, undefined>> {
            self.pendingRequests.delete(requestId);
            if (self.connected) {
              self.ws!.send(JSON.stringify({ type: "cancel", id: requestId }));
            }
            return Promise.resolve({ done: true, value: undefined });
          },
        };
      },
    };
  }

  /** Close the WebSocket connection. */
  close(): void {
    this.cleanup();
    if (this.ws) {
      this.ws.close(1000, "Client closed");
      this.ws = null;
    }
  }

  private setupListeners(): void {
    if (!this.ws) return;

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(
          typeof event.data === "string" ? event.data : ""
        ) as {
          id?: string;
          type: string;
          [key: string]: unknown;
        };

        // Heartbeat response
        if (msg.type === "pong") return;

        const requestId = msg.id;
        if (!requestId) return;

        const channel = this.pendingRequests.get(requestId);
        if (!channel) return;

        // Map server messages to WSEvent types
        let wsEvent: WSEvent;
        switch (msg.type) {
          case "response.delta":
            wsEvent = {
              type: "response.delta",
              content: (msg.content as string) || "",
              index: (msg.index as number) || 0,
            };
            break;
          case "compliance.check":
            wsEvent = {
              type: "compliance.check",
              risk_level: msg.risk_level as RiskLevel,
              action: msg.action as ActionTaken,
              classifications: (msg.classifications as string[]) || [],
            };
            break;
          case "response.done":
            wsEvent = {
              type: "response.done",
              finish_reason: (msg.finish_reason as string) || "stop",
              usage: (msg.usage as WSDoneEvent["usage"]) || {
                prompt_tokens: 0,
                completion_tokens: 0,
                total_tokens: 0,
              },
            };
            channel.done = true;
            break;
          case "error":
            wsEvent = {
              type: "error",
              code: (msg.code as string) || "UNKNOWN",
              message: (msg.message as string) || "Unknown error",
            };
            channel.done = true;
            break;
          default:
            return;
        }

        // If someone is waiting for the next event, deliver immediately
        if (channel.resolve) {
          const resolve = channel.resolve;
          channel.resolve = null;
          resolve({ done: false, value: wsEvent });
        } else {
          channel.buffer.push(wsEvent);
        }
      } catch {
        // Ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      this._connected = false;
      this.failAllPending(
        new HoundShieldError("WebSocket connection closed", "WS_CLOSED", undefined, true)
      );
      this.attemptReconnect();
    };

    this.ws.onerror = () => {
      this._connected = false;
    };
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.connected) {
        this.ws!.send(JSON.stringify({ type: "ping" }));
      }
    }, 30_000);
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30_000);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      try {
        const ws = new WebSocket(this.url);

        ws.onopen = () => {
          // Authenticate
          ws.send(JSON.stringify({ type: "auth", api_key: this.apiKey }));
          this.ws = ws;
          this._connected = true;
          this.reconnectAttempts = 0;
          this.setupListeners();
          this.startHeartbeat();
        };

        ws.onerror = () => {
          this.attemptReconnect();
        };
      } catch {
        this.attemptReconnect();
      }
    }, delay);
  }

  private failAllPending(error: Error): void {
    for (const [id, channel] of this.pendingRequests) {
      channel.done = true;
      channel.error = error;
      if (channel.resolve) {
        channel.resolve({ done: true, value: undefined });
        channel.resolve = null;
      }
    }
    this.pendingRequests.clear();
  }

  private cleanup(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this._connected = false;
    this.failAllPending(
      new HoundShieldError("Connection closed by client", "WS_CLOSED", undefined, false)
    );
  }
}

// ---------------------------------------------------------------------------
// Hound Shield Client
// ---------------------------------------------------------------------------

/**
 * The main Hound Shield SDK client.
 *
 * Provides methods for streaming LLM requests through the compliance gateway,
 * scanning text for sensitive data, and managing persistent WebSocket connections.
 *
 * @example
 * ```typescript
 * const houndshield = new Hound Shield({
 *   apiKey: "houndshield-key-...",
 *   gateway: "https://your-houndshield-instance.com",
 * });
 *
 * const result = await houndshield.scan("My SSN is 123-45-6789");
 * console.log(result.risk_level); // "CRITICAL"
 * ```
 */
export class Hound Shield {
  private readonly apiKey: string;
  private readonly gateway: string;
  private readonly timeout: number;
  private readonly defaultHeaders: Record<string, string>;
  private readonly userId: string | undefined;

  constructor(config: HoundShieldConfig) {
    if (!config.apiKey) {
      throw new HoundShieldError(
        "apiKey is required",
        "INVALID_CONFIG",
        undefined,
        false
      );
    }
    if (!config.gateway) {
      throw new HoundShieldError(
        "gateway URL is required",
        "INVALID_CONFIG",
        undefined,
        false
      );
    }

    this.apiKey = config.apiKey;
    this.gateway = config.gateway.replace(/\/+$/, ""); // strip trailing slashes
    this.timeout = config.timeout ?? 30_000;
    this.userId = config.userId;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      "x-api-key": this.apiKey,
      ...(config.userId ? { "x-user-id": config.userId } : {}),
      ...(config.headers ?? {}),
    };
  }

  // -----------------------------------------------------------------------
  // SSE Streaming
  // -----------------------------------------------------------------------

  /**
   * Stream an LLM request through the compliance gateway via Server-Sent Events.
   *
   * The gateway scans the prompt in real-time, then proxies to the LLM provider.
   * Compliance check events are interleaved with token events so you can react
   * to risk decisions as they happen.
   *
   * @param request - The streaming request configuration.
   * @returns An async iterable of stream events.
   * @throws {AuthenticationError} If the API key is invalid.
   * @throws {ComplianceBlockError} If the request is blocked by policy.
   * @throws {RateLimitError} If the client is rate-limited.
   * @throws {TimeoutError} If the request exceeds the configured timeout.
   *
   * @example
   * ```typescript
   * const stream = await houndshield.stream({
   *   provider: "openai",
   *   model: "gpt-4o",
   *   apiKey: "sk-...",
   *   messages: [{ role: "user", content: "Hello" }],
   * });
   *
   * for await (const event of stream) {
   *   if (event.type === "token") process.stdout.write(event.data.content);
   *   if (event.type === "compliance_check") console.log(event.data);
   * }
   * ```
   */
  async stream(request: StreamRequest): Promise<AsyncIterable<StreamEvent>> {
    const { controller, clear } = timeoutController(
      this.timeout,
      request.signal
    );

    try {
      const response = await fetch(
        `${this.gateway}/api/gateway/stream`,
        {
          method: "POST",
          headers: {
            ...this.defaultHeaders,
            Accept: "text/event-stream",
            ...(request.apiKey
              ? { "x-provider-api-key": request.apiKey }
              : {}),
          },
          body: JSON.stringify({
            provider: request.provider,
            model: request.model,
            messages: request.messages,
            system: request.system,
            temperature: request.temperature,
            max_tokens: request.maxTokens,
            stream: true,
            metadata: request.metadata,
          }),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        clear();
        await handleResponseError(response);
      }

      if (!response.body) {
        clear();
        throw new HoundShieldError(
          "Response body is empty — streaming not supported by gateway",
          "NO_STREAM",
          response.status,
          false
        );
      }

      // Return an async iterable that cleans up the timeout on completion
      const sseStream = parseSSEStream<StreamEvent>(
        response.body,
        controller.signal
      );

      const self = this;
      return {
        [Symbol.asyncIterator](): AsyncIterator<StreamEvent> {
          const iterator = sseStream[Symbol.asyncIterator]();
          return {
            async next() {
              const result = await iterator.next();
              if (result.done) {
                clear();
              }
              return result;
            },
            async return() {
              clear();
              controller.abort();
              return iterator.return
                ? iterator.return(undefined)
                : { done: true as const, value: undefined };
            },
          };
        },
      };
    } catch (err) {
      clear();
      if (err instanceof HoundShieldError) throw err;
      if (err instanceof DOMException && err.name === "AbortError") {
        if (request.signal?.aborted) {
          throw new HoundShieldError(
            "Request was cancelled",
            "CANCELLED",
            undefined,
            false
          );
        }
        throw new TimeoutError(this.timeout);
      }
      throw new HoundShieldError(
        `Stream request failed: ${(err as Error).message}`,
        "NETWORK_ERROR",
        undefined,
        true
      );
    }
  }

  // -----------------------------------------------------------------------
  // WebSocket Connection
  // -----------------------------------------------------------------------

  /**
   * Establish a persistent WebSocket connection to the compliance gateway.
   *
   * WebSocket connections are ideal for high-throughput applications that send
   * many requests. The connection is authenticated once and supports multiplexed
   * streaming with automatic heartbeat and reconnection.
   *
   * @returns A HoundShieldWebSocket instance for sending streaming requests.
   * @throws {HoundShieldError} If the WebSocket connection fails.
   *
   * @example
   * ```typescript
   * const ws = await houndshield.connect();
   *
   * const response = await ws.request({
   *   provider: "anthropic",
   *   model: "claude-sonnet-4-20250514",
   *   apiKey: "sk-ant-...",
   *   messages: [{ role: "user", content: "Hello" }],
   * });
   *
   * for await (const event of response) {
   *   if (event.type === "response.delta") process.stdout.write(event.content);
   * }
   *
   * ws.close();
   * ```
   */
  async connect(): Promise<HoundShieldWebSocket> {
    const wsUrl = this.gateway
      .replace(/^http/, "ws")
      .concat("/api/gateway/ws");

    return new Promise<HoundShieldWebSocket>((resolve, reject) => {
      try {
        const ws = new WebSocket(wsUrl);
        let authenticated = false;

        const connectionTimeout = setTimeout(() => {
          ws.close();
          reject(
            new TimeoutError(this.timeout)
          );
        }, this.timeout);

        ws.onopen = () => {
          // Authenticate immediately after connection
          ws.send(
            JSON.stringify({
              type: "auth",
              api_key: this.apiKey,
              user_id: this.userId,
            })
          );
        };

        ws.onmessage = (event) => {
          if (authenticated) return;

          try {
            const msg = JSON.parse(
              typeof event.data === "string" ? event.data : ""
            ) as Record<string, unknown>;

            if (msg.type === "auth.success") {
              authenticated = true;
              clearTimeout(connectionTimeout);
              resolve(new HoundShieldWebSocket(ws, wsUrl, this.apiKey));
            } else if (msg.type === "auth.error") {
              clearTimeout(connectionTimeout);
              ws.close();
              reject(new AuthenticationError(msg.message as string));
            }
          } catch {
            // Ignore malformed auth response
          }
        };

        ws.onerror = () => {
          if (!authenticated) {
            clearTimeout(connectionTimeout);
            reject(
              new HoundShieldError(
                "WebSocket connection failed",
                "WS_CONNECTION_FAILED",
                undefined,
                true
              )
            );
          }
        };
      } catch (err) {
        reject(
          new HoundShieldError(
            `Failed to create WebSocket: ${(err as Error).message}`,
            "WS_CREATE_FAILED",
            undefined,
            true
          )
        );
      }
    });
  }

  // -----------------------------------------------------------------------
  // Scan
  // -----------------------------------------------------------------------

  /**
   * Scan text for sensitive data without sending it to an LLM.
   *
   * This is a stateless operation — the text is analyzed and discarded.
   * Use it for pre-flight checks, CI/CD pipelines, or interactive scanning.
   *
   * @param text - The text to scan for PII, API keys, financial data, etc.
   * @param signal - Optional AbortSignal for cancellation.
   * @returns The scan result with risk level, entities, and classifications.
   * @throws {AuthenticationError} If the API key is invalid.
   * @throws {RateLimitError} If the client is rate-limited.
   *
   * @example
   * ```typescript
   * const result = await houndshield.scan("My SSN is 123-45-6789");
   * console.log(result.risk_level);   // "CRITICAL"
   * console.log(result.entities);     // [{ type: "PII", value_redacted: "***-**-6789", ... }]
   * console.log(result.should_block); // true
   * ```
   */
  async scan(text: string, signal?: AbortSignal): Promise<ScanResult> {
    const { controller, clear } = timeoutController(this.timeout, signal);

    try {
      const response = await fetch(`${this.gateway}/api/scan`, {
        method: "POST",
        headers: this.defaultHeaders,
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      clear();

      if (!response.ok) {
        await handleResponseError(response);
      }

      return (await response.json()) as ScanResult;
    } catch (err) {
      clear();
      if (err instanceof HoundShieldError) throw err;
      if (err instanceof DOMException && err.name === "AbortError") {
        if (signal?.aborted) {
          throw new HoundShieldError(
            "Request was cancelled",
            "CANCELLED",
            undefined,
            false
          );
        }
        throw new TimeoutError(this.timeout);
      }
      throw new HoundShieldError(
        `Scan request failed: ${(err as Error).message}`,
        "NETWORK_ERROR",
        undefined,
        true
      );
    }
  }

  // -----------------------------------------------------------------------
  // Intercept
  // -----------------------------------------------------------------------

  /**
   * Submit a request for compliance interception without streaming.
   *
   * The gateway scans the messages and returns an allow/block/quarantine decision.
   * If allowed, the caller is responsible for forwarding the request to the LLM.
   *
   * @param request - The intercept request payload.
   * @returns The compliance decision.
   * @throws {ComplianceBlockError} If the request is blocked.
   * @throws {AuthenticationError} If the API key is invalid.
   *
   * @example
   * ```typescript
   * const decision = await houndshield.intercept({
   *   messages: [{ role: "user", content: "My SSN is 123-45-6789" }],
   *   destination: "https://api.openai.com/v1/chat/completions",
   *   userId: "user-123",
   * });
   *
   * if (decision.allowed) {
   *   // Forward to OpenAI
   * } else {
   *   console.log("Blocked:", decision.message);
   * }
   * ```
   */
  async intercept(request: InterceptRequest): Promise<InterceptResult> {
    const { controller, clear } = timeoutController(
      this.timeout,
      request.signal
    );

    try {
      const response = await fetch(
        `${this.gateway}/api/gateway/intercept`,
        {
          method: "POST",
          headers: {
            ...this.defaultHeaders,
            ...(request.userId ? { "x-user-id": request.userId } : {}),
            "x-destination-url": request.destination,
          },
          body: JSON.stringify({
            messages: request.messages,
            _destination_url: request.destination,
            metadata: request.metadata,
          }),
          signal: controller.signal,
        }
      );

      clear();

      // 202 = quarantined, 403 = blocked — both are valid responses
      if (!response.ok && response.status !== 403 && response.status !== 202) {
        await handleResponseError(response);
      }

      return (await response.json()) as InterceptResult;
    } catch (err) {
      clear();
      if (err instanceof HoundShieldError) throw err;
      if (err instanceof DOMException && err.name === "AbortError") {
        if (request.signal?.aborted) {
          throw new HoundShieldError(
            "Request was cancelled",
            "CANCELLED",
            undefined,
            false
          );
        }
        throw new TimeoutError(this.timeout);
      }
      throw new HoundShieldError(
        `Intercept request failed: ${(err as Error).message}`,
        "NETWORK_ERROR",
        undefined,
        true
      );
    }
  }

  // -----------------------------------------------------------------------
  // Health
  // -----------------------------------------------------------------------

  /**
   * Check the health of the Hound Shield gateway.
   *
   * @returns Health status including uptime and component checks.
   *
   * @example
   * ```typescript
   * const health = await houndshield.health();
   * console.log(health.status); // "healthy"
   * ```
   */
  async health(): Promise<HealthResult> {
    const { controller, clear } = timeoutController(5_000);

    try {
      const response = await fetch(`${this.gateway}/api/health`, {
        method: "GET",
        headers: { "x-api-key": this.apiKey },
        signal: controller.signal,
      });

      clear();

      if (!response.ok) {
        await handleResponseError(response);
      }

      return (await response.json()) as HealthResult;
    } catch (err) {
      clear();
      if (err instanceof HoundShieldError) throw err;
      throw new HoundShieldError(
        `Health check failed: ${(err as Error).message}`,
        "NETWORK_ERROR",
        undefined,
        true
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

export default Hound Shield;
