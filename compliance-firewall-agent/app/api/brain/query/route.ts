/**
 * Brain AI Query — /api/brain/query
 *
 * POST: Authenticated multi-turn query (user sessions, dashboard)
 *       x-brain-version: v3 → routes to Brain AI v3 multi-agent stack
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
import { MultiAgentOrchestrator } from "@/lib/brain-ai/multi-agent-orchestrator";
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
        available_domains: ["cmmc-l2", "hipaa", "soc2", "competitors", "market", "product-roadmap", "architecture", "nist", "customer", "pricing"],
        example: "/api/brain/query?q=Why+is+HoundShield+CMMC+compliant",
      },
      { status: 400 }
    );
  }

  const result = mergedAnswer(q.trim());
  return NextResponse.json({ success: true, data: result });
}

/** POST /api/brain/query — authenticated for user dashboard
 *  x-brain-version: v3 → routes to Brain AI v3 multi-agent stack
 */
export async function POST(req: NextRequest) {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const brainVersion = req.headers.get("x-brain-version");
  if (brainVersion === "v3") {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }

    const v3Schema = z.object({
      query: z.string().min(3).max(2000),
      mode: z.enum(["fast", "deep"]).optional().default("fast"),
      compliance_framework: z.enum(["cmmc", "hipaa", "soc2", "security", "market"]).optional(),
    });

    const v3Parsed = v3Schema.safeParse(body);
    if (!v3Parsed.success) {
      return NextResponse.json(
        { success: false, error: v3Parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    try {
      const orchestrator = new MultiAgentOrchestrator(process.env.OPENROUTER_API_KEY);
      const result = await orchestrator.orchestrate(v3Parsed.data);
      return NextResponse.json(
        { success: true, data: { ...result, version: "v3" } },
        { headers: { "x-brain-version": "v3", "x-brain-agent": result.agent } }
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Brain AI v3 error";
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
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
  return NextResponse.json(
    { success: true, data: result },
    { headers: { "x-brain-version": "v1" } }
  );
}
