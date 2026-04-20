import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { isSupabaseConfigured, createServiceClient } from "@/lib/supabase/client";
import { streamProxy } from "@/lib/gateway/stream-proxy";
import { eventBus } from "@/lib/gateway/event-bus";
import { getUserSubscription, canAccessGateway } from "@/lib/subscription/check";
import type { ActionTaken, RiskLevel } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const StreamRequestSchema = z.object({
  provider: z.enum(["openai", "anthropic", "google", "openrouter"]),
  model: z.string().min(1).max(128),
  messages: z
    .array(
      z.object({
        role: z.string().min(1),
        content: z.string().min(1),
      })
    )
    .min(1)
    .max(256),
  api_key: z.string().min(1),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().min(1).max(128_000).optional(),
});

/** Maximum request body size: 1 MB */
const MAX_BODY_SIZE = 1_048_576;

// ---------------------------------------------------------------------------
// Auth — mirrors the pattern from app/api/gateway/intercept/route.ts
// ---------------------------------------------------------------------------

/**
 * Validates a Hound Shield API key against stored keys in the database,
 * or accepts any non-empty key when running in demo mode.
 */
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
      console.warn(
        "api_keys table not found — accepting any key. Run migrations to enable key validation."
      );
      return apiKey.length > 0;
    }

    return !!data;
  } catch {
    console.error("API key validation error — falling back to presence check");
    return apiKey.length > 0;
  }
}

// ---------------------------------------------------------------------------
// CORS headers
// ---------------------------------------------------------------------------

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, x-api-key, x-user-id, x-destination-url",
};

// ---------------------------------------------------------------------------
// OPTIONS preflight
// ---------------------------------------------------------------------------

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// ---------------------------------------------------------------------------
// POST /api/gateway/stream
// ---------------------------------------------------------------------------

/**
 * SSE streaming gateway endpoint.
 *
 * This is the primary product endpoint. It accepts an LLM request,
 * runs compliance scans on the input, proxies to the provider in
 * streaming mode, scans the output, and returns everything as
 * Server-Sent Events.
 *
 * Events emitted:
 *   - `compliance_check` — input scan result
 *   - `token`            — individual streamed tokens from the LLM
 *   - `output_scan`      — output scan result
 *   - `done`             — summary with timing and compliance info
 *   - `error`            — emitted on failures, then stream closes
 *
 * Headers:
 *   x-api-key (required): Hound Shield API key
 *   x-user-id (optional): caller identifier, defaults to "anonymous"
 */
export async function POST(req: NextRequest) {
  const requestId = randomUUID();

  try {
    // --- Size check -------------------------------------------------------
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: "Request body too large. Maximum size is 1MB.", request_id: requestId },
        { status: 413, headers: CORS_HEADERS }
      );
    }

    // --- Auth -------------------------------------------------------------
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing x-api-key header", request_id: requestId },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const isValid = await validateApiKey(apiKey);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid API key", request_id: requestId },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    // --- Parse & validate body -------------------------------------------
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Malformed JSON body", request_id: requestId },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const parseResult = StreamRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: parseResult.error.issues,
          request_id: requestId,
        },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const body = parseResult.data;
    const userId = req.headers.get("x-user-id") ?? "anonymous";

    // --- Subscription gate ------------------------------------------------
    const tier = await getUserSubscription(userId);
    if (!canAccessGateway(tier)) {
      return NextResponse.json(
        {
          error: "Gateway access requires a Pro plan or higher",
          upgrade_url: "/pricing",
          current_tier: tier,
          request_id: requestId,
        },
        { status: 402, headers: CORS_HEADERS }
      );
    }

    // --- Build the stream ------------------------------------------------
    const streamRequest = {
      request_id: requestId,
      provider: body.provider,
      model: body.model,
      messages: body.messages,
      api_key: body.api_key,
      temperature: body.temperature,
      max_tokens: body.max_tokens,
      user_id: userId,
    };

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const enqueue = (event: string, data: unknown) => {
          const sseData = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(sseData));
        };

        try {
          let complianceAction: ActionTaken = "ALLOWED";
          let riskLevel: RiskLevel = "NONE";
          let processingTimeMs = 0;

          for await (const event of streamProxy(streamRequest)) {
            enqueue(event.type, event.data);

            // Track action from compliance check for the event bus
            if (event.type === "compliance_check") {
              const statusMap: Record<string, ActionTaken> = {
                passed: "ALLOWED",
                blocked: "BLOCKED",
                quarantined: "QUARANTINED",
              };
              complianceAction = statusMap[event.data.status] ?? "ALLOWED";
              riskLevel = event.data.risk_level;
            }

            if (event.type === "done") {
              processingTimeMs = event.data.processing_time_ms;
            }
          }

          // Publish to the event bus for the dashboard SSE feed
          eventBus.publish({
            id: requestId,
            action: complianceAction,
            risk_level: riskLevel,
            user_id: userId,
            provider: body.provider,
            model: body.model,
            timestamp: new Date().toISOString(),
            processing_time_ms: processingTimeMs,
            classifications: [],
            entities_found: 0,
          });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Internal stream error";
          console.error(`[stream/${requestId}] Unhandled error:`, err);

          const errorPayload = {
            message,
            code: "STREAM_ERROR",
            request_id: requestId,
          };
          const errorEvent = `event: error\ndata: ${JSON.stringify(errorPayload)}\n\n`;
          controller.enqueue(encoder.encode(errorEvent));
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
        "X-Request-Id": requestId,
        "X-Accel-Buffering": "no", // Disable Nginx buffering
        ...CORS_HEADERS,
      },
    });
  } catch (err) {
    console.error(`[stream/${requestId}] Top-level error:`, err);
    return NextResponse.json(
      {
        error: "Internal server error",
        request_id: requestId,
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
