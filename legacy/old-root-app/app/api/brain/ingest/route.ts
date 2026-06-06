/**
 * POST /api/brain/ingest
 *
 * Adds a knowledge node to the BM25 graph.
 * Auth: session token (production) or x-ingest-key header (local/demo).
 */

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";
import { addKnowledge } from "@/lib/brain-ai/brain-query";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  domain: z.enum(["cmmc", "hipaa", "soc2", "nist", "competitor", "market", "architecture", "pricing", "customer"]),
  title: z.string().min(3).max(200),
  content: z.string().min(10).max(5000),
  keywords: z.array(z.string()).min(1).max(20),
  source: z.string().url().optional(),
  ttlDays: z.number().int().min(0).max(365).optional(),
});

export async function POST(req: NextRequest) {
  if (isSupabaseConfigured()) {
    // Production: require user session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  } else {
    // Demo/local: require INGEST_API_KEY header to prevent unauthenticated graph poisoning
    const apiKey = req.headers.get("x-ingest-key");
    const expected = process.env.INGEST_API_KEY;
    if (!expected || apiKey !== expected) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const { domain, title, content, keywords, source, ttlDays } = parsed.data;

  const node = addKnowledge({
    domain,
    title,
    content,
    keywords,
    source: source ?? "manual",
    ttlDays: ttlDays ?? 0,
  });

  return NextResponse.json({
    success: true,
    data: {
      id: node,
      domain,
      title,
      keywords,
      ttlDays: ttlDays ?? 0,
      message: "Node added to BM25 knowledge graph. Queryable immediately via GET /api/brain/query",
    },
  });
}

/** GET — usage hint (no schema enumeration) */
export async function GET() {
  return NextResponse.json({
    success: true,
    endpoint: "POST /api/brain/ingest",
    description: "Add a knowledge node to the BM25 graph. Requires x-ingest-key header or user session.",
  });
}
