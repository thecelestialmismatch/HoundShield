/**
 * OpenAI-Compatible Chat Completions Proxy
 *
 * POST /api/v1/chat/completions
 *
 * Drop-in replacement for the OpenAI Chat Completions API. Configure your
 * OpenAI client to point to this URL and all traffic is automatically
 * scanned by the Hound Shield compliance engine before reaching the upstream LLM.
 *
 * Authentication:
 *   Authorization: Bearer <houndshield-api-key>   (Hound Shield gateway key)
 *   x-provider-api-key: <upstream-key>       (OpenAI/Anthropic/Gemini key)
 *   x-provider: openai | anthropic | google | openrouter  (default: openai)
 *   x-user-id: <user-identifier>             (optional, for audit trail)
 *
 * Request body: standard OpenAI ChatCompletionCreateParams shape
 * Response: standard OpenAI ChatCompletion or ChatCompletionChunk (streaming)
 *
 * Error format: OpenAI-compatible error envelope
 *   { error: { message, type, code } }
 *
 * Compliance scan results are appended as response headers:
 *   X-Hound Shield-Risk-Level   e.g. NONE | LOW | MEDIUM | HIGH | CRITICAL
 *   X-Hound Shield-Action       ALLOWED | BLOCKED | QUARANTINED
 *   X-Hound Shield-Scan-Ms      scan latency in milliseconds
 *   X-Hound Shield-Request-Id   opaque request identifier for audit lookup
 */

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { isSupabaseConfigured, createServiceClient } from "@/lib/supabase/client";
import { classifyRisk } from "@/lib/classifier/risk-engine";
import { getUserSubscription, canAccessGateway } from "@/lib/subscription/check";
import type { ActionTaken, RiskLevel } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_BODY_SIZE = 1_048_576; // 1 MB

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-provider, x-provider-api-key, x-user-id",
};

// Provider base URLs for upstream proxying
const PROVIDER_ENDPOINTS: Record<string, string> = {
  openai: "https://api.openai.com/v1/chat/completions",
  anthropic: "https://api.anthropic.com/v1/messages",
  google: "https://generativelanguage.googleapis.com/v1beta/models",
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
};

// ---------------------------------------------------------------------------
// Request schema (OpenAI-compatible subset)
// ---------------------------------------------------------------------------

const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant", "tool", "function"]),
  content: z.union([
    z.string(),
    z.array(z.object({ type: z.string(), text: z.string().optional() }).passthrough()),
  ]),
  name: z.string().optional(),
  tool_call_id: z.string().optional(),
}).passthrough();

const CompletionRequestSchema = z.object({
  model: z.string().min(1).max(256),
  messages: z.array(MessageSchema).min(1).max(512),
  stream: z.boolean().optional().default(false),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().min(1).max(128_000).optional(),
  top_p: z.number().min(0).max(1).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
  stop: z.union([z.string(), z.array(z.string())]).optional(),
  n: z.number().int().min(1).max(10).optional().default(1),
  user: z.string().optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** OpenAI-format error envelope. */
function openAIError(
  message: string,
  type = "invalid_request_error",
  code: string | null = null,
  status = 400
): NextResponse {
  return NextResponse.json(
    { error: { message, type, ...(code ? { code } : {}), param: null } },
    { status, headers: CORS_HEADERS }
  );
}

/**
 * Validates a Hound Shield gateway API key.
 * Accepts any non-empty key in demo mode (Supabase not configured).
 */
async function validateGatewayKey(key: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return key.length > 0;
  }
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("api_keys")
      .select("id")
      .eq("key_hash", key)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (error?.code === "42P01") {
      // Table not yet migrated; accept any key
      return key.length > 0;
    }
    return !!data;
  } catch {
    return key.length > 0;
  }
}

/**
 * Extracts a plain text summary from the messages array for compliance scanning.
 * Concatenates all message contents up to 50K characters.
 */
