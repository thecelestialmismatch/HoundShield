/**
 * PATCH/DELETE /api/v1/patterns/:id — Update or delete a custom pattern
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { invalidateOrgPatternCache } from "@/lib/classifier/custom-patterns";

const UpdatePatternSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  pattern: z.string().min(1).max(1000).optional(),
  risk_level: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  description: z.string().max(500).optional(),
  enabled: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = UpdatePatternSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { data: null, error: "Validation failed", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    if (parseResult.data.pattern) {
      try {
        new RegExp(parseResult.data.pattern);
      } catch {
        return NextResponse.json({ data: null, error: "Invalid regex pattern" }, { status: 400 });
      }
    }

    const orgId = user.user_metadata?.org_id ?? user.id;

    const { data, error } = await supabase
      .from("org_patterns")
      .update({ ...parseResult.data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("org_id", orgId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ data: null, error: "Failed to update pattern" }, { status: 500 });
    }

    invalidateOrgPatternCache(orgId);
    return NextResponse.json({ data, error: null });
  } catch (err) {
    console.error("[patterns/:id/PATCH] unhandled:", err);
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const orgId = user.user_metadata?.org_id ?? user.id;

    const { error } = await supabase
      .from("org_patterns")
      .delete()
      .eq("id", id)
      .eq("org_id", orgId);

    if (error) {
      return NextResponse.json({ data: null, error: "Failed to delete pattern" }, { status: 500 });
    }

    invalidateOrgPatternCache(orgId);
    return NextResponse.json({ data: { deleted: id }, error: null });
  } catch (err) {
    console.error("[patterns/:id/DELETE] unhandled:", err);
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}
