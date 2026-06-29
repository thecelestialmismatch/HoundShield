/**
 * Security Scan API — /api/scan/security
 *
 * POST: Generate structured security checklist or threat model for an endpoint/feature.
 * Auth required — Growth tier and above.
 *
 * Body: { type: "checklist" | "threat_model" | "logic_hunt", payload: {...} }
 * Returns: SecurityChecklist | ThreatModel | LogicVulnerabilities
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  generateApiSecurityChecklist,
  huntBusinessLogic,
} from "@/lib/security/api-security";
import { generateThreatModel } from "@/lib/security/threat-model";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const checklistPayloadSchema = z.object({
  endpoint: z.string().min(1).max(500),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  auth: z.string().min(1).max(200),
  businessFunction: z.string().min(1).max(500),
});

const threatModelPayloadSchema = z.object({
  stack: z.array(z.string()).min(1).max(20),
  authType: z.string().min(1).max(200),
  hosting: z.string().min(1).max(200),
  dataTypes: z.array(z.string()).min(1).max(20),
});

const logicHuntPayloadSchema = z.object({
  featureDescription: z.string().min(10).max(2000),
});

const bodySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("checklist"), payload: checklistPayloadSchema }),
  z.object({ type: z.literal("threat_model"), payload: threatModelPayloadSchema }),
  z.object({ type: z.literal("logic_hunt"), payload: logicHuntPayloadSchema }),
]);

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
        expected_types: ["checklist", "threat_model", "logic_hunt"],
      },
      { status: 400 }
    );
  }

  try {
    let data: unknown;

    switch (parsed.data.type) {
      case "checklist":
        data = await generateApiSecurityChecklist(parsed.data.payload);
        break;
      case "threat_model":
        data = await generateThreatModel(parsed.data.payload);
        break;
      case "logic_hunt":
        data = await huntBusinessLogic(parsed.data.payload.featureDescription);
        break;
    }

    return NextResponse.json({ success: true, data, scan_type: parsed.data.type });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Security scan failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "Use POST /api/scan/security",
      scan_types: {
        checklist: {
          description: "OWASP API Top 10 + NIST 800-171 checklist for an endpoint",
          payload: { endpoint: "/api/users", method: "POST", auth: "JWT Bearer", businessFunction: "User registration" },
        },
        threat_model: {
          description: "STRIDE threat model for a technology stack",
          payload: { stack: ["Next.js", "Supabase", "Stripe"], authType: "JWT", hosting: "Vercel", dataTypes: ["CUI", "PII"] },
        },
        logic_hunt: {
          description: "Business logic vulnerability hunt for a feature",
          payload: { featureDescription: "Users can upgrade their subscription tier and immediately access premium features" },
        },
      },
    },
    { status: 405 }
  );
}
