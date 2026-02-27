import { NextRequest, NextResponse } from "next/server";
import { interceptLLMRequest } from "@/lib/interceptor/middleware";
import { isSupabaseConfigured, createServiceClient } from "@/lib/supabase/client";
import { z } from "zod";

const InterceptRequestSchema = z.object({
  messages: z.array(z.object({ role: z.string(), content: z.unknown() })).optional(),
  prompt: z.string().optional(),
  system: z.string().optional(),
  _destination_url: z.string().optional(),
}).passthrough();

// Maximum request body size (1MB)
const MAX_BODY_SIZE = 1_048_576;

/**
 * Validates an API key against stored keys in the database,
 * or accepts any non-empty key in demo mode.
 */
async function validateApiKey(apiKey: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    // Demo mode: accept any non-empty key
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

    // If the api_keys table doesn't exist yet, fall back to presence check
    if (error?.code === "42P01") {
      console.warn("api_keys table not found — accepting any key. Run migrations to enable key validation.");
      return apiKey.length > 0;
    }

    return !!data;
  } catch {
    // If validation fails, don't block the request — log and allow
    console.error("API key validation error — falling back to presence check");
    return apiKey.length > 0;
  }
}

/**
 * POST /api/gateway/intercept
 *
 * Main entry point. All outbound LLM requests are routed here
 * before reaching their destination. The interceptor inspects the
 * prompt, classifies risk, and decides whether to allow, block,
 * or quarantine the request.
 *
 * Headers:
 *   x-user-id: Identifier of the user making the request (required)
 *   x-destination-url: Target LLM provider URL (optional, can also
 *                      be in the body as _destination_url)
 *   x-api-key: API key for authenticating with this gateway
 *
 * Response:
 *   200: Request allowed — proceed with the LLM call
 *   403: Request blocked — sensitive data detected
 *   202: Request quarantined — pending human review
 *   400: Invalid request body
 *   401: Missing or invalid API key
 *   413: Request body too large
 *   500: Internal error
 */
export async function POST(req: NextRequest) {
  try {
    // Check request size
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: "Request body too large. Maximum size is 1MB." },
        { status: 413 }
      );
    }

    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing x-api-key header" },
        { status: 401 }
      );
    }

    const isValid = await validateApiKey(apiKey);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      );
    }

    const userId = req.headers.get("x-user-id") ?? "anonymous";

    const rawBody = await req.json();
    const parseResult = InterceptRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const result = await interceptLLMRequest(rawBody, headers, userId);

    const statusCode = result.action === "BLOCKED" ? 403
      : result.action === "QUARANTINED" ? 202
      : 200;

    return NextResponse.json(result, { status: statusCode });
  } catch (err) {
    console.error("Intercept error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
