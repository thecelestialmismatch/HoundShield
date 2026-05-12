/**
 * WebSocket Connection Handler for the Hound Shield Gateway.
 *
 * Manages the full lifecycle of a WebSocket connection:
 *   1. Authentication (first message must be `auth`)
 *   2. Request processing via the shared `streamProxy` engine
 *   3. Per-connection request queuing (one at a time, like OpenAI)
 *   4. Heartbeat ping/pong
 *   5. Graceful disconnect and resource cleanup
 *
 * Protocol:
 *   Client -> { type: "auth", api_key: "houndshield-key-..." }
 *   Server -> { type: "auth.success", session_id: "uuid" }
 *
 *   Client -> { type: "request.create", provider, model, messages, api_key, ... }
 *   Server -> { type: "compliance.scan", ... }
 *   Server -> { type: "response.delta", content, index }
 *   Server -> { type: "output.scan", ... }
 *   Server -> { type: "response.done", ... }
 *
 *   Client -> { type: "ping" }
 *   Server -> { type: "pong", timestamp }
 */

import { randomUUID } from "crypto";
import type { IncomingMessage } from "http";
import type WebSocket from "ws";
import { isSupabaseConfigured, createServiceClient } from "@/lib/supabase/client";
import { streamProxy, type StreamRequest, type StreamProvider } from "./stream-proxy";
import { eventBus } from "./event-bus";
import type { ActionTaken, RiskLevel } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum time a connection can remain open (ms). 60 minutes. */
const CONNECTION_TIMEOUT_MS = 60 * 60 * 1000;

/** Interval between server-initiated WebSocket pings (ms). */
const HEARTBEAT_INTERVAL_MS = 30_000;

/** Time to wait for a pong response before considering the connection dead (ms). */
const PONG_TIMEOUT_MS = 10_000;

/** Maximum time to wait for the auth message after connecting (ms). */
const AUTH_TIMEOUT_MS = 15_000;

/** Valid providers accepted in request.create messages. */
const VALID_PROVIDERS = new Set<string>(["openai", "anthropic", "google", "openrouter"]);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Typed wrapper for messages the client sends. */
type ClientMessage =
  | { type: "auth"; api_key: string }
  | {
      type: "request.create";
      provider: string;
      model: string;
      messages: Array<{ role: string; content: string }>;
      api_key: string;
      temperature?: number;
      max_tokens?: number;
    }
  | { type: "ping" };

