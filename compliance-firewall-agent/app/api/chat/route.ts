/**
 * POST /api/chat — Streaming AI Chat via OpenRouter
 *
 * Accepts messages and streams back AI responses in real-time.
 * Also runs Kaelus compliance scanning on user input before proxying.
 *
 * Body: { messages, model?, system?, temperature? }
 * Response: SSE stream — data: { content } chunks, then data: [DONE]
 */

import { NextRequest, NextResponse } from "next/server";
import { classifyRisk } from "@/lib/classifier/risk-engine";
import { createRateLimiter } from "@/lib/rate-limit";

// Rate limit: 10 requests per minute
const limiter = createRateLimiter("chat", { limit: 10, windowMs: 60 * 1000 });

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Model registry — maps friendly names to OpenRouter model IDs
// ---------------------------------------------------------------------------

const MODEL_MAP: Record<string, string> = {
  // Free models (best for default experience)
  "gemini-flash": "google/gemini-2.0-flash-exp:free",
  "llama-70b": "meta-llama/llama-3.3-70b-instruct:free",
  "deepseek-v3": "deepseek/deepseek-chat:free",
  "qwen-72b": "qwen/qwen-2.5-72b-instruct:free",
  // Paid models (better quality)
  "gpt-4o-mini": "openai/gpt-4o-mini",
  "gpt-4o": "openai/gpt-4o",
  "claude-sonnet": "anthropic/claude-3.5-sonnet",
  "claude-haiku": "anthropic/claude-3.5-haiku",
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "anonymous";
    const rateLimitResult = limiter(ip);
    
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Too many requests" }, {
        status: 429,
        headers: {
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.reset.toString(),
        }
      });
    }

    const body = await request.json();
    const {
      messages,
      model = "gemini-flash",
      system,
      temperature = 0.7,
      scanInput = true,
    } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    // Get API key from env or from request header
    const apiKey =
      process.env.OPENROUTER_API_KEY ||
      request.headers.get("x-openrouter-key") ||
      "";

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "no_api_key",
          message:
            "OpenRouter API key not configured. Add OPENROUTER_API_KEY to .env.local or set it in Dashboard → Settings.",
        },
        { status: 503 }
      );
    }

    // Resolve model ID
    const resolvedModel = MODEL_MAP[model] || model;

    // ----- Compliance scan on user input -----
    const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === "user");
    let complianceMeta: Record<string, unknown> | null = null;

    if (scanInput && lastUserMsg) {
      const scanResult = await classifyRisk(lastUserMsg.content);
      if (scanResult.should_block) {
        // Return a compliance block as a non-streaming JSON response
        return NextResponse.json(
          {
            error: "compliance_block",
            message: `️ Compliance Alert: Your message was blocked because it contains ${scanResult.classifications.join(", ")} data (Risk: ${scanResult.risk_level}). Kaelus protects sensitive data from being sent to AI providers.`,
            scan: {
              risk_level: scanResult.risk_level,
              classifications: scanResult.classifications,
              entities: scanResult.entities.map((e) => ({
                type: e.type,
                pattern: e.pattern_matched,
              })),
            },
          },
          { status: 451 }
        );
      }

      if (scanResult.entities.length > 0) {
        complianceMeta = {
          risk_level: scanResult.risk_level,
          entities_found: scanResult.entities.length,
          classifications: scanResult.classifications,
        };
      }
    }

    // ----- Build messages for OpenRouter -----
    const fullMessages: Array<{ role: string; content: string }> = [];

    // System prompt
    const systemPrompt =
      system ||
      "You are Kaelus AI, an intelligent assistant integrated into the Kaelus AI Compliance Platform. You can help with coding, data analysis, security auditing, compliance questions, and general tasks. Be concise, helpful, and professional. When showing code, use markdown code blocks with language hints.";

    fullMessages.push({ role: "system", content: systemPrompt });
    fullMessages.push(...messages);

    // ----- Call OpenRouter streaming API -----
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://kaelus.online",
        "X-Title": "Kaelus AI Platform",
      },
      body: JSON.stringify({
        model: resolvedModel,
        messages: fullMessages,
        temperature,
        stream: true,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[chat] OpenRouter error ${response.status}:`, errText);
      return NextResponse.json(
        { error: "provider_error", message: `AI provider returned ${response.status}` },
        { status: 502 }
      );
    }

    // ----- Stream the response -----
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        // If compliance metadata exists, send it as the first chunk
        if (complianceMeta) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ compliance: complianceMeta })}\n\n`
            )
          );
        }

        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data: ")) continue;

              const data = trimmed.slice(6);
              if (data === "[DONE]") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                  );
                }
              } catch {
                // Skip malformed chunks
              }
            }
          }
        } catch (err) {
          console.error("[chat] Stream read error:", err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[chat] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
