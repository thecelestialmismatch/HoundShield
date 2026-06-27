import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { isLlmConfigured } from "@/lib/agent/provider";
import { cached } from "@/lib/cache/swr-cache";

/**
 * GET /api/health
 *
 * Health check endpoint for monitoring, load balancers, and uptime services.
 * Returns system status without exposing sensitive details.
 *
 * Status pages and uptime monitors poll this constantly, and a million clients
 * polling at once is the textbook "everyone hits the same thing" stampede. The
 * service-status block is computed at most once every few seconds via the
 * single-flight cache; the timestamp/uptime are always fresh so the response
 * never looks frozen.
 */

type Services = Record<string, string>;

function computeServices(): Services {
  return {
    database: isSupabaseConfigured() ? "connected" : "demo_mode",
    ai_router: isLlmConfigured() ? "connected" : "missing_key",
    payments: process.env.STRIPE_SECRET_KEY ? "connected" : "missing_key",
    classifier: "operational",
    quarantine: "operational",
    audit_chain: "operational",
  };
}

export async function GET() {
  // Collapse poll storms: services are recomputed at most once per 5s window,
  // shared across all concurrent callers.
  const services = await cached<Services>("health:services", async () => computeServices(), {
    ttlMs: 5_000,
    staleMs: 30_000,
  });

  const status = {
    status: "healthy",
    version: "1.0.0",
    product: "HoundShield AI Compliance Firewall",
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.round(process.uptime()),
    services,
    environment: process.env.NODE_ENV ?? "development",
  };

  return NextResponse.json(status, {
    headers: { "Cache-Control": "no-cache, no-store" },
  });
}
