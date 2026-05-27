/**
 * Brain AI — Parity Audit Endpoint
 *
 * GET /api/brain-ai/audit
 * Runs the Brain AI parity audit and returns coverage report.
 * Query param: ?format=markdown to get the full markdown report.
 */

import { NextRequest } from "next/server";
import { runParityAudit } from "@/lib/brain-ai/parity-audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get("format");
  const result = runParityAudit();

  if (format === "markdown") {
    return new Response(result.fullReport, {
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  }

  return Response.json({
    overallScore: result.overallScore,
    brainAiCoverage: result.brainAiCoverage.coverage,
    complianceCoverage: result.complianceCoverage.coverage,
    toolsCoverage: result.toolsCoverage.coverage,
    routesCoverage: result.routesCoverage.coverage,
    details: {
      brainAi: result.brainAiCoverage,
      compliance: result.complianceCoverage,
      tools: result.toolsCoverage,
      routes: result.routesCoverage,
    },
  });
}
