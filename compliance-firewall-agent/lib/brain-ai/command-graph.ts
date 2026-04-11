/**
 * Brain AI — Command Graph
 *
 * Organizes Brain AI commands into builtins, plugin-like, and skill-like categories.
 * Provides dependency resolution and execution ordering.
 * Brain AI original implementation for Kaelus.online.
 */

import { CommandSnapshot, loadCommandSnapshot } from "./commands";

export type CommandCategory = "builtin" | "plugin_like" | "skill_like";

export interface CommandGraphNode {
  command: CommandSnapshot;
  graphCategory: CommandCategory;
  weight: number; // Higher = shown first
}

export interface CommandGraph {
  builtins: CommandGraphNode[];
  pluginLike: CommandGraphNode[];
  skillLike: CommandGraphNode[];
  all: CommandGraphNode[];
}

// Command category classification rules
const BUILTIN_NAMES = new Set(["help", "scan", "assess", "report", "pricing", "demo"]);
const SKILL_LIKE_CATEGORIES = new Set(["compliance", "reports"]);

export function buildCommandGraph(): CommandGraph {
  const commands = loadCommandSnapshot();
  const nodes: CommandGraphNode[] = commands.map((cmd) => ({
    command: cmd,
    graphCategory: classifyCommand(cmd),
    weight: weightCommand(cmd),
  }));

  // Sort by weight descending within each category
  const sorted = [...nodes].sort((a, b) => b.weight - a.weight);

  return {
    builtins: sorted.filter((n) => n.graphCategory === "builtin"),
    pluginLike: sorted.filter((n) => n.graphCategory === "plugin_like"),
    skillLike: sorted.filter((n) => n.graphCategory === "skill_like"),
    all: sorted,
  };
}

function classifyCommand(cmd: CommandSnapshot): CommandCategory {
  if (BUILTIN_NAMES.has(cmd.name)) return "builtin";
  if (SKILL_LIKE_CATEGORIES.has(cmd.category)) return "skill_like";
  return "plugin_like";
}

function weightCommand(cmd: CommandSnapshot): number {
  // Critical compliance commands get highest weight
  const priorityNames: Record<string, number> = {
    assess: 100,
    report: 90,
    gaps: 85,
    scan: 80,
    sprs: 75,
    quarantine: 70,
    onboard: 65,
    tasks: 60,
    timeline: 55,
    team: 50,
    settings: 45,
    resources: 40,
    pricing: 30,
    demo: 20,
    help: 10,
  };
  return priorityNames[cmd.name] ?? 50;
}

export function renderCommandGraph(graph: CommandGraph): string {
  const lines = ["## Brain AI Command Graph\n"];

  if (graph.builtins.length > 0) {
    lines.push("### Built-in Commands");
    for (const n of graph.builtins) {
      lines.push(`- **/${n.command.name}** — ${n.command.description}`);
    }
    lines.push("");
  }

  if (graph.skillLike.length > 0) {
    lines.push("### Compliance Skills");
    for (const n of graph.skillLike) {
      lines.push(`- **/${n.command.name}** — ${n.command.description}`);
    }
    lines.push("");
  }

  if (graph.pluginLike.length > 0) {
    lines.push("### Navigation & Admin");
    for (const n of graph.pluginLike) {
      lines.push(`- **/${n.command.name}** — ${n.command.description}`);
    }
  }

  return lines.join("\n");
}

export function getTopCommands(n: number): CommandGraphNode[] {
  return buildCommandGraph().all.slice(0, n);
}
