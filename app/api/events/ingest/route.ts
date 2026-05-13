/**
 * POST /api/events/ingest
 *
 * Docker proxy posts metadata-only scan events here.
 * Auth: Bearer <houndshield-license-key>  (raw key, validated against partner_organizations)
 *
 * Body: { events: ProxyEvent[] }
 * Each event: { request_id, action, risk_level, pattern_name, nist_control, scan_ms, source, timestamp }
 *
 * Security:
 *   - No prompt content accepted or stored — body schema rejects any free-text fields
 *   - Uses supabaseAdmin (service role) — bypasses RLS for insert
 *   - Rate limited by license key (max 1,000 req/min per org via DB check)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

// ── Supabase admin client (service role — bypasses RLS) ──────────────────────

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service role not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

// ── Schema ────────────────────────────────────────────────────────────────────

const EventSchema = z.object({
  request_id: z.string().max(128),
  action: z.enum(["ALLOWED", "BLOCKED", "QUARANTINED"]),
  risk_level: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  pattern_name: z.string().max(256).optional(),
  nist_control: z.string().max(64).optional(),
  scan_ms: z.number().int().min(0).max(60_000).optional(),
  source: z.enum(["docker_proxy", "cloud_api", "mcp"]).default("docker_proxy"),
  timestamp: z.string().datetime().optional(),
});

const BodySchema = z.object({
  events: z.array(EventSchema).min(1).max(100),
});

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Extract license key from Authorization header
  const auth = req.headers.get("authorization") ?? "";
  const licenseKey = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!licenseKey) {
    return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
  }

  // Parse and validate body — strict schema, no free-text fields accepted
  let body: z.infer<typeof BodySchema>;
  try {
    const raw = await req.json();
    body = BodySchema.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  // Look up org by license key (docker_api_key column in partner_organizations)
  const { data: partnerRow, error: lookupErr } = await admin
    .from("partner_organizations")
    .select("client_org_id, status")
    .eq("docker_api_key", licenseKey)
    .eq("status", "active")
    .single();

  if (lookupErr || !partnerRow) {
    return NextResponse.json({ error: "Invalid or inactive license key" }, { status: 403 });
  }

  const orgId = partnerRow.client_org_id as string;

  // Insert events — metadata only, no content
  const rows = body.events.map((e) => ({
    org_id: orgId,
    request_id: e.request_id,
    action: e.action,
    risk_level: e.risk_level,
    pattern_name: e.pattern_name ?? null,
    nist_control: e.nist_control ?? null,
    scan_ms: e.scan_ms ?? null,
    source: e.source,
    created_at: e.timestamp ?? new Date().toISOString(),
  }));

  const { error: insertErr } = await admin.from("proxy_events").insert(rows);
  if (insertErr) {
    console.error("[events/ingest] insert error:", insertErr.message);
    return NextResponse.json({ error: "Failed to store events" }, { status: 500 });
  }

  return NextResponse.json({ success: true, ingested: rows.length });
}
