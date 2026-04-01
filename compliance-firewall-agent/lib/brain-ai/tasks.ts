/**
 * Brain AI — Task Management
 *
 * Manages porting tasks, remediation tasks, and compliance work items.
 * Brain AI original implementation for Kaelus.online.
 */

export type TaskStatus = "pending" | "in_progress" | "complete" | "skipped" | "failed";
export type TaskPriority = "critical" | "high" | "medium" | "low";

export interface BrainAITask {
  id: string;
  name: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: "compliance" | "remediation" | "assessment" | "onboarding" | "integration" | "internal";
  assignedTo?: string;
  dueDate?: number;
  createdAt: number;
  updatedAt: number;
  metadata: Record<string, unknown>;
  subtasks?: BrainAITask[];
}

// ─── Default Brain AI internal tasks ──────────────────────────────────────

export function getDefaultTasks(): BrainAITask[] {
  const now = Date.now();
  return [
    {
      id: "root-module-parity",
      name: "Root Module Parity",
      description: "Ensure all Brain AI core modules are implemented and exported",
      status: "complete",
      priority: "critical",
      category: "internal",
      createdAt: now,
      updatedAt: now,
      metadata: { modules: ["models", "session-store", "query-engine", "commands", "tools", "runtime"] },
    },
    {
      id: "directory-parity",
      name: "Directory Structure Parity",
      description: "Ensure lib/brain-ai/ directory matches full feature set",
      status: "complete",
      priority: "high",
      category: "internal",
      createdAt: now,
      updatedAt: now,
      metadata: {},
    },
    {
      id: "parity-audit",
      name: "Parity Audit",
      description: "Run feature coverage audit to verify completeness",
      status: "in_progress",
      priority: "high",
      category: "internal",
      createdAt: now,
      updatedAt: now,
      metadata: { auditEndpoint: "/api/brain-ai/audit" },
    },
    {
      id: "cmmc-assessment-flow",
      name: "CMMC Assessment Flow",
      description: "Complete CMMC Level 2 gap assessment for organization",
      status: "pending",
      priority: "critical",
      category: "compliance",
      createdAt: now,
      updatedAt: now,
      metadata: { controls: 110, domains: 14 },
    },
    {
      id: "gateway-integration",
      name: "Gateway Integration",
      description: "Connect AI gateway to Brain AI for compliance screening",
      status: "pending",
      priority: "high",
      category: "integration",
      createdAt: now,
      updatedAt: now,
      metadata: { endpoint: "/api/gateway/stream" },
    },
  ];
}

// ─── In-memory task store ─────────────────────────────────────────────────

const taskStore = new Map<string, BrainAITask>();
let initialized = false;

function ensureInit(): void {
  if (initialized) return;
  for (const task of getDefaultTasks()) {
    taskStore.set(task.id, task);
  }
  initialized = true;
}

export function getAllTasks(): BrainAITask[] {
  ensureInit();
  return [...taskStore.values()];
}

export function getTask(id: string): BrainAITask | undefined {
  ensureInit();
  return taskStore.get(id);
}

export function createTask(task: Omit<BrainAITask, "id" | "createdAt" | "updatedAt">): BrainAITask {
  ensureInit();
  const now = Date.now();
  const id = `task-${now}-${Math.random().toString(36).slice(2, 6)}`;
  const newTask: BrainAITask = { ...task, id, createdAt: now, updatedAt: now };
  taskStore.set(id, newTask);
  return newTask;
}

export function updateTask(id: string, updates: Partial<BrainAITask>): BrainAITask | null {
  ensureInit();
  const existing = taskStore.get(id);
  if (!existing) return null;
  const updated: BrainAITask = { ...existing, ...updates, id, updatedAt: Date.now() };
  taskStore.set(id, updated);
  return updated;
}

export function deleteTask(id: string): boolean {
  ensureInit();
  return taskStore.delete(id);
}

export function getTasksByStatus(status: TaskStatus): BrainAITask[] {
  ensureInit();
  return [...taskStore.values()].filter((t) => t.status === status);
}

export function getTasksByCategory(category: BrainAITask["category"]): BrainAITask[] {
  ensureInit();
  return [...taskStore.values()].filter((t) => t.category === category);
}

export function getTaskSummary(): {
  total: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
  criticalPending: BrainAITask[];
} {
  ensureInit();
  const tasks = [...taskStore.values()];
  const byStatus = { pending: 0, in_progress: 0, complete: 0, skipped: 0, failed: 0 };
  const byPriority = { critical: 0, high: 0, medium: 0, low: 0 };

  for (const t of tasks) {
    byStatus[t.status]++;
    byPriority[t.priority]++;
  }

  return {
    total: tasks.length,
    byStatus,
    byPriority,
    criticalPending: tasks.filter((t) => t.priority === "critical" && t.status === "pending"),
  };
}