function extractTextForScan(
  messages: z.infer<typeof MessageSchema>[]
): string {
  const parts: string[] = [];
  for (const msg of messages) {
    if (typeof msg.content === "string") {
      parts.push(msg.content);
    } else if (Array.isArray(msg.content)) {
      for (const block of msg.content) {
        if (block.text) parts.push(block.text);
      }
    }
    if (parts.join(" ").length > 50_000) break;
  }
  return parts.join("\n").slice(0, 50_000);
}

/**
 * Detects the upstream provider from the model name when not explicitly specified.
 * Falls back to "openai" if no match.
 */
function inferProvider(model: string, explicit?: string | null): string {
  if (explicit && PROVIDER_ENDPOINTS[explicit]) return explicit;
  if (model.startsWith("claude")) return "anthropic";
  if (model.startsWith("gemini")) return "google";
  if (model.startsWith("openrouter/")) return "openrouter";
  return "openai";
}

/**
 * Builds provider-specific request headers.
 */
function buildProviderHeaders(
  provider: string,
  providerApiKey: string
): Record<string, string> {
  const base: Record<string, string> = { "Content-Type": "application/json" };
  switch (provider) {
    case "anthropic":
      return {
        ...base,
        "x-api-key": providerApiKey,
        "anthropic-version": "2023-06-01",
      };
    case "google":
      // API key is appended to URL for Google
      return base;
    default:
      return { ...base, Authorization: `Bearer ${providerApiKey}` };
  }
}

/**
 * Converts an OpenAI-format message array to Anthropic Messages API format.
 */
function toAnthropicBody(
  body: z.infer<typeof CompletionRequestSchema>
): Record<string, unknown> {
  const system = body.messages.find((m) => m.role === "system");
  const nonSystem = body.messages.filter((m) => m.role !== "system");
  return {
    model: body.model,
    max_tokens: body.max_tokens ?? 4096,
    ...(system ? { system: typeof system.content === "string" ? system.content : "" } : {}),
    messages: nonSystem.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: typeof m.content === "string" ? m.content : "",
    })),
    stream: body.stream,
    temperature: body.temperature,
    top_p: body.top_p,
  };
}

/**
 * Converts an OpenAI-format message array to Google Gemini format.
 */
function toGeminiBody(
  body: z.infer<typeof CompletionRequestSchema>
): Record<string, unknown> {
  const systemInstruction = body.messages.find((m) => m.role === "system");
  const conversationMessages = body.messages.filter((m) => m.role !== "system");
  return {
    contents: conversationMessages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: typeof m.content === "string" ? m.content : "" }],
    })),
    ...(systemInstruction
      ? {
          systemInstruction: {
            parts: [{ text: typeof systemInstruction.content === "string" ? systemInstruction.content : "" }],
          },
        }
      : {}),
    generationConfig: {
      temperature: body.temperature,
      topP: body.top_p,
      maxOutputTokens: body.max_tokens,
    },
  };
}

// ---------------------------------------------------------------------------
// Non-streaming: fetch full response and translate to OpenAI format
// ---------------------------------------------------------------------------

