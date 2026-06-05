/**
 * GET /api/observability/bad-answers
 *
 * Powers the Bad Answers dashboard (Step 7 of the observability guide).
 * Returns flagged traces with full debug context.
 * Service role only — never exposed to end users directly.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/client';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  // Auth: admin role only
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const serviceClient = createServiceClient();
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Parse filters
  const url = new URL(request.url);
  const severity   = url.searchParams.get('severity');    // 'critical' | 'error' | 'warning'
  const flagRule   = url.searchParams.get('rule');        // specific flag rule ID
  const model      = url.searchParams.get('model');
  const since      = url.searchParams.get('since');       // ISO timestamp
  const limit      = Math.min(Number(url.searchParams.get('limit') ?? 50), 200);
  const offset     = Number(url.searchParams.get('offset') ?? 0);

  let query = serviceClient
    .from('ai_traces')
    .select(`
      trace_id,
      user_id,
      model_name,
      prompt_version,
      environment,
      start_ms,
      end_ms,
      metrics,
      quality_scores,
      flags,
      flag_severity,
      created_at
    `)
    .eq('is_flagged', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (severity)   query = query.eq('flag_severity', severity);
  if (model)      query = query.eq('model_name', model);
  if (since)      query = query.gte('created_at', since);

  const { data: traces, error, count } = await query;

  if (error) {
    console.error('[bad-answers] query error:', error.message);
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }

  // Filter by specific flag rule if requested
  const filtered = flagRule
    ? traces?.filter(t =>
        Array.isArray(t.flags) &&
        t.flags.some((f: { ruleId: string }) => f.ruleId === flagRule)
      )
    : traces;

  // Compute aggregate stats for the dashboard header
  const stats = computeDashboardStats(filtered ?? []);

  return NextResponse.json({
    traces: filtered ?? [],
    stats,
    pagination: {
      total: count ?? 0,
      limit,
      offset,
      hasMore: (offset + limit) < (count ?? 0),
    },
  });
}

interface TraceRow {
  metrics?: {
    totalLatencyMs?: number;
    modelCostUsd?: number;
    totalTokensUsed?: number;
  };
  quality_scores?: {
    groundedness?: number;
    answerRelevance?: number;
    hallucinationRisk?: number;
  };
  flags?: Array<{ ruleId: string; severity: string }>;
  flag_severity?: string;
}

function computeDashboardStats(traces: TraceRow[]) {
  if (traces.length === 0) return null;

  const flagCounts: Record<string, number> = {};
  let totalCost = 0;
  let totalLatency = 0;
  let criticalCount = 0;

  for (const t of traces) {
    totalCost    += t.metrics?.modelCostUsd ?? 0;
    totalLatency += t.metrics?.totalLatencyMs ?? 0;
    if (t.flag_severity === 'critical') criticalCount++;

    for (const flag of (t.flags ?? [])) {
      flagCounts[flag.ruleId] = (flagCounts[flag.ruleId] ?? 0) + 1;
    }
  }

  const topFlagRules = Object.entries(flagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([ruleId, count]) => ({ ruleId, count }));

  return {
    totalFlagged:      traces.length,
    criticalCount,
    avgLatencyMs:      Math.round(totalLatency / traces.length),
    avgCostUsd:        (totalCost / traces.length).toFixed(6),
    totalCostUsd:      totalCost.toFixed(4),
    topFlagRules,
    avgGroundedness:   avg(traces.map(t => t.quality_scores?.groundedness ?? 0)),
    avgHallucinationRisk: avg(traces.map(t => t.quality_scores?.hallucinationRisk ?? 0)),
  };
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
}
