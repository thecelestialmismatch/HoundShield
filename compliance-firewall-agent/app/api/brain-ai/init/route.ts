/**
 * Brain AI — System Init Endpoint
 *
 * GET /api/brain-ai/init
 * Returns the Brain AI system initialization status and capabilities.
 *
 * Gated for the same reason as ../manifest and ../skills: the init message is
 * a capability and configuration dump, and it is the natural first request for
 * anyone mapping the surface.
 */

import { NextRequest } from "next/server";
import { buildSystemInitMessage } from "@/lib/brain-ai";
import { guardBrainAi } from "@/lib/brain-ai/route-guard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { blocked } = await guardBrainAi(req, "read");
  if (blocked) return blocked;

  const init = buildSystemInitMessage();
  return Response.json(init);
}
