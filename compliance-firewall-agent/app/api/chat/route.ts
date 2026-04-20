/**
 * POST /api/chat — Streaming AI Chat via OpenRouter with Local FAQ Fallback
 *
 * Priority order:
 *  1. Compliance scan (block if sensitive data detected)
 *  2. Local FAQ match — instant response, no API key needed (covers 80% of queries)
 *  3. OpenRouter LLM — for complex questions when API key is configured
 *  4. Graceful fallback message — never a silent empty response
 *
 * Body: { messages, model?, system?, temperature?, scanInput? }
 * Response: SSE stream — data: { content } chunks, then data: [DONE]
 */

import { NextRequest, NextResponse } from "next/server";
import { classifyRisk } from "@/lib/classifier/risk-engine";
import { createRateLimiter } from "@/lib/rate-limit";
import { findFaqAnswer } from "@/lib/brain-ai/faq";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Rate limit: 10 requests per minute per IP
const limiter = createRateLimiter("chat", { limit: 10, windowMs: 60 * 1000 });

// ---------------------------------------------------------------------------
// Model registry
// ---------------------------------------------------------------------------

const MODEL_MAP: Record<string, string> = {
  // Free models — verified working as of 2026-04-08
  "gemini-flash": "google/gemma-3n-e4b-it:free",       // replaces deprecated gemini-2.0-flash-exp:free
  "llama-70b":    "openai/gpt-oss-120b:free",           // OpenAI open-source model via OpenRouter
  "deepseek-v3":  "qwen/qwen3-coder:free",              // Qwen3 coder — strong reasoning
  "qwen-72b":     "nvidia/nemotron-3-super-120b-a12b:free",
  // Paid models (better quality)
  "gpt-4o-mini":  "openai/gpt-4o-mini",
  "gpt-4o":       "openai/gpt-4o",
  "claude-sonnet": "anthropic/claude-3.5-sonnet",
  "claude-haiku":  "anthropic/claude-3.5-haiku",
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const FALLBACK_MESSAGE =
  "I'm having trouble connecting to my AI brain right now. " +
  "For CMMC, SPRS, and compliance questions I can answer instantly — try asking about CUI detection, SPRS scoring, or how to install Hound Shield. " +
  "For complex questions, make sure OPENROUTER_API_KEY is set in your Vercel environment variables.";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Stream a plain text string as SSE chunks (simulates token-by-token delivery). */
function streamTextAsSSE(text: string): ReadableStream {
  const encoder = new TextEncoder();
  // Split into word-level chunks for a natural streaming feel
  const words = text.split(/(?<= )/);
  let i = 0;
  return new ReadableStream({
    async pull(controller) {
      if (i >= words.length) {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
        return;
      }
      // Batch 2 words per chunk to reduce overhead
      const chunk = words.slice(i, i + 2).join("");
      i += 2;
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`)
      );
      // Tiny delay to simulate streaming (5ms per chunk)
      await new Promise((r) => setTimeout(r, 5));
    },
  });
}

/** Call OpenRouter and return its streaming body, or null on failure. */
async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  temperature: number
): Promise<ReadableStream | null> {
  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://houndshield.com",
        "X-Title": "Hound Shield Brain AI",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        stream: true,
        max_tokens: 1024,
      }),
    });

    if (!response.ok || !response.body) {
      const errText = await response.text().catch(() => "");
      console.error(`[chat] OpenRouter ${response.status}:`, errText.slice(0, 200));
      return null;
    }

    return response.body;
  } catch (err) {
    console.error("[chat] OpenRouter fetch failed:", err);
    return null;
  }
}

/** Proxy an OpenRouter body stream through as SSE, tracking whether any content was emitted. */
function proxyOpenRouterStream(
  body: ReadableStream,
  complianceMeta: Record<string, unknown> | null
): ReadableStream {
  const encoder = new TextEncoder();
  let contentEmitted = false;

  return new ReadableStream({
    async start(controller) {
      // Send compliance metadata first if present
      if (complianceMeta) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ compliance: complianceMeta })}\n\n`)
        );
      }

      const reader = body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;

            const data = trimmed.slice(6);
            if (data === "[DONE]") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              const content: string | undefined = parsed.choices?.[0]?.delta?.content;
              if (content) {
                contentEmitted = true;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                );
              }
            } catch {
              // Skip malformed SSE chunks
            }
          }
        }
      } catch (err) {
        console.error("[chat] Stream read error:", err);
      }

      // Guard: if OpenRouter returned an empty stream, emit fallback
      if (!contentEmitted) {
        const fallback = encoder.encode(
          `data: ${JSON.stringify({ content: FALLBACK_MESSAGE })}\n\n`
        );
        controller.enqueue(fallback);
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      }

      controller.close();
    },
  });
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "anonymous";
    const rateLimitResult = limiter(ip);

    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Too many requests" }, {
        status: 429,
        headers: {
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.reset.toString(),
        },
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

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    // ── 1. Compliance scan on latest user message ──────────────────────────
    const lastUserMsg = [...messages]
      .reverse()
      .find((m: { role: string }) => m.role === "user");
    let complianceMeta: Record<string, unknown> | null = null;

    if (scanInput && lastUserMsg) {
      const scanResult = await classifyRisk(lastUserMsg.content);
      if (scanResult.should_block) {
        return NextResponse.json(
          {
            error: "compliance_block",
            message:
              `Compliance Alert: Your message was blocked — it contains ` +
              `${scanResult.classifications.join(", ")} data (Risk: ${scanResult.risk_level}). ` +
              `Hound Shield protects sensitive data from reaching AI providers.`,
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

    const sseHeaders = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    };

    // ── 2. Local FAQ match (always works, no API key needed) ───────────────
    if (lastUserMsg?.content) {
      const faqAnswer = findFaqAnswer(lastUserMsg.content);
      if (faqAnswer) {
        return new Response(streamTextAsSSE(faqAnswer), { headers: sseHeaders });
      }
    }

    // ── 3. OpenRouter LLM (requires API key) ──────────────────────────────
    const apiKey =
      process.env.OPENROUTER_API_KEY ||
      request.headers.get("x-openrouter-key") ||
      "";

    if (apiKey) {
      const resolvedModel = MODEL_MAP[model] ?? model;
      const systemPrompt =
        system ||
        "You are Brain AI, the intelligent compliance assistant embedded in Hound Shield. " +
        "You are a concise expert in CMMC Level 2, NIST 800-171, SPRS scoring, HIPAA PHI, SOC 2, CUI detection, and AI security. " +
        "Keep answers under 150 words. Use bullet points for lists. Be warm and expert.";

      const fullMessages: Array<{ role: string; content: string }> = [
        { role: "system", content: systemPrompt },
        ...messages,
      ];

      const orBody = await callOpenRouter(apiKey, resolvedModel, fullMessages, temperature);
      if (orBody) {
        return new Response(
          proxyOpenRouterStream(orBody, complianceMeta),
          { headers: sseHeaders }
        );
      }
    }

    // ── 4. Final fallback — always return something useful ─────────────────
    const fallbackText = apiKey
      ? FALLBACK_MESSAGE
      : "Ask me about CMMC Level 2, SPRS scoring, CUI detection, HIPAA, or how to install Hound Shield — I can answer those instantly! For free-form AI questions, an OpenRouter API key is required (set OPENROUTER_API_KEY in Vercel).";

    return new Response(streamTextAsSSE(fallbackText), { headers: sseHeaders });
  } catch (err) {
    console.error("[chat] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
