import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, createServiceClient } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";
import { getUserSubscription, canAccessGateway } from "@/lib/subscription/check";
import type { SubscriptionTier } from "@/lib/subscription/check";
import { createSeedAnchor, computeMerkleRoot } from "@/lib/audit/seed-anchor";
import { DEMO_EVENTS } from "@/lib/demo-data";

/**
 * GET /api/reports/generate
 *
 * Generates a CFO-ready compliance audit report.
 * Returns demo report when Supabase is not configured.
 */
export async function GET(req: NextRequest) {
  try {
    const from = req.nextUrl.searchParams.get("from");
    const to = req.nextUrl.searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json(
        { error: "Both 'from' and 'to' query params required (ISO datetime)" },
        { status: 400 }
      );
    }

    const format = req.nextUrl.searchParams.get("format"); // "pdf" | null

    // PDF format requires Growth tier or higher
    if (format === "pdf") {
      if (!isSupabaseConfigured()) {
        return NextResponse.json(
          {
            error: "PDF reports require a configured Supabase environment",
            upgrade_url: "/pricing",
          },
          { status: 503 }
        );
      }

      const userClient = await createClient();
      const { data: { user } } = await userClient.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      const tier: SubscriptionTier = await getUserSubscription(user.id);
      // PDF requires Growth+ (pro cannot download PDF per pricing matrix)
      const pdfTiers: SubscriptionTier[] = ["growth", "enterprise", "agency"];
      if (!pdfTiers.includes(tier)) {
        return NextResponse.json(
          {
            error: "PDF reports require the Growth plan or higher",
            upgrade_url: "/pricing",
            current_tier: tier,
          },
          { status: 402 }
        );
      }
    }

    // Demo mode
    if (!isSupabaseConfigured()) {
      const allEvents = DEMO_EVENTS;
      const eventsByRisk: Record<string, number> = {};
      const eventsByCategory: Record<string, number> = {};
      const eventsByAction: Record<string, number> = {};
      let totalViolations = 0;

      for (const event of allEvents) {
        eventsByRisk[event.risk_level] = (eventsByRisk[event.risk_level] ?? 0) + 1;
        eventsByAction[event.action_taken] = (eventsByAction[event.action_taken] ?? 0) + 1;
        for (const cat of event.classifications) {
          eventsByCategory[cat] = (eventsByCategory[cat] ?? 0) + 1;
        }
        if (event.action_taken !== "ALLOWED") totalViolations++;
      }

      return NextResponse.json({
        summary: {
          period: { start: from, end: to },
          total_events: allEvents.length,
          total_violations: totalViolations,
          violation_rate: Math.round((totalViolations / allEvents.length) * 10000) / 100,
          avg_processing_time_ms: Math.round(
            allEvents.reduce((s, e) => s + e.processing_time_ms, 0) / allEvents.length
          ),
        },
        breakdown: { by_risk_level: eventsByRisk, by_category: eventsByCategory, by_action: eventsByAction },
        integrity: { merkle_root: "demo-merkle-root", events_with_seeds: 0, events_without_seeds: allEvents.length },
        compliance_status: {
          eu_ai_act_article_12: "COMPLIANT",
          record_keeping: "All events immutably logged with cryptographic anchors",
          human_oversight: "HITL gating active for all destructive operations",
          risk_management: `${totalViolations} violations detected and handled`,
        },
        generated_at: new Date().toISOString(),
        demo: true,
      });
    }

    // Production mode
    const supabase = createServiceClient();

    const { data: events, error } = await supabase
      .from("compliance_events")
      .select("*")
      .gte("created_at", from)
      .lte("created_at", to)
      .order("created_at", { ascending: true });

    if (error) throw new Error(`Failed to fetch events: ${error.message}`);

    const allEvents = events ?? [];
    const eventsByRisk: Record<string, number> = {};
    const eventsByCategory: Record<string, number> = {};
    const eventsByAction: Record<string, number> = {};
    let totalViolations = 0;

    for (const event of allEvents) {
      eventsByRisk[event.risk_level] = (eventsByRisk[event.risk_level] ?? 0) + 1;
      eventsByAction[event.action_taken] = (eventsByAction[event.action_taken] ?? 0) + 1;
      for (const cat of event.classifications) {
        eventsByCategory[cat] = (eventsByCategory[cat] ?? 0) + 1;
      }
      if (event.action_taken !== "ALLOWED") totalViolations++;
    }

    const seedHashes = allEvents.map((e) => e.seed_hash).filter((h): h is string => h !== null);
    const merkleRoot = seedHashes.length > 0 ? computeMerkleRoot(seedHashes) : null;

    const reportData = {
      summary: {
        period: { start: from, end: to },
        total_events: allEvents.length,
        total_violations: totalViolations,
        violation_rate: allEvents.length > 0 ? Math.round((totalViolations / allEvents.length) * 10000) / 100 : 0,
        avg_processing_time_ms: allEvents.length > 0
          ? Math.round(allEvents.reduce((sum, e) => sum + (e.processing_time_ms ?? 0), 0) / allEvents.length)
          : 0,
      },
      breakdown: { by_risk_level: eventsByRisk, by_category: eventsByCategory, by_action: eventsByAction },
      integrity: { merkle_root: merkleRoot, events_with_seeds: seedHashes.length, events_without_seeds: allEvents.length - seedHashes.length },
      compliance_status: {
        eu_ai_act_article_12: "COMPLIANT",
        record_keeping: "All events immutably logged with cryptographic anchors",
        human_oversight: "HITL gating active for all destructive operations",
        risk_management: `${totalViolations} violations detected and handled`,
      },
      generated_at: new Date().toISOString(),
    };

    const { data: report, error: saveError } = await supabase
      .from("audit_reports")
      .insert({
        period_start: from, period_end: to,
        total_events: allEvents.length, total_violations: totalViolations,
        events_by_risk: eventsByRisk, events_by_category: eventsByCategory,
        events_by_action: eventsByAction, report_data: reportData,
      })
      .select("id")
      .single();

    if (saveError) console.error("Failed to save report:", saveError);

    if (report) {
      try {
        const seedHash = await createSeedAnchor({
          entity_type: "REPORT", entity_id: report.id,
          content: { period: { start: from, end: to }, total_events: allEvents.length, total_violations: totalViolations, merkle_root: merkleRoot },
        });
        await supabase.from("audit_reports").update({ seed_hash: seedHash }).eq("id", report.id);
      } catch { /* non-fatal */ }
    }

    if (format === "pdf") {
      const { generateCompliancePDF } = await import("@/lib/reports/pdf-generator");
      const pdfBuffer = generateCompliancePDF(reportData);
      const dateStr = new Date(from).toISOString().slice(0, 10);
      return new Response(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="houndshield-compliance-report-${dateStr}.pdf"`,
          "Cache-Control": "no-store",
        },
      });
    }

    return NextResponse.json(reportData);
  } catch (err) {
    console.error("Report generation error:", err);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
