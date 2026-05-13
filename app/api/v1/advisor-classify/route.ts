/**
 * POST /api/v1/advisor-classify
 *
 * Advisor-augmented compliance classification using Anthropic's
 * advisor_20260301 tool type. Runs Haiku as executor, Opus as advisor
 * (only consulted when Haiku is uncertain on borderline cases).
 *
 * Use cases:
 *   - Pre-screening documents before they reach AI tools
 *   - Batch compliance audits where latency > speed trade-off
 *   - Explicit advisor classification bypassing the gateway proxy
 *
 * Auth: requires valid Supabase session
 * Tier: Pro+ (uses Anthropic API — not available on free tier)
 *
 * Request body:
 *   { "text": string, "context"?: { "frameworks"?: string[] } }
 *
 * Response:
 *   {
 *     "risk_level": "NONE"|"LOW"|"MEDIUM"|"HIGH"|"CRITICAL",
 *     "frameworks_triggered": string[],
 *     "recommended_action": "PASS"|"WARN"|"BLOCK"|"QUARANTINE",
 *     "reasoning": string,
 *     "advisor_consulted": boolean,
 *     "confidence": number,
 *     "latency_ms": number,
 *     "fallback": boolean   // true if advisor unavailable, regex result returned
 *   }
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { classifyWithAdvisor, isAdvisorConfigured } from "@/lib/advisor/compliance-advisor";
import { classifyRisk } from "@/lib/classifier/risk-engine";

const RequestSchema = z.object({
  text: z.string().min(1).max(100_000),
  context: z
    .object({
      frameworks: z.array(z.string()).optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Tier gate: Pro+ only ────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();

  const tier = profile?.tier ?? "free";
  if (tier === "free") {
    return NextResponse.json(
      {
        error: "Advisor classification requires a Pro plan or higher.",
        upgrade_url: "/command-center/billing",
      },
      { status: 402 }
    );
  }

  // ── Parse body ──────────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { text } = parsed.data;

  // ── Advisor classification ──────────────────────────────────────────────────
  if (!isAdvisorConfigured()) {
    // Advisor not available — fall back to regex classification
    const fallbackResult = await classifyRisk(text);
    return NextResponse.json({
      risk_level: fallbackResult.risk_level,
      frameworks_triggered: fallbackResult.classifications.map(String),
      recommended_action: fallbackResult.should_block
        ? "BLOCK"
        : fallbackResult.should_quarantine
          ? "QUARANTINE"
          : fallbackResult.risk_level === "NONE" || fallbackResult.risk_level === "LOW"
            ? "PASS"
            : "WARN",
      reasoning:
        fallbackResult.matched_rules.length > 0
          ? `Regex matched: ${fallbackResult.matched_rules.slice(0, 3).join(", ")}`
          : "No sensitive patterns detected.",
      advisor_consulted: false,
      confidence: fallbackResult.confidence,
      latency_ms: 0,
      fallback: true,
    });
  }

  const advisorResult = await classifyWithAdvisor(text);

  if (!advisorResult) {
    // Advisor call failed — fall back to regex
    const fallbackResult = await classifyRisk(text);
    return NextResponse.json({
      risk_level: fallbackResult.risk_level,
      frameworks_triggered: fallbackResult.classifications.map(String),
      recommended_action: fallbackResult.should_block
        ? "BLOCK"
        : fallbackResult.should_quarantine
          ? "QUARANTINE"
          : "PASS",
      reasoning: "Advisor unavailable — regex classification used.",
      advisor_consulted: false,
      confidence: fallbackResult.confidence,
      latency_ms: 0,
      fallback: true,
    });
  }

  return NextResponse.json({
    ...advisorResult,
    fallback: false,
  });
}
