/**
 * Brain AI — Manifest Endpoint
 *
 * GET /api/brain-ai/manifest
 * Returns the HoundShield codebase structure manifest.
 * Query param: ?format=markdown to get markdown output.
 *
 * Gated because the manifest is a directory listing of the product's own
 * source — subsystem names, paths and file counts. Handing that to an
 * anonymous caller is free reconnaissance for anyone probing the app.
 */

import { NextRequest } from "next/server";
import { buildPortManifest, manifestToMarkdown } from "@/lib/brain-ai";
import { guardBrainAi } from "@/lib/brain-ai/route-guard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { blocked } = await guardBrainAi(req, "read");
  if (blocked) return blocked;

  const format = req.nextUrl.searchParams.get("format");
  const manifest = buildPortManifest();

  if (format === "markdown") {
    return new Response(manifestToMarkdown(manifest), {
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  }

  return Response.json(manifest);
}
