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
import { cleanAnswer } from "@/lib/brain-ai/format-answer";
import { sanitizeChatInput } from "@/lib/brain-ai/sanitize-input";
import { resolveLlmProvider, type LlmProvider } from "@/lib/agent/provider";
import {
  captureRequest,
  openSpan,
  closeSpan,
  finalizeTrace,
  type Trace,
} from "@/lib/observability";

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

const FALLBACK_MESSAGE =
  "Ask me about CMMC Level 2, SPRS scoring, CUI detection, HIPAA PHI, SOC 2, or how to install HoundShield — " +
  "I can answer those instantly. For open-ended AI questions, set OPENROUTER_API_KEY in your Vercel environment variables to enable full LLM responses.";

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

/** Call the resolved LLM provider (OpenRouter → NVIDIA) and return its streaming body, or null. */
async function callProvider(
  provider: LlmProvider,
  model: string,
  messages: Array<{ role: string; content: string }>,
  temperature: number
): Promise<ReadableStream | null> {
  try {
    const response = await fetch(provider.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
        ...(provider.headers ?? {}),
      },
      body: JSON.stringify({
        model: provider.modelOverride ?? model,
        messages,
        temperature,
        stream: true,
        max_tokens: 1024,
      }),
    });

    if (!response.ok || !response.body) {
      const errText = await response.text().catch(() => "");
      console.error(`[chat] ${provider.name} ${response.status}:`, errText.slice(0, 200));
      return null;
    }

    return response.body;
  } catch (err) {
    console.error(`[chat] ${provider.name} fetch failed:`, err);
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
  // Observability: every request gets a trace regardless of outcome
  let trace: Trace | null = null;
  let userQuestion = "";

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
      sessionId,
      userId,
      promptVersion = "v1.0",
    } = body;

    // ── STEP 1: Capture request, open trace ───────────────────────────────
    const lastUserMsg = [...(messages as Array<{ role: string; content: string }>)]
      .reverse()
      .find((m) => m.role === "user");
    userQuestion = lastUserMsg?.content ?? "";

    if (userId) {
      trace = captureRequest({
        sessionId:     sessionId ?? ip,
        userId:        userId as string,
        userQuestion,
        modelName:     MODEL_MAP[model as string] ?? (model as string),
        promptVersion: promptVersion as string,
        temperature:   temperature as number,
      });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    // ── 1. Compliance scan on latest user message ──────────────────────────
    let complianceMeta: Record<string, unknown> | null = null;

    if (scanInput && lastUserMsg) {
      const scanSpan = trace ? openSpan(trace, "intent_router", "compliance_scan") : null;
      const scanResult = await classifyRisk(lastUserMsg.content);
      if (scanSpan) closeSpan(scanSpan, { risk_level: scanResult.risk_level, blocked: scanResult.should_block });
      if (scanResult.should_block) {
        return NextResponse.json(
          {
            error: "compliance_block",
            message:
              `Compliance Alert: Your message was blocked — it contains ` +
              `${scanResult.classifications.join(", ")} data (Risk: ${scanResult.risk_level}). ` +
              `HoundShield protects sensitive data from reaching AI providers.`,
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
      const faqSpan = trace ? openSpan(trace, "retriever", "faq_lookup") : null;
      const faqAnswer = findFaqAnswer(sanitizeChatInput(lastUserMsg.content));
      if (faqSpan) closeSpan(faqSpan, { hit: !!faqAnswer });
      if (faqAnswer) {
        // Fire-and-forget trace finalization (FAQ path — no LLM involved)
        if (trace) {
          const responseSpan = openSpan(trace, "final_response", "faq_response");
          closeSpan(responseSpan, faqAnswer);
          finalizeTrace(trace, { userQuestion, finalAnswer: faqAnswer, ragContext: null }).catch(() => undefined);
        }
        return new Response(streamTextAsSSE(cleanAnswer(faqAnswer)), { headers: sseHeaders });
      }
    }

    // ── 3. LLM (OpenRouter → NVIDIA fallback; requires a key) ──────────────
    const provider = resolveLlmProvider(request.headers.get("x-openrouter-key") || undefined);

    if (provider.apiKey) {
      const resolvedModel = MODEL_MAP[model as string] ?? (model as string);
      const systemPrompt =
        system ||
        "You are Brain AI, the compliance assistant embedded in HoundShield, and a senior expert in CMMC Level 2, " +
        "NIST 800-171 Rev 2, SPRS scoring, HIPAA PHI, SOC 2, CUI detection, and AI security. " +
        "Answer like a thoughtful human expert: warm, direct, precise. Never open with 'Certainly!', 'Of course!', or " +
        "'Great question!' — just answer. Write flowing, complete sentences; when listing, say it in prose ('First… " +
        "Second… And third…'), never a dash, star, or bullet. Use no markdown of any kind. Adapt to the asker's vertical " +
        "(healthcare/PHI, defense/CUI/CMMC, or legal/privilege). Keep answers under 150 words, lead with the answer, and " +
        "never refuse something you can actually help with.";

      const fullMessages: Array<{ role: string; content: string }> = [
        { role: "system", content: systemPrompt },
        ...(messages as Array<{ role: string; content: string }>).map((m) =>
          m.role === "user" ? { ...m, content: sanitizeChatInput(m.content) } : m,
        ),
      ];

      const llmSpan = trace ? openSpan(trace, "llm_call", `${provider.name}_call`, { model: resolvedModel }) : null;
      const orBody = await callProvider(provider, resolvedModel, fullMessages, temperature as number);
      if (llmSpan) closeSpan(llmSpan, { success: !!orBody });

      if (orBody) {
        // Fire-and-forget: finalize trace after streaming begins
        // We can't hook into stream completion in Next.js streaming routes,
        // so we record the LLM path synchronously and skip answer scoring here.
        // Answer scoring happens via the /api/observability/feedback endpoint.
        if (trace) {
          const respSpan = openSpan(trace, "final_response", "llm_stream");
          closeSpan(respSpan, { streamed: true });
          finalizeTrace(trace, { userQuestion, finalAnswer: "[streamed]", ragContext: null }).catch(() => undefined);
        }
        return new Response(
          proxyOpenRouterStream(orBody, complianceMeta),
          { headers: sseHeaders }
        );
      }
    }

    // ── 4. Final fallback — always return something useful ─────────────────
    const fallbackText = provider.apiKey
      ? FALLBACK_MESSAGE
      : "Ask me about CMMC Level 2, SPRS scoring, CUI detection, HIPAA, or how to install HoundShield — I can answer those instantly! For free-form AI questions, set an OPENROUTER_API_KEY (or NVIDIA_API_KEY) in Vercel.";

    if (trace) {
      const fbSpan = openSpan(trace, "final_response", "fallback");
      closeSpan(fbSpan, fallbackText);
      finalizeTrace(trace, { userQuestion, finalAnswer: fallbackText, ragContext: null }).catch(() => undefined);
    }

    return new Response(streamTextAsSSE(fallbackText), { headers: sseHeaders });
  } catch (err) {
    // Log error span if trace is open
    if (trace) {
      finalizeTrace(trace, { userQuestion, finalAnswer: "[error]", ragContext: null }).catch(() => undefined);
    }
    console.error("[chat] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
