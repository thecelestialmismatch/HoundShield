/**
 * GET/POST /api/v1/patterns — Manage org-specific detection patterns
 *
 * GET  — list all patterns for authenticated org
 * POST — create a new pattern
 *
 * Auth: requires valid Supabase session
 * Tier: Pro+ (pattern library is a paid feature)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { invalidateOrgPatternCache } from "@/lib/classifier/custom-patterns";

const CreatePatternSchema = z.object({
  name: z.string().min(1).max(100),
  pattern: z.string().min(1).max(1000),
  risk_level: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("HIGH"),
  description: z.string().max(500).optional(),
  enabled: z.boolean().default(true),
});

async function getAuthUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthUser(supabase);
    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const orgId = user.user_metadata?.org_id ?? user.id;

    const { data, error } = await supabase
      .from("org_patterns")
      .select("id, name, pattern, risk_level, description, enabled, created_at, updated_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[patterns/GET]", error.message);
      return NextResponse.json({ data: null, error: "Failed to load patterns" }, { status: 500 });
    }

    return NextResponse.json({ data, error: null });
  } catch (err) {
    console.error("[patterns/GET] unhandled:", err);
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthUser(supabase);
    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = CreatePatternSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { data: null, error: "Validation failed", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    // Validate regex before saving
    try {
      new RegExp(parseResult.data.pattern);
    } catch {
      return NextResponse.json(
        { data: null, error: "Invalid regex pattern" },
        { status: 400 }
      );
    }

    const orgId = user.user_metadata?.org_id ?? user.id;

    const { data, error } = await supabase
      .from("org_patterns")
      .insert({
        org_id: orgId,
        ...parseResult.data,
      })
      .select()
      .single();

    if (error) {
      console.error("[patterns/POST]", error.message);
      return NextResponse.json({ data: null, error: "Failed to create pattern" }, { status: 500 });
    }

    // Bust cache so next scan picks up the new pattern immediately
    invalidateOrgPatternCache(orgId);

    return NextResponse.json({ data, error: null }, { status: 201 });
  } catch (err) {
    console.error("[patterns/POST] unhandled:", err);
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}
