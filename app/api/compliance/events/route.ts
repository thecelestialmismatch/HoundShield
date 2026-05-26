import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getComplianceEvents } from "@/lib/audit/logger";
import { DEMO_EVENTS } from "@/lib/demo-data";
import type { RiskLevel, ActionTaken } from "@/lib/supabase/types";

/**
 * GET /api/compliance/events
 *
 * Retrieves compliance event history with optional filters.
 * Returns demo data when Supabase is not configured.
 */
export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const limit = Math.min(parseInt(params.get("limit") ?? "50"), 200);
    const offset = parseInt(params.get("offset") ?? "0");
    const actionFilter = params.get("action") as ActionTaken | undefined;
    const riskFilter = params.get("risk_level") as RiskLevel | undefined;

    // Demo mode — return mock data
    if (!isSupabaseConfigured()) {
      let filtered = [...DEMO_EVENTS];

      if (actionFilter) {
        filtered = filtered.filter((e) => e.action_taken === actionFilter);
      }
      if (riskFilter) {
        filtered = filtered.filter((e) => e.risk_level === riskFilter);
      }

      const total = filtered.length;
      const events = filtered.slice(offset, offset + limit);

      return NextResponse.json({ events, total, limit, offset, demo: true });
    }

    // Production mode — query Supabase
    const filters = {
      risk_level: riskFilter,
      action_taken: actionFilter,
      user_id: params.get("user_id") ?? undefined,
      from_date: params.get("from") ?? undefined,
      to_date: params.get("to") ?? undefined,
      limit,
      offset,
    };

    const { events, total } = await getComplianceEvents(filters);

    return NextResponse.json({ events, total, limit, offset });
  } catch (err) {
    console.error("Events fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
