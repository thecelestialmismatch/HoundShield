/**
 * POST /api/gateway/ollama — Compliance-gated Ollama (air-gap) proxy
 *
 * Drop-in replacement for Ollama's /api/chat endpoint.
 * Every request passes through Kaelus compliance scanning before
 * reaching the local Ollama instance.
 *
 * Body: Ollama /api/chat format (messages, model, stream, options)
 * Response: Kaelus SSE format (data: { content }..., data: [DONE])
 *
 * Usage — point your Ollama client at this endpoint:
 *   curl http://localhost:3000/api/gateway/ollama \
 *     -d '{"model":"llama3.2","messages":[{"role":"user","content":"..."}]}'
 */

import { NextRequest, NextResponse } from "next/server";
import { classifyRisk } from "@/lib/classifier/risk-engine";
import { createRateLimiter } from "@/lib/rate-limit";
import {
  streamOllamaChat,
  proxyOllamaStream,
  isOllamaAvailable,
} from "@/lib/gateway/providers/ollama";
import type { OllamaMessage } from "@/lib/gateway/providers/ollama";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const limiter = createRateLimiter("gateway-ollama", {
  limit: 120,
  windowMs: 60 * 1000,
});

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "anonymous";

    const rl = limiter(ip);
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, {
        status: 429,
        headers: {
          "X-RateLimit-Limit": rl.limit.toString(),
          "X-RateLimit-Remaining": rl.remaining.toString(),
        },
      });
    }

    const body = await request.json();
    const messages: OllamaMessage[] = body.messages ?? [];
    const model: string | undefined = body.model;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages array required" }, { status: 400 });
    }

    // ── Compliance scan on latest user message ─────────────────────────────
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) {
      const scan = await classifyRisk(lastUser.content);
      if (scan.should_block) {
        return NextResponse.json(
          {
            error: "compliance_block",
            message:
              `Kaelus blocked this prompt: contains ${scan.classifications.join(", ")} ` +
              `(Risk: ${scan.risk_level}). Air-gap mode still enforces compliance.`,
            scan: {
              risk_level: scan.risk_level,
              classifications: scan.classifications,
            },
          },
          {
            status: 451,
            headers: { "X-Kaelus-Action": "BLOCKED" },
          }
        );
      }
    }

    // ── Forward to Ollama ──────────────────────────────────────────────────
    const result = await streamOllamaChat({
      model,
      messages,
      temperature: body.options?.temperature ?? body.temperature,
      maxTokens: body.options?.num_predict ?? body.max_tokens,
      stream: true,
    });

    if (!result.body) {
      return NextResponse.json(
        {
          error: "ollama_unavailable",
          message:
            result.error ??
            "Ollama is not running. Start it with: ollama serve",
        },
        { status: 503, headers: { "X-Kaelus-Ollama": "offline" } }
      );
    }

    return new Response(proxyOllamaStream(result.body), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Kaelus-Action": "ALLOWED",
        "X-Kaelus-Mode": "air-gap",
      },
    });
  } catch (err) {
    console.error("[gateway/ollama] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** GET /api/gateway/ollama — Health check: is Ollama running? */
export async function GET() {
  const available = await isOllamaAvailable();
  return NextResponse.json({
    ollama: available ? "online" : "offline",
    mode: "air-gap",
    endpoint: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
  });
}