/** Per-connection state. */
interface ConnectionState {
  sessionId: string;
  authenticated: boolean;
  userId: string;
  processing: boolean;
  totalRequests: number;
  connectedAt: number;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

async function validateApiKey(apiKey: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return apiKey.length > 0;
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("api_keys")
      .select("id")
      .eq("key_hash", apiKey)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (error?.code === "42P01") {
      return apiKey.length > 0;
    }

    return !!data;
  } catch {
    return apiKey.length > 0;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Send a typed JSON message over WebSocket. Only sends if the socket is open. */
function sendMessage(ws: WebSocket, payload: Record<string, unknown>): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

/** Attempt to parse a raw WebSocket message as JSON. */
function parseMessage(raw: WebSocket.RawData): ClientMessage | null {
  try {
    const text = typeof raw === "string" ? raw : raw.toString("utf-8");
    const parsed = JSON.parse(text);
    if (typeof parsed === "object" && parsed !== null && typeof parsed.type === "string") {
      return parsed as ClientMessage;
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

/**
 * Handles a single WebSocket connection.
 *
 * @param ws  - The WebSocket instance from the `ws` library.
 * @param req - The HTTP upgrade request (used for IP extraction, headers, etc.).
 */
export function handleWebSocketConnection(ws: WebSocket, req: IncomingMessage): void {
  const state: ConnectionState = {
    sessionId: randomUUID(),
    authenticated: false,
    userId: "anonymous",
    processing: false,
    totalRequests: 0,
    connectedAt: Date.now(),
  };

  const clientIp =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
    req.socket.remoteAddress ??
    "unknown";

  console.log(
    `[ws/${state.sessionId}] Connection opened from ${clientIp}`
  );

  // -----------------------------------------------------------------------
  // Connection timeout — close after max lifetime
  // -----------------------------------------------------------------------
  const connectionTimer = setTimeout(() => {
    console.log(`[ws/${state.sessionId}] Connection timeout reached (60 min)`);
    sendMessage(ws, {
      type: "response.error",
      message: "Connection timeout — maximum session duration reached. Please reconnect.",
    });
    ws.close(4008, "Connection timeout");
  }, CONNECTION_TIMEOUT_MS);

  // -----------------------------------------------------------------------
  // Auth timeout — must authenticate within 15 seconds
  // -----------------------------------------------------------------------
  const authTimer = setTimeout(() => {
    if (!state.authenticated) {
      console.log(`[ws/${state.sessionId}] Auth timeout — closing`);
      sendMessage(ws, {
        type: "auth.error",
        message: "Authentication timeout — send an auth message within 15 seconds of connecting.",
      });
      ws.close(4001, "Auth timeout");
    }
  }, AUTH_TIMEOUT_MS);

  // -----------------------------------------------------------------------
  // Heartbeat — server pings every 30s, expects pong back
  // -----------------------------------------------------------------------
  let pongReceived = true;

  const heartbeatTimer = setInterval(() => {
    if (!pongReceived) {
      console.log(`[ws/${state.sessionId}] Pong not received — terminating`);
      ws.terminate();
      return;
    }
    pongReceived = false;
    ws.ping();
  }, HEARTBEAT_INTERVAL_MS);

  ws.on("pong", () => {
    pongReceived = true;
  });

  // -----------------------------------------------------------------------
  // Message handler
  // -----------------------------------------------------------------------
  ws.on("message", async (raw: WebSocket.RawData) => {
    const msg = parseMessage(raw);

    if (!msg) {
      sendMessage(ws, {
        type: "response.error",
        message: "Malformed message — expected valid JSON with a 'type' field.",
      });
      return;
    }

    // --- Ping/Pong (always allowed, even before auth) --------------------
    if (msg.type === "ping") {
      sendMessage(ws, { type: "pong", timestamp: Date.now() });
      return;
    }

    // --- Auth ------------------------------------------------------------
    if (msg.type === "auth") {
      if (state.authenticated) {
        sendMessage(ws, {
          type: "auth.error",
          message: "Already authenticated for this session.",
        });
        return;
      }

      if (!msg.api_key || typeof msg.api_key !== "string") {
        sendMessage(ws, {
          type: "auth.error",
          message: "Missing or invalid api_key in auth message.",
        });
        return;
      }

      const valid = await validateApiKey(msg.api_key);
      if (!valid) {
        sendMessage(ws, { type: "auth.error", message: "Invalid API key" });
        ws.close(4003, "Invalid API key");
        return;
      }

      state.authenticated = true;
      clearTimeout(authTimer);
      sendMessage(ws, {
        type: "auth.success",
        session_id: state.sessionId,
      });

      console.log(`[ws/${state.sessionId}] Authenticated`);
      return;
    }

    // --- Guard: must be authenticated ------------------------------------
    if (!state.authenticated) {
      sendMessage(ws, {
        type: "response.error",
        message: "Not authenticated. Send an auth message first.",
      });
      return;
    }

    // --- Request.create --------------------------------------------------
    if (msg.type === "request.create") {
      // Enforce serial processing (one request at a time per connection)
      if (state.processing) {
        sendMessage(ws, {
          type: "response.error",
          message: "A request is already in progress. Wait for response.done before sending another.",
        });
        return;
      }

      // Validate fields
      if (!msg.provider || !VALID_PROVIDERS.has(msg.provider)) {
        sendMessage(ws, {
          type: "response.error",
          message: `Invalid provider. Must be one of: ${[...VALID_PROVIDERS].join(", ")}`,
        });
        return;
      }

      if (!msg.model || typeof msg.model !== "string") {
        sendMessage(ws, {
          type: "response.error",
          message: "Missing or invalid 'model' field.",
        });
        return;
      }

      if (!Array.isArray(msg.messages) || msg.messages.length === 0) {
        sendMessage(ws, {
          type: "response.error",
          message: "Missing or empty 'messages' array.",
        });
        return;
      }

      if (!msg.api_key || typeof msg.api_key !== "string") {
        sendMessage(ws, {
          type: "response.error",
          message: "Missing or invalid 'api_key' for the LLM provider.",
        });
        return;
      }

      state.processing = true;
      state.totalRequests++;

      const requestId = randomUUID();
      let complianceAction: ActionTaken = "ALLOWED";
      let riskLevel: RiskLevel = "NONE";
      let processingTimeMs = 0;

      const streamRequest: StreamRequest = {
        request_id: requestId,
        provider: msg.provider as StreamProvider,
        model: msg.model,
        messages: msg.messages,
        api_key: msg.api_key,
        temperature: msg.temperature,
        max_tokens: msg.max_tokens,
        user_id: state.userId,
      };

      try {
        for await (const event of streamProxy(streamRequest)) {
          // Map stream-proxy event types to WebSocket protocol message types
          switch (event.type) {
            case "compliance_check": {
              const statusMap: Record<string, ActionTaken> = {
                passed: "ALLOWED",
                blocked: "BLOCKED",
                quarantined: "QUARANTINED",
              };
              complianceAction = statusMap[event.data.status] ?? "ALLOWED";
              riskLevel = event.data.risk_level;

              sendMessage(ws, {
                type: "compliance.scan",
                status: event.data.status,
                risk_level: event.data.risk_level,
                entities: event.data.entities,
                scan_time_ms: event.data.scan_time_ms,
                request_id: requestId,
              });
              break;
            }

            case "token":
              sendMessage(ws, {
                type: "response.delta",
                content: event.data.content,
                index: event.data.index,
                model: event.data.model,
              });
              break;

            case "output_scan":
              sendMessage(ws, {
                type: "output.scan",
                status: event.data.status,
                tokens_scanned: event.data.tokens_scanned,
                alerts: event.data.alerts,
                scan_time_ms: event.data.scan_time_ms,
              });
              break;

            case "done":
              processingTimeMs = event.data.processing_time_ms;

              sendMessage(ws, {
                type: "response.done",
                usage: {
                  total_tokens: event.data.total_tokens,
                },
                compliance: event.data.compliance_summary,
                total_time_ms: event.data.processing_time_ms,
                provider_time_ms: event.data.provider_time_ms,
                request_id: requestId,
              });
              break;

            case "error":
              sendMessage(ws, {
                type: "response.error",
                message: event.data.message,
                code: event.data.code,
                request_id: requestId,
              });
              break;
          }
        }

        // Publish to event bus for the dashboard
        eventBus.publish({
          id: requestId,
          action: complianceAction,
          risk_level: riskLevel,
          user_id: state.userId,
          provider: msg.provider,
          model: msg.model,
          timestamp: new Date().toISOString(),
          processing_time_ms: processingTimeMs,
          classifications: [],
          entities_found: 0,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Internal stream processing error";
        console.error(`[ws/${state.sessionId}] Stream error:`, err);
        sendMessage(ws, {
          type: "response.error",
          message,
          request_id: requestId,
        });
      } finally {
        state.processing = false;
      }

      return;
    }

    // --- Unknown message type --------------------------------------------
    sendMessage(ws, {
      type: "response.error",
      message: `Unknown message type: "${(msg as Record<string, unknown>).type}". Expected: auth, request.create, or ping.`,
    });
  });

  // -----------------------------------------------------------------------
  // Error handling
  // -----------------------------------------------------------------------
  ws.on("error", (err) => {
    console.error(`[ws/${state.sessionId}] Socket error:`, err.message);
  });

  // -----------------------------------------------------------------------
  // Disconnect cleanup
  // -----------------------------------------------------------------------
  ws.on("close", (code, reason) => {
    console.log(
      `[ws/${state.sessionId}] Connection closed (code=${code}, reason=${reason?.toString() ?? "none"}). ` +
        `Total requests: ${state.totalRequests}, ` +
        `Duration: ${Math.round((Date.now() - state.connectedAt) / 1000)}s`
    );

    clearTimeout(connectionTimer);
    clearTimeout(authTimer);
    clearInterval(heartbeatTimer);
  });
}
