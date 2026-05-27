import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  reviewQuarantineItem,
  getPendingQuarantineItems,
} from "@/lib/quarantine/handler";
import { DEMO_QUARANTINE_ITEMS } from "@/lib/demo-data";
import { z } from "zod";

const ReviewSchema = z.object({
  quarantine_id: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
  reviewer_id: z.string().min(1),
  notes: z.string().optional(),
});

/**
 * POST /api/quarantine/review
 *
 * Submits a quarantine review decision.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = ReviewSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { quarantine_id, decision, reviewer_id, notes } = parseResult.data;

    // Demo mode — simulate success
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        quarantine_id,
        decision,
        demo: true,
      });
    }

    await reviewQuarantineItem(quarantine_id, decision, reviewer_id, notes);

    return NextResponse.json({ success: true, quarantine_id, decision });
  } catch (err) {
    console.error("Quarantine review error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/quarantine/review
 *
 * Fetches pending quarantine items for the review dashboard.
 */
export async function GET(req: NextRequest) {
  try {
    // Demo mode — return mock quarantine items
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        items: DEMO_QUARANTINE_ITEMS,
        count: DEMO_QUARANTINE_ITEMS.length,
        demo: true,
      });
    }

    const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "50");
    const items = await getPendingQuarantineItems(limit);

    return NextResponse.json({ items, count: items.length });
  } catch (err) {
    console.error("Quarantine fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch quarantine items" },
      { status: 500 }
    );
  }
}
