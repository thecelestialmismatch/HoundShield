import { NextRequest, NextResponse } from "next/server";
import { classifyRisk } from "@/lib/classifier/risk-engine";
import { classifyWithAI } from "@/lib/classifier/ai-classifier";
import { z } from "zod";

const ScanSchema = z.object({
  text: z.string().min(1).max(100_000),
});

// Maximum request body size for scan endpoint (512KB)
const MAX_SCAN_BODY_SIZE = 524_288;

/**
 * POST /api/scan
 *
 * Scans text for sensitive data without logging or quarantining.
 * Useful for:
 *   - Testing the detection engine
 *   - Integrating into CI/CD pipelines
 *   - Demo purposes
 *
 * Combines regex-based classification with optional Bytez AI classification.
 */
export async function POST(req: NextRequest) {
  try {
    // Enforce request size limit
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_SCAN_BODY_SIZE) {
      return NextResponse.json(
        { error: "Request body too large. Maximum size is 512KB." },
        { status: 413 }
      );
    }

    const body = await req.json();
    const parseResult = ScanSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { text } = parseResult.data;
    const startTime = performance.now();

    // Run both classifiers in parallel
    const [regexResult, aiResult] = await Promise.all([
      classifyRisk(text),
      classifyWithAI(text),
    ]);

    const processingTime = Math.round(performance.now() - startTime);

    return NextResponse.json({
      risk_level: regexResult.risk_level,
      confidence: regexResult.confidence,
      classifications: regexResult.classifications,
      entities_found: regexResult.entities.length,
      entities: regexResult.entities.map((e) => ({
        type: e.type,
        value_redacted: e.value_redacted,
        confidence: e.confidence,
      })),
      should_block: regexResult.should_block,
      should_quarantine: regexResult.should_quarantine,
      ai_classification: aiResult
        ? {
            top_label: aiResult.top_label,
            top_score: Math.round(aiResult.top_score * 100) / 100,
            is_sensitive: aiResult.is_sensitive,
            model: "facebook/bart-large-mnli",
            powered_by: "Bytez",
          }
        : null,
      processing_time_ms: processingTime,
    });
  } catch (err) {
    console.error("Scan error:", err);
    return NextResponse.json(
      { error: "Scan failed" },
      { status: 500 }
    );
  }
}
