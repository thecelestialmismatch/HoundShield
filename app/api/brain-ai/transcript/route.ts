/**
 * Brain AI — Transcript Endpoint
 *
 * GET /api/brain-ai/transcript?sessionId=<id>&format=<markdown|text|json|html>
 * Returns the conversation transcript for a Brain AI session.
 */

import { NextRequest } from "next/server";
import { generateTranscript } from "@/lib/brain-ai/transcript";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
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

  const transcript = await generateTranscript(sessionId, {
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
