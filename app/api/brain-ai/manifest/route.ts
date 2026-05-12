/**
 * Brain AI — Manifest Endpoint
 *
 * GET /api/brain-ai/manifest
 * Returns the Hound Shield codebase structure manifest.
 * Query param: ?format=markdown to get markdown output.
 */

import { NextRequest } from "next/server";
import { buildPortManifest, manifestToMarkdown } from "@/lib/brain-ai";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get("format");
  const manifest = buildPortManifest();

  if (format === "markdown") {
    return new Response(manifestToMarkdown(manifest), {
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  }

  return Response.json(manifest);
}
