/**
 * Brain AI v3 — /api/brain/v3
 *
 * POST: Multi-agent compliance query with iterative reasoning.
 * fast mode: CMCCAgent (sonnet) + 1-2 reasoning loops → <2s
 * deep mode: MultiAgentOrchestrator (opus) + 4 loops + truth-verified → <15s
 *
 * Body: { query, mode?, compliance_framework? }
 * Returns: { answer, confidence, sources, reasoning_chain, agent_used, framework }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { MultiAgentOrchestrator } from "@/lib/brain-ai/multi-agent-orchestrator";
import type { ComplianceFramework } from "@/lib/brain-ai/multi-agent-orchestrator";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  query: z.string().min(3).max(2000),
  mode: z.enum(["fast", "deep"]).optional().default("fast"),
  compliance_framework: z
    .enum(["cmmc", "hipaa", "soc2", "security", "market"])
    .optional(),
});

export async function POST(req: NextRequest) {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid request",
      },
      { status: 400 }
    );
  }

  const { query, mode, compliance_framework } = parsed.data;

  try {
    const orchestrator = new MultiAgentOrchestrator(
      process.env.OPENROUTER_API_KEY
    );

    const result = await orchestrator.orchestrate({
      query,
      mode: mode as "fast" | "deep",
      compliance_framework: compliance_framework as
        | ComplianceFramework
        | undefined,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          answer: result.answer,
          confidence: result.confidence,
          sources: result.sources,
          reasoning_chain: result.reasoning_chain,
          agent_used: result.agent,
          framework: result.framework,
          verified: result.verified,
          mode,
          version: "v3",
        },
      },
      {
        headers: {
          "x-brain-version": "v3",
          "x-brain-agent": result.agent,
          "x-brain-framework": result.framework,
        },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Brain AI error";

    if (message.includes("Phase 2")) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This compliance framework is not yet available. CMMC is fully supported today.",
          available_frameworks: ["cmmc", "security"],
          upgrade_path: "Contact support for HIPAA/SOC2 access.",
        },
        { status: 501 }
      );
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "Use POST /api/brain/v3",
      example: {
        method: "POST",
        body: {
          query: "What CMMC controls does HoundShield satisfy?",
          mode: "fast",
          compliance_framework: "cmmc",
        },
        returns: {
          answer: "string",
          confidence: "number 0-1",
          sources: "string[]",
          reasoning_chain: "string[]",
          agent_used: "CMCCAgent | SecurityAgent",
          framework: "cmmc | security | ...",
          verified: "boolean",
          version: "v3",
        },
      },
    },
    { status: 405 }
  );
}
