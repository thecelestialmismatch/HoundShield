/**
 * Firewall Rule by ID
 *
 * PUT    /api/rules/[id] - update a rule (full or partial)
 * DELETE /api/rules/[id] - delete a rule
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const UpdateSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(2000).optional().nullable(),
    category: z.enum(["PII", "FINANCIAL", "STRATEGIC", "IP", "HIPAA_PHI"]).optional(),
    pattern: z.string().min(1).optional(),
    pattern_type: z.enum(["REGEX", "KEYWORD", "SEMANTIC"]).optional(),
    risk_level: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
    threshold: z.number().min(0).max(1).optional(),
    action: z.enum(["ALLOW", "WARN", "BLOCK", "QUARANTINE"]).optional(),
    is_active: z.boolean().optional(),
  })
  .strict();

// ---------------------------------------------------------------------------
// PUT /api/rules/[id]
// ---------------------------------------------------------------------------

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: "Missing rule id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parse = UpdateSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parse.error.issues },
      { status: 400 }
    );
  }

  const updates = parse.data;

  // Validate regex if pattern is being updated
  if (updates.pattern && (updates.pattern_type === "REGEX" || !updates.pattern_type)) {
    try {
      new RegExp(updates.pattern);
    } catch {
      return NextResponse.json(
        { error: "Invalid regex pattern", field: "pattern" },
        { status: 400 }
      );
    }
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("policy_rules")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Rule not found" }, { status: 404 });
      }
      console.error("Rule update error:", error);
      return NextResponse.json(
        { error: "Failed to update rule", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ rule: data });
  } catch (err) {
    console.error("Rules PUT error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/rules/[id]
// ---------------------------------------------------------------------------

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: "Missing rule id" }, { status: 400 });
  }

  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from("policy_rules")
      .delete()
      .eq("id", id);

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Rule not found" }, { status: 404 });
      }
      console.error("Rule delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete rule", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Rules DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
