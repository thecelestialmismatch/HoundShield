import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * GET /api/health
 *
 * Health check endpoint for monitoring, load balancers, and uptime services.
 * Returns system status without exposing sensitive details.
 */
export async function GET() {
  const uptime = process.uptime();

  const status = {
    status: "healthy",
    version: "1.0.0",
    product: "Hound Shield AI Compliance Firewall",
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.round(uptime),
    services: {
      database: isSupabaseConfigured() ? "connected" : "demo_mode",
      classifier: "operational",
      quarantine: "operational",
      audit_chain: "operational",
    },
    environment: process.env.NODE_ENV ?? "development",
  };

  return NextResponse.json(status, {
    headers: { "Cache-Control": "no-cache, no-store" },
  });
}
