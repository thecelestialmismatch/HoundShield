/**
 * Brain AI — Execute Endpoint
 *
 * POST /api/brain-ai/execute
 * Streams a Brain AI conversation turn via Server-Sent Events.
 *
 * Body: { sessionId: string, message: string, model?: string }
 * Returns: SSE stream of QueryEngineEvent objects
 */

import { NextRequest } from "next/server";
import { getRuntime } from "@/lib/brain-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { sessionId?: string; message?: string; model?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { sessionId, message, model } = body;

  if (!sessionId || typeof sessionId !== "string") {
    return new Response(JSON.stringify({ error: "sessionId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!message || typeof message !== "string") {
    return new Response(JSON.stringify({ error: "message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.OPENROUTER_API_KEY ?? "";

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        const brainAiRuntime = getRuntime();
        if (model) {
          brainAiRuntime.getQueryEngine().updateConfig({ model });
        }

        for await (const event of brainAiRuntime.runTurnLoop(sessionId, message)) {
          send(event);
          if (event.type === "done" || event.type === "error") break;
        }
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "Brain AI execution failed",
        });
      } finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Brain-AI": "houndshield/2.0.0",
    },
  });
}
