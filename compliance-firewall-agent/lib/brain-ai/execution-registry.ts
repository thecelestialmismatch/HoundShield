/**
 * Brain AI — Execution Registry
 *
 * Tracks all Brain AI executions (tool calls, agent turns, commands) with
 * status, timing, and results. Brain AI original implementation.
 */

export type ExecutionStatus = "pending" | "running" | "success" | "error" | "cancelled";

export interface ExecutionRecord {
  id: string;
  sessionId: string;
  type: "tool_call" | "agent_turn" | "command" | "query";
  name: string;
  input: unknown;
  output?: unknown;
  status: ExecutionStatus;
  startedAt: number;
  completedAt?: number;
  durationMs?: number;
  errorMessage?: string;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
}

// In-memory registry (up to 1000 entries per session)
const registry = new Map<string, ExecutionRecord[]>();
const MAX_PER_SESSION = 1000;

let _counter = 0;
function generateId(): string {
  return `exec-${Date.now()}-${(++_counter).toString(36)}`;
}

export function startExecution(
  sessionId: string,
  type: ExecutionRecord["type"],
  name: string,
  input: unknown
): ExecutionRecord {
  const record: ExecutionRecord = {
    id: generateId(),
    sessionId,
    type,
    name,
    input,
    status: "running",
    startedAt: Date.now(),
  };

  const existing = registry.get(sessionId) ?? [];
  if (existing.length >= MAX_PER_SESSION) existing.shift(); // evict oldest
  registry.set(sessionId, [...existing, record]);
  return record;
}

export function completeExecution(
  id: string,
  sessionId: string,
  output: unknown,
  options: {
    inputTokens?: number;
    outputTokens?: number;
    costUsd?: number;
  } = {}
): ExecutionRecord | null {
  const entries = registry.get(sessionId);
  if (!entries) return null;

  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return null;

  const now = Date.now();
  const updated: ExecutionRecord = {
    ...entries[idx],
    output,
    status: "success",
    completedAt: now,
    durationMs: now - entries[idx].startedAt,
    ...options,
  };

  entries[idx] = updated;
  return updated;
}

export function failExecution(
  id: string,
  sessionId: string,
  errorMessage: string
): ExecutionRecord | null {
  const entries = registry.get(sessionId);
  if (!entries) return null;

  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return null;

  const now = Date.now();
  const updated: ExecutionRecord = {
    ...entries[idx],
    errorMessage,
    status: "error",
    completedAt: now,
    durationMs: now - entries[idx].startedAt,
  };

  entries[idx] = updated;
  return updated;
}

export function getSessionExecutions(sessionId: string): ExecutionRecord[] {
  return registry.get(sessionId) ?? [];
}

export function getExecution(id: string, sessionId: string): ExecutionRecord | null {
  return registry.get(sessionId)?.find((e) => e.id === id) ?? null;
}

export function getSessionStats(sessionId: string): {
  total: number;
  success: number;
  error: number;
  totalTokens: number;
  totalCostUsd: number;
  avgDurationMs: number;
} {
  const entries = registry.get(sessionId) ?? [];
  const completed = entries.filter((e) => e.completedAt != null);

  return {
    total: entries.length,
    success: entries.filter((e) => e.status === "success").length,
    error: entries.filter((e) => e.status === "error").length,
    totalTokens: entries.reduce(
      (s, e) => s + (e.inputTokens ?? 0) + (e.outputTokens ?? 0),
      0
    ),
    totalCostUsd: entries.reduce((s, e) => s + (e.costUsd ?? 0), 0),
    avgDurationMs:
      completed.length > 0
        ? completed.reduce((s, e) => s + (e.durationMs ?? 0), 0) / completed.length
        : 0,
  };
}

export function clearSessionExecutions(sessionId: string): void {
  registry.delete(sessionId);
}
