/**
 * Firewall Rules API
 *
 * GET  /api/rules        - list all policy rules
 * POST /api/rules        - create a new policy rule
 *
 * The policy_rules table is seeded by the initial Supabase migration.
 * Row Level Security on this table requires service-role access.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const RuleSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  category: z.enum(["PII", "FINANCIAL", "STRATEGIC", "IP", "HIPAA_PHI"]),
  pattern: z.string().min(1),
  pattern_type: z.enum(["REGEX", "KEYWORD", "SEMANTIC"]).default("REGEX"),
  risk_level: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  threshold: z.number().min(0).max(1).default(0.8),
  action: z.enum(["ALLOW", "WARN", "BLOCK", "QUARANTINE"]).default("BLOCK"),
  is_active: z.boolean().default(true),
});

// ---------------------------------------------------------------------------
// GET /api/rules
// ---------------------------------------------------------------------------

export async function GET() {
  if (!isSupabaseConfigured()) {
    // Return empty list in demo mode so the UI renders without error.
    return NextResponse.json({ rules: [], total: 0, demo_mode: true });
  }

  try {
    const supabase = createServiceClient();
    const { data, error, count } = await supabase
      .from("policy_rules")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Rules fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch rules", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ rules: data ?? [], total: count ?? 0 });
  } catch (err) {
    console.error("Rules GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/rules
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Database not configured. Rules require Supabase." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parse = RuleSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parse.error.issues },
      { status: 400 }
    );
  }

  // Validate regex pattern if type is REGEX
  const { pattern, pattern_type } = parse.data;
  if (pattern_type === "REGEX") {
    try {
      new RegExp(pattern);
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
      .insert(parse.data)
      .select()
      .single();

    if (error) {
      console.error("Rule create error:", error);
      return NextResponse.json(
        { error: "Failed to create rule", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ rule: data }, { status: 201 });
  } catch (err) {
    console.error("Rules POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
