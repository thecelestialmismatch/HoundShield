/**
 * Brain AI — Execute Endpoint
 *
 * POST /api/brain-ai/execute
 * Streams a Brain AI conversation turn via Server-Sent Events.
 *
 * Body: { sessionId: string, message: string, model?: string }
 * Returns: SSE stream of QueryEngineEvent objects
 *
 * WHAT THIS REPLACES. The route had no authentication and no rate limiter of
 * any kind, and every call runs an LLM turn that bills OpenRouter. Worse, the
 * caller chose the model — so the cheapest attack was not a flood but a single
 * loop pinned to the most expensive model on the platform. The correct pattern
 * already existed two files away (`app/api/brain/v3/route.ts:55-58`); this
 * route simply never adopted it.
 *
 * Three bounds now apply:
 *   • identity   — `guardBrainAi` → `requireUser()`, fails closed.
 *   • rate       — the `authenticated` LLM bucket, keyed on user id.
 *   • model      — a server-side allow-list. `model` is a request field, and a
 *                  request field must never select what we are billed for.
 * Plus a length cap on `message`, which was unbounded.
 */

import { NextRequest } from 'next/server';
import { getRuntime } from '@/lib/brain-ai';
import { guardBrainAi, scopedSessionId } from '@/lib/brain-ai/route-guard';
import { resolveBrainAiModel } from '@/lib/brain-ai/allowed-models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Generous for a person, bounded for a loop. */
const MAX_MESSAGE_CHARS = 32_000;

export async function POST(req: NextRequest) {
  const { blocked, user } = await guardBrainAi(req, 'llm');
  if (blocked) return blocked;

  let body: { sessionId?: string; message?: string; model?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { sessionId, message, model } = body;

  if (!sessionId || typeof sessionId !== 'string') {
    return Response.json({ error: 'sessionId is required' }, { status: 400 });
  }

  if (!message || typeof message !== 'string') {
    return Response.json({ error: 'message is required' }, { status: 400 });
  }

  if (message.length > MAX_MESSAGE_CHARS) {
    return Response.json(
      { error: `message exceeds ${MAX_MESSAGE_CHARS} characters` },
      { status: 413 },
    );
  }

  // Unknown or absent → the configured default. Never the caller's string.
  const resolvedModel = resolveBrainAiModel(model);

  // Scoped, so a caller can only ever drive their own session — the same
  // tenancy rule enforced in ../session/route.ts.
  const scoped = scopedSessionId(user!.id, sessionId);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const brainAiRuntime = getRuntime();
        if (resolvedModel) {
          brainAiRuntime.getQueryEngine().updateConfig({ model: resolvedModel });
        }

        for await (const event of brainAiRuntime.runTurnLoop(scoped, message)) {
          send(event);
          if (event.type === 'done' || event.type === 'error') break;
        }
      } catch (err) {
        // Server-side detail stays server-side; the stream gets a fixed string.
        console.error(
          '[brain-ai/execute] turn failed:',
          err instanceof Error ? err.message : String(err),
        );
        send({ type: 'error', message: 'Brain AI execution failed' });
      } finally {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Brain-AI': 'houndshield/2.0.0',
    },
  });
}
