/**
 * POST /api/brain/dreams  — Start a Claude Dreams consolidation job
 * GET  /api/brain/dreams?id=<dreamId>  — Poll dream status
 *
 * Auth: session (production) or x-ingest-key (demo/local)
 * Rate: 3 dreams per hour per IP (Dreams jobs are expensive)
 *
 * Lifecycle:
 *   POST → { dreamId, status: "pending" }
 *   GET  → { dreamId, status: "running" | "succeeded" | "failed", outputStoreId? }
 *   POST { action: "promote", dreamId } → imports output into live graph
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";
import { getKnowledgeGraph } from "@/lib/brain-ai/knowledge-graph";
import { getDreamsService, buildDreamSummary } from "@/lib/brain-ai/dreams";
import { addKnowledge } from "@/lib/brain-ai/brain-query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Per-route rate limit: 3 dreams per hour per IP
// ---------------------------------------------------------------------------

const dreamRateMap = new Map<string, { count: number; resetAt: number }>();
const DREAM_MAX = 3;
const DREAM_WINDOW_MS = 3_600_000; // 1 hour

function isDreamRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = dreamRateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    dreamRateMap.set(ip, { count: 1, resetAt: now + DREAM_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > DREAM_MAX;
}

// ---------------------------------------------------------------------------
// Auth helper (shared with ingest route)
// ---------------------------------------------------------------------------

async function authenticate(req: NextRequest): Promise<{ ok: boolean; error?: string }> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Unauthorized" };
  } else {
    const apiKey = req.headers.get("x-ingest-key");
    const expected = process.env.INGEST_API_KEY;
    if (!expected || apiKey !== expected) return { ok: false, error: "Unauthorized" };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Input schemas
// ---------------------------------------------------------------------------

const startSchema = z.object({
  sessionIds: z.array(z.string()).max(100).optional(),
  instructions: z.string().min(10).max(2000).optional(),
  model: z.enum(["claude-opus-4-7", "claude-sonnet-4-6"]).optional(),
});

const promoteSchema = z.object({
  action: z.literal("promote"),
  dreamId: z.string().min(3),
  outputStoreId: z.string().min(3),
});

// ---------------------------------------------------------------------------
// POST — start dream or promote output
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const auth = await authenticate(req);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  const forwarded = req.headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || "unknown";

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  // Promote action: import output store into live graph
  const promoteResult = promoteSchema.safeParse(body);
  if (promoteResult.success) {
    const { outputStoreId } = promoteResult.data;
    const svc = getDreamsService();
    const nodes = await svc.importOutputStore(outputStoreId);

    let imported = 0;
    for (const partial of nodes) {
      if (!partial.content || partial.content.length < 10) continue;
      addKnowledge({
        domain: partial.domain,
        title: partial.title,
        content: partial.content,
        keywords: partial.keywords ?? [],
        source: partial.source ?? "dreams",
        ttlDays: partial.ttl ? partial.ttl / 86400000 : 0,
      });
      imported++;
    }

    return NextResponse.json({
      success: true,
      data: { imported, message: `Promoted ${imported} consolidated nodes into the live knowledge graph.` },
    });
  }

  // Start dream
  if (isDreamRateLimited(ip)) {
    return NextResponse.json(
      { success: false, error: "Too many Dreams jobs. Limit: 3 per hour." },
      { status: 429, headers: { "Retry-After": "3600" } }
    );
  }

  const parsed = startSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const graph = getKnowledgeGraph();
  const domains = ["cmmc","hipaa","soc2","nist","competitor","market","architecture","pricing","customer"] as const;
  const nodes = domains.flatMap(d => graph.listDomain(d));

  const svc = getDreamsService();
  const result = await svc.startDream(nodes, parsed.data);

  return NextResponse.json({
    success: true,
    data: {
      dreamId: result.dreamId,
      status: result.status,
      nodeCount: nodes.length,
      message: "Dream started. Poll GET /api/brain/dreams?id=<dreamId> for status.",
      pollUrl: `/api/brain/dreams?id=${result.dreamId}`,
    },
  });
}

// ---------------------------------------------------------------------------
// GET — poll dream status
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const auth = await authenticate(req);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({
      success: true,
      endpoint: "POST /api/brain/dreams",
      description: "Start a Claude Dreams consolidation job on the knowledge graph.",
      poll: "GET /api/brain/dreams?id=<dreamId>",
      betas: ["managed-agents-2026-04-01", "dreaming-2026-04-21"],
      limits: "3 jobs per hour",
    });
  }

  const svc = getDreamsService();
  const result = await svc.pollDream(id);

  return NextResponse.json({
    success: true,
    data: {
      ...result,
      summary: buildDreamSummary(result),
    },
  });
}
