// ============================================================================
// Kaelus Gateway — Performance Budget Enforcer v1.0
//
// Enforces hard latency budgets on every gateway operation:
//
//   Operation            Budget      Action on breach
//   ─────────────────    ─────────   ─────────────────────────────────────
//   Regex scan           5ms         Log WARN + increment budget_exceeded counter
//   ML/semantic scan     10ms        Log WARN + increment budget_exceeded counter
//   Total gateway        50ms        Log ERROR + emit perf_violation event
//   First token          200ms       Log WARN (provider-side, not gateway-side)
//
// Design:
//   - Wraps any async operation in a timed execution context
//   - Emits structured perf events consumable by the SSE event stream
//   - Tracks rolling P50/P95/P99 per operation type (ring buffer)
//   - Zero external dependencies — pure Node.js
//
// Usage:
//   const result = await withBudget('regex_scan', 5, () => classifyRisk(text));
//   // result.exceeded = true if scan took > 5ms
// ============================================================================

import { createHash } from 'crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OperationType =
  | 'regex_scan'     // classifier regex pass
  | 'ml_scan'        // Gemini/ML semantic scan
  | 'gateway_total'  // full request lifecycle
  | 'first_token'    // time to first token from provider
  | 'agent_tool'     // individual agent tool execution
  | 'ingestion';     // knowledge ingestion step

export const LATENCY_BUDGETS_MS: Record<OperationType, number> = {
  regex_scan:    5,
  ml_scan:      10,
  gateway_total: 50,
  first_token:  200,
  agent_tool:  30_000,
  ingestion:   10_000,
};

export interface PerfSample {
  operation: OperationType;
  durationMs: number;
  timestamp: number;
  exceeded: boolean;
  requestId?: string;
}

export interface BudgetedResult<T> {
  value: T;
  durationMs: number;
  exceeded: boolean;
  budget: number;
  operation: OperationType;
}

// ---------------------------------------------------------------------------
// Ring buffer for rolling percentiles
// ---------------------------------------------------------------------------

const RING_SIZE = 1000;

class RingBuffer<T> {
  private buf: T[];
  private head = 0;
  private size = 0;

  constructor(private readonly capacity: number) {
    this.buf = new Array<T>(capacity);
  }

