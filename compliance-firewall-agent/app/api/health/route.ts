import { NextResponse } from "next/server";

/**
 * Public liveness probe.
 *
 * This endpoint is intentionally minimal: it proves that the application can
 * answer a request without disclosing deployment topology, service state,
 * environment, uptime, version information, or diagnostic configuration.
 * Operational diagnostics belong to the protected admin endpoint.
 */
export async function GET() {
  return NextResponse.json(
    { status: "ok" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
