// ============================================================================
// Gateway — Performance Metrics API
//
// GET /api/gateway/metrics
//   Returns real-time performance metrics for all gateway operations.
//   Includes P50/P95/P99 latency, budget exceedance rates, and health status.
//
// DELETE /api/gateway/metrics
//   Resets all metrics counters (admin only — requires service role key).
// ============================================================================

import { NextRequest } from 'next/server';
import {
  getAllMetrics,
  getViolations,
  getHealthStatus,
  resetMetrics,
  LATENCY_BUDGETS_MS,
} from '@/lib/gateway/perf-enforcer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// GET — metrics dashboard data
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const includeViolations = searchParams.get('violations') !== 'false';
  const violationLimit = Math.min(
    parseInt(searchParams.get('violation_limit') ?? '25', 10),
    100
  );

  const metrics = getAllMetrics();
  const health = getHealthStatus();

  const response: Record<string, unknown> = {
    health,
    budgets: LATENCY_BUDGETS_MS,
    metrics: metrics.map((m) => ({
      operation: m.operation,
      budget_ms: m.budget,
      samples: m.sampleCount,
      exceeded: m.exceeded,
      exceedance_rate_pct: parseFloat((m.exceedanceRate * 100).toFixed(2)),
      p50_ms: m.p50,
      p95_ms: m.p95,
      p99_ms: m.p99,
      max_ms: m.max,
      within_budget: m.withinBudget,
    })),
    generated_at: new Date().toISOString(),
  };

  if (includeViolations) {
    response.recent_violations = getViolations(violationLimit).map((v) => ({
      operation: v.operation,
      duration_ms: v.durationMs,
      budget_ms: LATENCY_BUDGETS_MS[v.operation],
      overage_ms: parseFloat((v.durationMs - LATENCY_BUDGETS_MS[v.operation]).toFixed(3)),
      request_id: v.requestId ?? null,
      timestamp: new Date(v.timestamp).toISOString(),
    }));
  }

  return Response.json(response);
}

// ---------------------------------------------------------------------------
// DELETE — reset metrics (admin)
// ---------------------------------------------------------------------------

export async function DELETE(req: NextRequest) {
  const serviceKey = req.headers.get('x-service-key');
  const expectedKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!expectedKey || serviceKey !== expectedKey) {
    return Response.json(
      { error: 'Unauthorized — x-service-key required' },
      { status: 401 }
    );
  }

  resetMetrics();

  return Response.json({
    success: true,
    message: 'Metrics counters reset',
    reset_at: new Date().toISOString(),
  });
}
