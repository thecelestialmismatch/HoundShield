/**
 * Brain AI Query — /api/brain/query
 *
 * POST: Authenticated multi-turn query (user sessions, dashboard)
 * GET:  Unauthenticated read for agent use (Claude Code, internal tools)
 *       ?q=<question> — returns BrainResponse JSON
 *
 * Both endpoints merge results from:
 *   - lib/brain (structured fact store, high confidence)
 *   - lib/brain-ai/brain-query (BM25 knowledge graph, broad coverage)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { queryBrain, getBrainSummary } from "@/lib/brain";
import { ask as askGraph } from "@/lib/brain-ai/brain-query";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  question: z.string().min(3).max(500),
});

/** Merge fact-store result with BM25 graph result */
function mergedAnswer(question: string) {
  const factResult = queryBrain(question);
  const graphResult = askGraph(question);

  return {
    answer: factResult.facts.length > 0 ? factResult.answer : graphResult.answer,
    confidence: factResult.confidence,
    sources: factResult.sources,
    domain: factResult.domain,
    facts: factResult.facts,
    graph_answer: graphResult.answer !== factResult.answer ? graphResult.answer : undefined,
    graph_sources: graphResult.sources,
  };
}

/** GET /api/brain/query?q=<question> — open to agents, no auth */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.trim().length < 3) {
    return NextResponse.json(
      {
        success: false,
        error: "Provide ?q=<question> (min 3 chars)",
        available_domains: ["cmmc", "hipaa", "soc2", "competitors", "market"],
        example: "/api/brain/query?q=Why+is+HoundShield+CMMC+compliant",
      },
      { status: 400 }
    );
  }

  const result = mergedAnswer(q.trim());
  return NextResponse.json({ success: true, data: result });
}

/** POST /api/brain/query — authenticated for user dashboard */
export async function POST(req: NextRequest) {
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
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const result = mergedAnswer(parsed.data.question);
  return NextResponse.json({ success: true, data: result });
}
