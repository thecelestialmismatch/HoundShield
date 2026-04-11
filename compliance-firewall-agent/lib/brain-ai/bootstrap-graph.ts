/**
 * Brain AI — Bootstrap Graph
 *
 * Defines the 7-stage initialization graph for Brain AI startup.
 * Each stage has dependencies and a readiness check.
 * Brain AI original implementation for Kaelus.online.
 */

export type BootstrapStage =
  | "env_check"
  | "config_load"
  | "session_store"
  | "tool_pool"
  | "command_registry"
  | "classifier"
  | "agent_ready";

export interface BootstrapNode {
  stage: BootstrapStage;
  label: string;
  dependsOn: BootstrapStage[];
  status: "pending" | "running" | "done" | "failed";
  durationMs?: number;
  error?: string;
}

export interface BootstrapGraph {
  nodes: BootstrapNode[];
  startedAt: number;
  completedAt?: number;
  success: boolean;
}

const BOOTSTRAP_STAGES: BootstrapNode[] = [
  {
    stage: "env_check",
    label: "Environment Check",
    dependsOn: [],
    status: "pending",
  },
  {
    stage: "config_load",
    label: "Configuration Load",
    dependsOn: ["env_check"],
    status: "pending",
  },
  {
    stage: "session_store",
    label: "Session Store Init",
    dependsOn: ["config_load"],
    status: "pending",
  },
  {
    stage: "tool_pool",
    label: "Tool Pool Assembly",
    dependsOn: ["config_load"],
    status: "pending",
  },
  {
    stage: "command_registry",
    label: "Command Registry Load",
    dependsOn: ["config_load"],
    status: "pending",
  },
  {
    stage: "classifier",
    label: "Compliance Classifier",
    dependsOn: ["config_load"],
    status: "pending",
  },
  {
    stage: "agent_ready",
    label: "Brain AI Ready",
    dependsOn: ["session_store", "tool_pool", "command_registry", "classifier"],
    status: "pending",
  },
];

export function createBootstrapGraph(): BootstrapGraph {
  return {
    nodes: BOOTSTRAP_STAGES.map((n) => ({ ...n })),
    startedAt: Date.now(),
    success: false,
  };
}

export async function runBootstrapGraph(): Promise<BootstrapGraph> {
  const graph = createBootstrapGraph();
  const nodeMap = new Map(graph.nodes.map((n) => [n.stage, n]));

  async function runStage(node: BootstrapNode): Promise<void> {
    // Wait for all dependencies
    for (const dep of node.dependsOn) {
      const depNode = nodeMap.get(dep)!;
      if (depNode.status === "pending") await runStage(depNode);
      if (depNode.status === "failed") {
        node.status = "failed";
        node.error = `Dependency ${dep} failed`;
        return;
      }
    }

    node.status = "running";
    const start = Date.now();

    try {
      await executeStage(node.stage);
      node.status = "done";
      node.durationMs = Date.now() - start;
    } catch (err) {
      node.status = "failed";
      node.error = err instanceof Error ? err.message : String(err);
      node.durationMs = Date.now() - start;
    }
  }

  // Run all stages
  for (const node of graph.nodes) {
    if (node.status === "pending") await runStage(node);
  }

  graph.completedAt = Date.now();
  graph.success = graph.nodes.every((n) => n.status === "done");
  return graph;
}

async function executeStage(stage: BootstrapStage): Promise<void> {
  switch (stage) {
    case "env_check":
      if (typeof process === "undefined") throw new Error("No process");
      break;
    case "config_load":
      // Config is static defaults — always succeeds
      break;
    case "session_store":
      // Session store initializes on first use
      break;
    case "tool_pool": {
      const { loadToolSnapshot } = await import("./tools");
      loadToolSnapshot();
      break;
    }
    case "command_registry": {
      const { loadCommandSnapshot } = await import("./commands");
      loadCommandSnapshot();
      break;
    }
    case "classifier":
      // Classifier patterns are static — always ready
      break;
    case "agent_ready":
      // Final stage — just marks completion
      break;
  }
}

export function renderBootstrapGraph(graph: BootstrapGraph): string {
  const totalMs = graph.completedAt ? graph.completedAt - graph.startedAt : 0;
  const lines = [
    `## Brain AI Bootstrap (${totalMs}ms total)`,
    graph.success ? "✅ All stages complete" : "❌ Some stages failed",
    "",
  ];
  for (const node of graph.nodes) {
    const icon = node.status === "done" ? "✅" : node.status === "failed" ? "❌" : "⏳";
    const time = node.durationMs != null ? ` (${node.durationMs}ms)` : "";
    lines.push(`${icon} ${node.label}${time}${node.error ? ` — ${node.error}` : ""}`);
  }
  return lines.join("\n");
}
