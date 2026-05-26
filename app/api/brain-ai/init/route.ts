/**
 * Brain AI — System Init Endpoint
 *
 * GET /api/brain-ai/init
 * Returns the Brain AI system initialization status and capabilities.
 */

import { buildSystemInitMessage } from "@/lib/brain-ai";

export const dynamic = "force-dynamic";

export async function GET() {
  const init = buildSystemInitMessage();
  return Response.json(init);
}
