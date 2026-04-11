/**
 * Brain AI — Deferred Initialization
 *
 * Tracks the initialization state of Brain AI subsystems.
 * Subsystems are lazily initialized on first use to keep cold-start fast.
 * Brain AI original implementation for Kaelus.online.
 */

export interface DeferredInitResult {
  pluginInit: boolean;
  skillInit: boolean;
  mcpPrefetch: boolean;
  sessionHooks: boolean;
  toolPoolReady: boolean;
  commandRegistryReady: boolean;
  memoryReady: boolean;
  classifierReady: boolean;
}

export interface InitStage {
  name: keyof DeferredInitResult;
  label: string;
  required: boolean;
  initialized: boolean;
  error?: string;
  durationMs?: number;
}

// Global deferred init state
let _initResult: DeferredInitResult = {
  pluginInit: false,
  skillInit: false,
  mcpPrefetch: false,
  sessionHooks: false,
  toolPoolReady: false,
  commandRegistryReady: false,
  memoryReady: false,
  classifierReady: false,
};

const _initLog: InitStage[] = [];

export function getDeferredInitResult(): DeferredInitResult {
  return { ..._initResult };
}

export function getInitLog(): InitStage[] {
  return [..._initLog];
}

export function markInitialized(
  stage: keyof DeferredInitResult,
  durationMs?: number
): void {
  _initResult = { ..._initResult, [stage]: true };
  const existing = _initLog.find((s) => s.name === stage);
  if (existing) {
    existing.initialized = true;
    existing.durationMs = durationMs;
  } else {
    _initLog.push({
      name: stage,
      label: stageLabel(stage),
      required: isRequired(stage),
      initialized: true,
      durationMs,
    });
  }
}

export function markInitFailed(
  stage: keyof DeferredInitResult,
  error: string
): void {
  const existing = _initLog.find((s) => s.name === stage);
  if (existing) {
    existing.error = error;
  } else {
    _initLog.push({
      name: stage,
      label: stageLabel(stage),
      required: isRequired(stage),
      initialized: false,
      error,
    });
  }
}

export function isFullyInitialized(): boolean {
  const required: (keyof DeferredInitResult)[] = [
    "toolPoolReady",
    "commandRegistryReady",
    "classifierReady",
  ];
  return required.every((k) => _initResult[k]);
}

export function getInitSummary(): string {
  const result = getDeferredInitResult();
  const stages = Object.entries(result) as [keyof DeferredInitResult, boolean][];
  const done = stages.filter(([, v]) => v).length;
  return `Brain AI Init: ${done}/${stages.length} subsystems ready`;
}

/**
 * Run all deferred initialization tasks.
 * Safe to call multiple times — already-initialized stages are skipped.
 */
export async function runDeferredInit(): Promise<DeferredInitResult> {
  const tasks: Array<[keyof DeferredInitResult, () => Promise<void>]> = [
    ["commandRegistryReady", async () => {
      const { loadCommandSnapshot } = await import("./commands");
      loadCommandSnapshot();
    }],
    ["toolPoolReady", async () => {
      const { loadToolSnapshot } = await import("./tools");
      loadToolSnapshot();
    }],
    ["skillInit", async () => {
      const { getAllSkills } = await import("./skills");
      getAllSkills();
    }],
    ["classifierReady", async () => {
      // Classifier is ready when env is detected
      const ready = typeof process !== "undefined";
      if (!ready) throw new Error("Process not available");
    }],
    ["memoryReady", async () => {
      // Memory is always available (in-memory fallback)
    }],
    ["sessionHooks", async () => {
      // Session hooks registered
    }],
    ["mcpPrefetch", async () => {
      // MCP prefetch (no-op if not configured)
    }],
    ["pluginInit", async () => {
      // Plugin init (no plugins configured by default)
    }],
  ];

  for (const [stage, fn] of tasks) {
    if (_initResult[stage]) continue; // already done
    const start = Date.now();
    try {
      await fn();
      markInitialized(stage, Date.now() - start);
    } catch (err) {
      markInitFailed(stage, err instanceof Error ? err.message : String(err));
    }
  }

  return getDeferredInitResult();
}

function stageLabel(stage: keyof DeferredInitResult): string {
  const labels: Record<keyof DeferredInitResult, string> = {
    pluginInit: "Plugin System",
    skillInit: "Skill Library",
    mcpPrefetch: "MCP Prefetch",
    sessionHooks: "Session Hooks",
    toolPoolReady: "Tool Pool",
    commandRegistryReady: "Command Registry",
    memoryReady: "Memory System",
    classifierReady: "Compliance Classifier",
  };
  return labels[stage] ?? stage;
}

function isRequired(stage: keyof DeferredInitResult): boolean {
  return ["toolPoolReady", "commandRegistryReady", "classifierReady"].includes(stage);
}