async function fetchNonStreaming(
  provider: string,
  providerApiKey: string,
  body: z.infer<typeof CompletionRequestSchema>,
  requestId: string
): Promise<{ content: string; finishReason: string; promptTokens: number; completionTokens: number }> {
  let url = PROVIDER_ENDPOINTS[provider];
  let requestBody: Record<string, unknown>;

  if (provider === "anthropic") {
    requestBody = toAnthropicBody({ ...body, stream: false });
  } else if (provider === "google") {
    const model = body.model.replace("models/", "");
    url = `${PROVIDER_ENDPOINTS.google}/${model}:generateContent?key=${providerApiKey}`;
    requestBody = toGeminiBody(body);
  } else {
    // OpenAI / OpenRouter: passthrough
    requestBody = { ...body, stream: false };
  }

  const headers = buildProviderHeaders(provider, providerApiKey);
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Provider ${provider} returned ${response.status}: ${errText.slice(0, 300)}`);
  }

  const data = await response.json();

  // Normalize to { content, finishReason, promptTokens, completionTokens }
  if (provider === "anthropic") {
    const block = data?.content?.[0];
    return {
      content: block?.text ?? "",
      finishReason: data?.stop_reason === "end_turn" ? "stop" : data?.stop_reason ?? "stop",
      promptTokens: data?.usage?.input_tokens ?? 0,
      completionTokens: data?.usage?.output_tokens ?? 0,
    };
  }

  if (provider === "google") {
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return {
      content: text,
      finishReason: data?.candidates?.[0]?.finishReason === "STOP" ? "stop" : "stop",
      promptTokens: data?.usageMetadata?.promptTokenCount ?? 0,
      completionTokens: data?.usageMetadata?.candidatesTokenCount ?? 0,
    };
  }

  // OpenAI / OpenRouter
  const choice = data?.choices?.[0];
  return {
    content: choice?.message?.content ?? "",
    finishReason: choice?.finish_reason ?? "stop",
    promptTokens: data?.usage?.prompt_tokens ?? 0,
    completionTokens: data?.usage?.completion_tokens ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Streaming: proxy SSE and convert to OpenAI chunk format
// ---------------------------------------------------------------------------

function buildStreamingProxy(
  provider: string,
  providerApiKey: string,
  body: z.infer<typeof CompletionRequestSchema>,
  requestId: string,
  complianceHeaders: Record<string, string>
): Response {
  let url = PROVIDER_ENDPOINTS[provider];
  let requestBody: Record<string, unknown>;

  if (provider === "anthropic") {
    requestBody = toAnthropicBody({ ...body, stream: true });
  } else if (provider === "google") {
    const model = body.model.replace("models/", "");
    url = `${PROVIDER_ENDPOINTS.google}/${model}:streamGenerateContent?alt=sse&key=${providerApiKey}`;
    requestBody = toGeminiBody(body);
  } else {
    requestBody = { ...body, stream: true };
  }

  const headers = buildProviderHeaders(provider, providerApiKey);

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();

      const enqueue = (chunk: string) => controller.enqueue(enc.encode(chunk));

      try {
        const upstream = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(requestBody),
        });

        if (!upstream.ok) {
          const err = await upstream.text().catch(() => "");
          const errChunk = `data: ${JSON.stringify({
            error: {
              message: `Provider ${provider} returned ${upstream.status}: ${err.slice(0, 200)}`,
              type: "provider_error",
              code: "upstream_error",
            },
          })}\n\n`;
          enqueue(errChunk);
          enqueue("data: [DONE]\n\n");
          return;
        }

        if (!upstream.body) {
          enqueue("data: [DONE]\n\n");
          return;
        }

        const reader = upstream.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let tokenIndex = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            // Pass-through for OpenAI / OpenRouter (already in OpenAI chunk format)
            if (provider === "openai" || provider === "openrouter") {
              if (trimmed.startsWith("data: ")) {
                enqueue(trimmed + "\n\n");
              }
              continue;
            }

            // Normalize Anthropic and Google to OpenAI chunk format
            if (!trimmed.startsWith("data: ")) continue;
            const rawData = trimmed.slice(6).trim();
            if (rawData === "[DONE]") continue;

            let parsed: Record<string, unknown>;
            try {
              parsed = JSON.parse(rawData);
            } catch {
              continue;
            }

            let deltaContent: string | null = null;

            if (provider === "anthropic") {
              // Anthropic delta types: content_block_delta with text_delta
              if (
                parsed.type === "content_block_delta" &&
                typeof parsed.delta === "object" &&
                parsed.delta !== null &&
                (parsed.delta as Record<string, unknown>).type === "text_delta"
              ) {
                deltaContent = String((parsed.delta as Record<string, unknown>).text ?? "");
              }
            } else if (provider === "google") {
              // Gemini streaming: candidates[0].content.parts[0].text
              const parsedGoogle = parsed as Record<string, unknown>;
              const candidates = Array.isArray(parsedGoogle?.candidates)
                ? (parsedGoogle.candidates as Record<string, unknown>[])
                : [];
              const firstCandidate = candidates[0] as Record<string, unknown> | undefined;
              const content = firstCandidate?.content as Record<string, unknown> | undefined;
              const parts = Array.isArray(content?.parts)
                ? (content.parts as Record<string, unknown>[])
                : [];
              const text = parts[0]?.text;
              if (typeof text === "string") deltaContent = text;
            }

            if (deltaContent !== null) {
              const chunk = {
                id: `chatcmpl-${requestId}`,
                object: "chat.completion.chunk",
                created: Math.floor(Date.now() / 1000),
                model: body.model,
                choices: [
                  {
                    index: 0,
                    delta: { content: deltaContent },
                    finish_reason: null,
                  },
                ],
              };
              enqueue(`data: ${JSON.stringify(chunk)}\n\n`);
              tokenIndex++;
            }

            // Emit finish chunk on stream stop signals
            const isAnthropicDone =
              provider === "anthropic" && parsed.type === "message_stop";
            const parsedForDone = parsed as Record<string, unknown>;
            const googleCandidates = Array.isArray(parsedForDone.candidates)
              ? (parsedForDone.candidates as Record<string, unknown>[])
              : [];
            const isGoogleDone =
              provider === "google" &&
              googleCandidates.length > 0 &&
              (googleCandidates[0] as Record<string, unknown>)?.finishReason === "STOP";

            if (isAnthropicDone || isGoogleDone) {
              const finishChunk = {
                id: `chatcmpl-${requestId}`,
                object: "chat.completion.chunk",
                created: Math.floor(Date.now() / 1000),
                model: body.model,
                choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
              };
              enqueue(`data: ${JSON.stringify(finishChunk)}\n\n`);
            }
          }
        }

        enqueue("data: [DONE]\n\n");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Stream error";
        console.error(`[v1/chat/completions] Stream error:`, err);
        const errData = `data: ${JSON.stringify({
          error: { message, type: "stream_error", code: "internal" },
        })}\n\n`;
        enqueue(errData);
        enqueue("data: [DONE]\n\n");
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "X-Request-Id": requestId,
      ...complianceHeaders,
      ...CORS_HEADERS,
    },
  });
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest): Promise<Response> {
  const requestId = randomUUID();
  const scanStart = performance.now();

  // --- Size guard --------------------------------------------------------
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
    return openAIError("Request body too large. Maximum size is 1MB.", "invalid_request_error", "request_too_large", 413);
  }

  // --- API key extraction ------------------------------------------------
  // Accept both "Authorization: Bearer <key>" (standard OpenAI) and "x-api-key"
  let gatewayKey: string | null = null;
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    gatewayKey = authHeader.slice(7).trim();
  } else {
    gatewayKey = req.headers.get("x-api-key");
  }

  if (!gatewayKey) {
    return openAIError(
      "Missing API key. Provide it via 'Authorization: Bearer <key>' or 'x-api-key' header.",
      "invalid_request_error",
      "missing_api_key",
      401
    );
  }

  const isValid = await validateGatewayKey(gatewayKey);
  if (!isValid) {
    return openAIError("Invalid API key.", "invalid_request_error", "invalid_api_key", 401);
  }

  // --- Parse body --------------------------------------------------------
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return openAIError("Could not parse JSON body.", "invalid_request_error", null, 400);
  }

  const parseResult = CompletionRequestSchema.safeParse(rawBody);
  if (!parseResult.success) {
    const firstIssue = parseResult.error.issues[0];
    return openAIError(
      `Invalid request: ${firstIssue.path.join(".")} ${firstIssue.message}`,
      "invalid_request_error",
      null,
      400
    );
  }

  const body = parseResult.data;
  const userId = req.headers.get("x-user-id") ?? body.user ?? "anonymous";

  // --- Subscription gate ------------------------------------------------
  const tier = await getUserSubscription(userId);
  if (!canAccessGateway(tier)) {
    return openAIError(
      "Gateway access requires a Pro plan or higher. Upgrade at https://houndshield.com/pricing",
      "insufficient_quota",
      "plan_required",
      402
    );
  }

  // --- Compliance scan --------------------------------------------------
  const textToScan = extractTextForScan(body.messages);
  const classification = await classifyRisk(textToScan);
  const scanMs = Math.round(performance.now() - scanStart);

  const action: ActionTaken =
    classification.should_block ? "BLOCKED" :
    classification.should_quarantine ? "QUARANTINED" : "ALLOWED";

  const complianceHeaders: Record<string, string> = {
    "X-Hound Shield-Risk-Level": classification.risk_level,
    "X-Hound Shield-Action": action,
    "X-Hound Shield-Scan-Ms": String(scanMs),
    "X-Hound Shield-Request-Id": requestId,
  };

  // --- Block/quarantine response ----------------------------------------
  if (action === "BLOCKED") {
    return NextResponse.json(
      {
        error: {
          message:
            "Request blocked by Hound Shield compliance firewall. " +
            `Risk level: ${classification.risk_level}. ` +
            `Detected: ${classification.entities.map((e) => e.type).join(", ") || "policy violation"}.`,
          type: "content_policy_violation",
          code: "compliance_blocked",
          houndshield_meta: {
            risk_level: classification.risk_level,
            entities: classification.entities.slice(0, 5),
            scan_ms: scanMs,
            request_id: requestId,
          },
        },
      },
      { status: 403, headers: { ...complianceHeaders, ...CORS_HEADERS } }
    );
  }

  if (action === "QUARANTINED") {
    return NextResponse.json(
      {
        error: {
          message:
            "Request quarantined by Hound Shield compliance firewall pending review. " +
            `Risk level: ${classification.risk_level}.`,
          type: "content_policy_violation",
          code: "compliance_quarantined",
          houndshield_meta: {
            risk_level: classification.risk_level,
            entities: classification.entities.slice(0, 5),
            scan_ms: scanMs,
            request_id: requestId,
          },
        },
      },
      { status: 202, headers: { ...complianceHeaders, ...CORS_HEADERS } }
    );
  }

  // --- Route to upstream provider ----------------------------------------
  const providerHint = req.headers.get("x-provider");
  const provider = inferProvider(body.model, providerHint);
  const providerApiKey =
    req.headers.get("x-provider-api-key") ??
    (provider === "anthropic"
      ? process.env.ANTHROPIC_API_KEY
      : provider === "google"
      ? process.env.GEMINI_API_KEY
      : provider === "openrouter"
      ? process.env.OPENROUTER_API_KEY
      : process.env.OPENAI_API_KEY) ??
    "";

  if (!providerApiKey) {
    return openAIError(
      `No API key available for provider '${provider}'. Pass it via 'x-provider-api-key' header or configure the server environment.`,
      "invalid_request_error",
      "missing_provider_key",
      400
    );
  }

  // --- Streaming path ----------------------------------------------------
  if (body.stream) {
    return buildStreamingProxy(provider, providerApiKey, body, requestId, complianceHeaders);
  }

  // --- Non-streaming path ------------------------------------------------
  try {
    const result = await fetchNonStreaming(provider, providerApiKey, body, requestId);

    const openAIResponse = {
      id: `chatcmpl-${requestId}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: body.model,
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: result.content },
          finish_reason: result.finishReason,
          logprobs: null,
        },
      ],
      usage: {
        prompt_tokens: result.promptTokens,
        completion_tokens: result.completionTokens,
        total_tokens: result.promptTokens + result.completionTokens,
      },
      system_fingerprint: null,
      houndshield_meta: {
        risk_level: classification.risk_level,
        scan_ms: scanMs,
        action: "ALLOWED",
        request_id: requestId,
        provider,
      },
    };

    return NextResponse.json(openAIResponse, {
      status: 200,
      headers: { ...complianceHeaders, ...CORS_HEADERS },
    });
  } catch (err) {
    console.error(`[v1/chat/completions/${requestId}] Provider error:`, err);
    const message = err instanceof Error ? err.message : "Provider error";
    return openAIError(message, "api_error", "provider_error", 502);
  }
}
