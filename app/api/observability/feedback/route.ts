/**
 * POST /api/observability/feedback
 *
 * Records user thumbs-up / thumbs-down on an AI response.
 * Retroactively updates the trace's quality scores and re-evaluates flags.
 * This closes the feedback loop: Score → Flag → Debug → Fix → Test.
 *
 * Body: { traceId: string; feedback: "thumbs_up" | "thumbs_down" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/client';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';

const FeedbackSchema = z.object({
  traceId:  z.string().min(1),
  feedback: z.enum(['thumbs_up', 'thumbs_down']),
});

export async function POST(request: NextRequest) {
  // Auth: must be the same user who owns the trace
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = FeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
  }

  const { traceId, feedback } = parsed.data;
  const serviceClient = createServiceClient();

  // Verify the trace belongs to this user
  const { data: trace, error: fetchError } = await serviceClient
    .from('ai_traces')
    .select('trace_id, user_id, quality_scores, flags')
    .eq('trace_id', traceId)
    .single();

  if (fetchError || !trace) {
    return NextResponse.json({ error: 'Trace not found' }, { status: 404 });
  }

  if (trace.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Update quality scores with user satisfaction signal
  const updatedScores = {
    ...(trace.quality_scores ?? {}),
    userSatisfaction: feedback === 'thumbs_up' ? 1.0 : 0.0,
  };

  // Add thumbs_down flag if not already present
  interface TraceFlag { ruleId: string; severity: string; reason?: string }
  const existingFlags = (trace.flags as TraceFlag[]) ?? [];
  const updatedFlags: TraceFlag[] = feedback === 'thumbs_down'
    ? [
        ...existingFlags.filter((f) => f.ruleId !== 'USER_THUMBS_DOWN'),
        { ruleId: 'USER_THUMBS_DOWN', severity: 'warning', reason: 'User rated this answer as unhelpful' },
      ]
    : existingFlags.filter((f) => f.ruleId !== 'USER_THUMBS_DOWN');

  const isNowFlagged = updatedFlags.length > 0;
  const maxSeverity = isNowFlagged
    ? updatedFlags.some((f) => f.severity === 'critical') ? 'critical'
      : updatedFlags.some((f) => f.severity === 'error') ? 'error'
      : 'warning'
    : null;

  const { error: updateError } = await serviceClient
    .from('ai_traces')
    .update({
      quality_scores: updatedScores,
      flags:          updatedFlags,
      is_flagged:     isNowFlagged,
      flag_severity:  maxSeverity,
    })
    .eq('trace_id', traceId);

  if (updateError) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, traceId, feedback, flagged: isNowFlagged });
}