  push(item: T): void {
    this.buf[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    if (this.size < this.capacity) this.size++;
  }

  toArray(): T[] {
    if (this.size === 0) return [];
    if (this.size < this.capacity) return this.buf.slice(0, this.size);
    // Reconstruct in order (oldest first)
    return [
      ...this.buf.slice(this.head),
      ...this.buf.slice(0, this.head),
    ].filter((x) => x !== undefined);
  }

  get length(): number {
    return this.size;
  }
}

// ---------------------------------------------------------------------------
// In-process metrics store
// ---------------------------------------------------------------------------

const globalPerf = globalThis as unknown as {
  __kaelus_perf?: {
    samples: Map<OperationType, RingBuffer<number>>;
    violations: PerfSample[];
    counters: Map<OperationType, { total: number; exceeded: number }>;
  };
};

if (!globalPerf.__kaelus_perf) {
  const samples = new Map<OperationType, RingBuffer<number>>();
  const counters = new Map<OperationType, { total: number; exceeded: number }>();

  const ops: OperationType[] = ['regex_scan', 'ml_scan', 'gateway_total', 'first_token', 'agent_tool', 'ingestion'];
  for (const op of ops) {
    samples.set(op, new RingBuffer<number>(RING_SIZE));
    counters.set(op, { total: 0, exceeded: 0 });
  }

  globalPerf.__kaelus_perf = { samples, violations: [], counters };
}

const perfStore = globalPerf.__kaelus_perf!;

// ---------------------------------------------------------------------------
// Core: timed execution with budget enforcement
// ---------------------------------------------------------------------------

/**
 * Execute `fn` and enforce the latency budget for the given operation.
 *
 * @param operation - The operation type (determines budget)
 * @param fn        - Async function to time
 * @param requestId - Optional request ID for violation logging
 * @returns BudgetedResult containing the function's return value + metrics
 */
export async function withBudget<T>(
  operation: OperationType,
  fn: () => Promise<T>,
  requestId?: string
): Promise<BudgetedResult<T>> {
  const budget = LATENCY_BUDGETS_MS[operation];
  const start = performance.now();

  let value: T;
  try {
    value = await fn();
  } catch (err) {
    // Record timing even on error
    const durationMs = parseFloat((performance.now() - start).toFixed(3));
    recordSample(operation, durationMs, requestId);
    throw err;
  }

  const durationMs = parseFloat((performance.now() - start).toFixed(3));
  const exceeded = durationMs > budget;

  recordSample(operation, durationMs, requestId);

  if (exceeded) {
    emitViolation({ operation, durationMs, exceeded: true, timestamp: Date.now(), requestId });
  }

  return { value, durationMs, exceeded, budget, operation };
}

/**
 * Synchronous version for CPU-bound operations (regex scanning).
 */
export function withBudgetSync<T>(
  operation: OperationType,
  fn: () => T,
  requestId?: string
): BudgetedResult<T> {
  const budget = LATENCY_BUDGETS_MS[operation];
  const start = performance.now();
  const value = fn();
  const durationMs = parseFloat((performance.now() - start).toFixed(3));
  const exceeded = durationMs > budget;

  recordSample(operation, durationMs, requestId);

  if (exceeded) {
    emitViolation({ operation, durationMs, exceeded: true, timestamp: Date.now(), requestId });
  }

  return { value, durationMs, exceeded, budget, operation };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function recordSample(op: OperationType, durationMs: number, requestId?: string): void {
  perfStore.samples.get(op)?.push(durationMs);

  const counter = perfStore.counters.get(op)!;
  counter.total++;
  if (durationMs > LATENCY_BUDGETS_MS[op]) {
    counter.exceeded++;
  }
}

function emitViolation(sample: PerfSample): void {
  perfStore.violations.push(sample);
  // Keep last 500 violations
  if (perfStore.violations.length > 500) {
    perfStore.violations.splice(0, perfStore.violations.length - 500);
  }

  if (process.env.NODE_ENV !== 'test') {
    const severity = sample.operation === 'gateway_total' ? 'ERROR' : 'WARN';
    console[severity === 'ERROR' ? 'error' : 'warn'](
      `[perf-enforcer] Budget exceeded: ${sample.operation} took ${sample.durationMs}ms (budget: ${LATENCY_BUDGETS_MS[sample.operation]}ms)${sample.requestId ? ` [${sample.requestId}]` : ''}`
    );
  }
}

// ---------------------------------------------------------------------------
// Percentile computation
// ---------------------------------------------------------------------------

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return parseFloat(sorted[Math.max(0, idx)].toFixed(3));
}

// ---------------------------------------------------------------------------
// Public metrics API
// ---------------------------------------------------------------------------

export interface OperationMetrics {
  operation: OperationType;
  budget: number;
  sampleCount: number;
  exceeded: number;
  exceedanceRate: number; // 0–1
  p50: number;
  p95: number;
  p99: number;
  max: number;
  withinBudget: boolean; // true if p99 <= budget
}

/**
 * Get percentile metrics for a specific operation.
 */
export function getMetrics(operation: OperationType): OperationMetrics {
  const samples = perfStore.samples.get(operation)?.toArray() ?? [];
  const sorted = [...samples].sort((a, b) => a - b);
  const counter = perfStore.counters.get(operation) ?? { total: 0, exceeded: 0 };
  const budget = LATENCY_BUDGETS_MS[operation];

  return {
    operation,
    budget,
    sampleCount: counter.total,
    exceeded: counter.exceeded,
    exceedanceRate: counter.total > 0 ? counter.exceeded / counter.total : 0,
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    max: sorted.length > 0 ? sorted[sorted.length - 1] : 0,
    withinBudget: percentile(sorted, 99) <= budget || sorted.length === 0,
  };
}

/**
 * Get metrics for all operations.
 */
export function getAllMetrics(): OperationMetrics[] {
  const ops: OperationType[] = ['regex_scan', 'ml_scan', 'gateway_total', 'first_token', 'agent_tool', 'ingestion'];
  return ops.map(getMetrics);
}

/**
 * Get recent budget violations (newest first).
 */
export function getViolations(limit = 50): PerfSample[] {
  return [...perfStore.violations].reverse().slice(0, limit);
}

/**
 * Overall health summary.
 * Returns 'healthy' if all operations are within P99 budget.
 */
export function getHealthStatus(): {
  status: 'healthy' | 'degraded' | 'critical';
  issues: string[];
} {
  const all = getAllMetrics();
  const exceeding = all.filter((m) => m.sampleCount > 10 && !m.withinBudget);

  if (exceeding.length === 0) {
    return { status: 'healthy', issues: [] };
  }

  const critical = exceeding.filter((m) => m.p99 > m.budget * 3);
  const status = critical.length > 0 ? 'critical' : 'degraded';

  return {
    status,
    issues: exceeding.map(
      (m) => `${m.operation}: P99=${m.p99}ms (budget ${m.budget}ms, exceedance rate ${(m.exceedanceRate * 100).toFixed(1)}%)`
    ),
  };
}

// ---------------------------------------------------------------------------
// SHA-256 Audit Log Hashing
// ---------------------------------------------------------------------------

/**
 * Compute a tamper-evident SHA-256 hash for an audit log entry.
 *
 * The hash covers: entry ID, timestamp, event type, actor, and data.
 * Including the previous entry's hash creates a chain — any modification
 * to a past entry breaks all subsequent hashes.
 *
 * @param entry      - The audit log entry to hash
 * @param prevHash   - Hash of the previous entry (for chain integrity)
 * @returns SHA-256 hex string
 */
export function hashAuditEntry(
  entry: {
    id: string;
    timestamp: string;
    event_type: string;
    actor?: string;
    data: unknown;
  },
  prevHash = ''
): string {
  const canonical = JSON.stringify({
    id: entry.id,
    timestamp: entry.timestamp,
    event_type: entry.event_type,
    actor: entry.actor ?? 'system',
    data: entry.data,
    prev: prevHash,
  });

  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

/**
 * Verify the integrity of an audit log chain.
 *
 * @param entries - Array of entries in chronological order, each with its stored hash
 * @returns Object indicating whether the chain is valid and the first invalid index
 */
export function verifyAuditChain(
  entries: Array<{
    id: string;
    timestamp: string;
    event_type: string;
    actor?: string;
    data: unknown;
    stored_hash: string;
  }>
): { valid: boolean; firstInvalidIndex?: number; totalVerified: number } {
  let prevHash = '';

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const expected = hashAuditEntry(entry, prevHash);

    if (expected !== entry.stored_hash) {
      return { valid: false, firstInvalidIndex: i, totalVerified: i };
    }

    prevHash = entry.stored_hash;
  }

  return { valid: true, totalVerified: entries.length };
}

/**
 * Reset all metrics (for testing).
 */
export function resetMetrics(): void {
  const ops: OperationType[] = ['regex_scan', 'ml_scan', 'gateway_total', 'first_token', 'agent_tool', 'ingestion'];
  for (const op of ops) {
    perfStore.samples.set(op, new RingBuffer<number>(RING_SIZE));
    perfStore.counters.set(op, { total: 0, exceeded: 0 });
  }
  perfStore.violations.length = 0;
}
