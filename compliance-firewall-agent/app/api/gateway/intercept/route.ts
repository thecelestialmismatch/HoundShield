import { NextRequest, NextResponse } from "next/server";
import { interceptLLMRequest } from "@/lib/interceptor/middleware";
import { z } from "zod";

const InterceptRequestSchema = z.object({
  messages: z.array(z.object({ role: z.string(), content: z.unknown() })).optional(),
  prompt: z.string().optional(),
  system: z.string().optional(),
  _destination_url: z.string().optional(),
}).passthrough();

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
 *   500: Internal error
 */
export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing x-api-key header" },
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
