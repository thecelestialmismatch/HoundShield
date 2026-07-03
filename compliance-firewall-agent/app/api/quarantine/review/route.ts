import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { requireRole } from "@/lib/auth/api-guard";
import {
  reviewQuarantineItem,
  getPendingQuarantineItems,
} from "@/lib/quarantine/handler";
import { DEMO_QUARANTINE_ITEMS } from "@/lib/demo-data";
import { z } from "zod";

// Reviewer identity is taken from the session, NOT the request body (audit C4).
const ReviewSchema = z.object({
  quarantine_id: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().optional(),
});

// Only these roles may release/reject quarantined CUI/PHI.
const REVIEW_ROLES = ["admin", "consultant"];

/**
 * POST /api/quarantine/review
 *
 * Submits a quarantine review decision.
 */
export async function POST(req: NextRequest) {
  try {
    // Only authenticated reviewers may act; identity comes from the session.
    const auth = await requireRole(REVIEW_ROLES);
    if (!auth.user) return auth.response;

    const body = await req.json();
    const parseResult = ReviewSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { quarantine_id, decision, notes } = parseResult.data;
    const reviewer_id = auth.user.id;

    // Demo mode is unreachable here (requireRole fails closed when Supabase is
    // not configured), but keep the shape consistent.
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
    // Demo mode — return mock quarantine items (no real data exists).
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        items: DEMO_QUARANTINE_ITEMS,
        count: DEMO_QUARANTINE_ITEMS.length,
        demo: true,
      });
    }

    // The pending queue contains regulated data — require a reviewer session.
    const auth = await requireRole(REVIEW_ROLES);
    if (!auth.user) return auth.response;

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
