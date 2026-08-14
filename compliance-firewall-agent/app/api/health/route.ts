import { NextResponse } from "next/server";
import { cached } from "@/lib/cache/swr-cache";
import { buildHealthReport, type HealthReport } from "@/lib/health/service-status";

/**
 * GET /api/health
 *
 * Health check endpoint for monitoring, load balancers, and uptime services.
 * Returns system status without exposing sensitive details.
 *
 * `status` is DERIVED, not declared. It used to be the literal string
 * "healthy", which meant the endpoint reported success while three security
 * controls were failing open behind it (audit #20c) — the reason
 * `app/command-center/(tools)/_shell/Topbar.tsx` deleted its status pill rather
 * than wire it here. It now reads "degraded" whenever any control is not doing
 * its job, and `degraded` names which. See lib/health/service-status.ts.
 *
 * Status pages and uptime monitors poll this constantly, and a million clients
 * hitting it at once is the textbook stampede — so the report (which now makes
 * two database round trips) is computed at most once every few seconds via the
 * single-flight cache. The timestamp/uptime stay fresh so the response never
 * looks frozen.
 */
export async function GET() {
  // Collapse poll storms: the report is recomputed at most once per 5s window,
  // shared across all concurrent callers.
  const report = await cached<HealthReport>("health:report", buildHealthReport, {
    ttlMs: 5_000,
    staleMs: 30_000,
  });

  const status = {
    status: report.degraded.length === 0 ? "healthy" : "degraded",
    version: "1.0.0",
    product: "HoundShield AI Compliance Firewall",
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.round(process.uptime()),
    services: report.services,
    // Names the service keys whose control is not currently doing its job, so a
    // reader is told rather than re-deriving "operational" from status strings.
    degraded: report.degraded,
    environment: process.env.NODE_ENV ?? "development",
  };

  return NextResponse.json(status, {
    headers: { "Cache-Control": "no-cache, no-store" },
  });
}
