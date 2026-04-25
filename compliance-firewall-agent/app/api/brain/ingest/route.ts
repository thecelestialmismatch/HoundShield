/**
 * POST /api/brain/ingest
 *
 * Adds a knowledge node to the BM25 graph.
 * Accepts either raw text content or a URL to scrape (via firecrawl).
 *
 * Auth: required in production, open in demo mode.
 * Rate: consumers should not call this more than 10x/min.
 */

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";
import { addKnowledge } from "@/lib/brain-ai/brain-query";
import type { KnowledgeDomain } from "@/lib/brain-ai/knowledge-graph";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_DOMAINS: KnowledgeDomain[] = [
  "cmmc", "hipaa", "soc2", "nist", "competitor", "market", "architecture", "pricing", "customer",
];

const bodySchema = z.object({
  domain: z.enum(["cmmc", "hipaa", "soc2", "nist", "competitor", "market", "architecture", "pricing", "customer"]),
  title: z.string().min(3).max(200),
  content: z.string().min(10).max(5000),
  keywords: z.array(z.string()).min(1).max(20),
  source: z.string().url().optional(),
  ttlDays: z.number().int().min(0).max(365).optional(),
});

export async function POST(req: NextRequest) {
  // Auth gate — only in production
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
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
      {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid request",
        schema: {
          domain: VALID_DOMAINS,
          title: "string (3-200 chars)",
          content: "string (10-5000 chars)",
          keywords: "string[] (1-20 items)",
          source: "url (optional)",
          ttlDays: "number 0-365 (optional, 0=permanent)",
          weight: "number 0.1-3 (optional, default 1.0)",
        },
      },
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

/** GET — schema + usage docs */
export async function GET() {
  return NextResponse.json({
    success: true,
    endpoint: "POST /api/brain/ingest",
    description: "Add a knowledge node to the BM25 graph. Queryable immediately.",
    schema: {
      domain: VALID_DOMAINS,
      title: "string (3-200 chars)",
      content: "string (10-5000 chars)",
      keywords: "string[] — used for BM25 boost",
      source: "url (optional) — attribution",
      ttlDays: "0=permanent, 7=week, 30=month",
    },
    example: {
      domain: "cmmc",
      title: "CMMC Level 2 requires 110 NIST 800-171 controls",
      content: "CMMC Level 2 assessment covers all 110 practices from NIST SP 800-171 Rev 2. Third-party C3PAO assessment required for prime contractors handling CUI.",
      keywords: ["cmmc", "level 2", "c3pao", "nist", "800-171", "cui"],
      ttlDays: 0,
    },
  });
}
