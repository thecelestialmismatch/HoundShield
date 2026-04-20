/**
 * POST /api/brain/query
 *
 * Queries the Hound Shield knowledge graph for compliance facts.
 * Returns structured facts with confidence levels and sources.
 *
 * Body: { question: string }
 * Response: { success: true, data: BrainResponse }
 * Auth: Supabase session required
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { queryBrain } from "@/lib/brain";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  question: z.string().min(3).max(500),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
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

  const result = queryBrain(parsed.data.question);

  return NextResponse.json({ success: true, data: result });
}
