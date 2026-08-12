// ============================================================================
// Gateway — Performance Metrics API
//
// GET /api/gateway/metrics
//   Returns real-time performance metrics for all gateway operations.
//   Includes P50/P95/P99 latency, budget exceedance rates, and health status.
//
// DELETE /api/gateway/metrics
//   Resets all metrics counters (admin only — requires service role key).
//
// AUTHENTICATION. DELETE was gated from the start; GET was not, and it is the
// verb that talks. Anonymously it returned the gateway's internal latency
// budgets, per-operation P50/P95/P99, and a live feed of budget violations —
// i.e. which scanning operation is currently slowest and by how much. For a
// product that sells "<10ms local scan" that is both a competitive disclosure
// and an attacker's tuning signal: it says exactly which input shape puts the
// engine under load, and confirms in real time when a probe is working.
// Reading it now requires a session.
// ============================================================================

import { NextRequest } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { requireUser } from '@/lib/auth/api-guard';
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
  // Fails closed: no session, or an unverified address, and nothing is read.
  const auth = await requireUser();
  if (!auth.user) return auth.response;

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

/** Constant-time string comparison that never throws on length mismatch. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function DELETE(req: NextRequest) {
  const serviceKey = req.headers.get('x-service-key');
  // Use a DEDICATED admin key, not the Supabase service-role secret (audit M1).
  const expectedKey = process.env.METRICS_ADMIN_KEY;

  if (!expectedKey || !serviceKey || !safeEqual(serviceKey, expectedKey)) {
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
