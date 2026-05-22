/**
 * Brain AI — Session Routes
 *
 * GET  /api/brain-ai/session?id=<sessionId>  — retrieve session
 * POST /api/brain-ai/session                 — create new session
 * DELETE /api/brain-ai/session?id=<sessionId> — delete session
 */

import { NextRequest } from "next/server";
import {
  loadSession,
  saveSession,
  deleteSession,
  createSession,
  listSessionIds,
} from "@/lib/brain-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("id");

  if (!sessionId) {
    // List all session IDs
    const ids = await listSessionIds();
    return Response.json({ sessionIds: ids, count: ids.length });
  }

  const session = await loadSession(sessionId);
  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }
  return Response.json(session);
}

export async function POST(req: NextRequest) {
  let body: { sessionId?: string; systemPrompt?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const sessionId =
    body.sessionId ?? `brain-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const session = createSession(sessionId, body.systemPrompt);
  await saveSession(session);
  return Response.json({ session, created: true });
}

export async function DELETE(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("id");
  if (!sessionId) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }
  await deleteSession(sessionId);
  return Response.json({ deleted: true, sessionId });
}
