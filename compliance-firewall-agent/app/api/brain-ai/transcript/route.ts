/**
 * Brain AI — Transcript Endpoint
 *
 * GET /api/brain-ai/transcript?sessionId=<id>&format=<markdown|text|json|html>
 * Returns the conversation transcript for YOUR Brain AI session.
 *
 * WHAT THIS REPLACES. The route was unauthenticated and took a raw `sessionId`
 * straight from the query string, so any caller who learned or guessed an id
 * got the entire conversation — every prompt and every answer — rendered as
 * markdown or HTML. That is the same IDOR closed in ../session/route.ts, but
 * with a worse payload: the session route leaked the stored object, this one
 * leaks it pre-formatted for reading. The sibling route also handed out the id
 * list, so the two together were a complete cross-tenant transcript reader.
 *
 * The id is now namespaced to the authenticated caller before it reaches the
 * store, so `?sessionId=` can only ever address something they own.
 */

import { NextRequest } from "next/server";
import { generateTranscript } from "@/lib/brain-ai/transcript";
import { guardBrainAi, scopedSessionId } from "@/lib/brain-ai/route-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { blocked, user } = await guardBrainAi(req, "read");
  if (blocked) return blocked;

  const sessionId = req.nextUrl.searchParams.get("sessionId");
  const format = (req.nextUrl.searchParams.get("format") ?? "markdown") as
    | "markdown"
    | "text"
    | "json"
    | "html";
  const title = req.nextUrl.searchParams.get("title") ?? undefined;

  if (!sessionId) {
    return Response.json({ error: "sessionId is required" }, { status: 400 });
  }

  // Scoped before it reaches the store: the caller names their own session or
  // nothing. A miss and a not-yours are the same 404 below, by design.
  const transcript = await generateTranscript(scopedSessionId(user!.id, sessionId), {
    format,
    includeTimestamps: true,
    includeTokenUsage: true,
    title,
  });

  if (!transcript) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  const contentTypes: Record<string, string> = {
    markdown: "text/markdown; charset=utf-8",
    text: "text/plain; charset=utf-8",
    json: "application/json",
    html: "text/html; charset=utf-8",
  };

  return new Response(transcript, {
    headers: { "Content-Type": contentTypes[format] ?? "text/plain" },
  });
}
