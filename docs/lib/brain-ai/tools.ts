/**
 * Brain AI — Tool Adapter
 *
 * wraps Hound Shield's existing ToolRegistry
 * with snapshot export, scoring, and permission filtering.
 */

import { ToolExecution } from "./models";

export interface ToolSnapshot {
  name: string;
  description: string;
  category: string;
  requiresPermission: boolean;
  sourceHint: string;
}

let toolSnapshotCache: ToolSnapshot[] | null = null;

export function loadToolSnapshot(): ToolSnapshot[] {
  if (toolSnapshotCache) return toolSnapshotCache;

  // Dynamically build from the existing ToolRegistry
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { toolRegistry } = require("../agent/tools/index");
    const manifest = toolRegistry.getManifest() as Array<{
      name: string;
      description: string;
      category: string;
    }>;
    toolSnapshotCache = manifest.map((t) => ({
      name: t.name,
      description: t.description,
      category: t.category,
      requiresPermission: false,
      sourceHint: `lib/agent/tools/${t.name}.ts`,
    }));
  } catch {
    // Fallback static list if registry unavailable
    toolSnapshotCache = DEFAULT_TOOL_SNAPSHOTS;
  }

  return toolSnapshotCache;
}

const DEFAULT_TOOL_SNAPSHOTS: ToolSnapshot[] = [
  {
    name: "web-search",
    description: "Search the web using DuckDuckGo — returns titles, URLs, and snippets",
    category: "research",
    requiresPermission: false,
    sourceHint: "lib/agent/tools/web-search.ts",
  },
  {
    name: "web-browse",
    description: "Fetch and extract content from a URL — returns markdown text",
    category: "research",
    requiresPermission: false,
    sourceHint: "lib/agent/tools/web-browse.ts",
  },
  {
    name: "compliance-scan",
    description: "Scan text for CUI, PII, and CMMC/HIPAA compliance violations",
    category: "compliance",
    requiresPermission: false,
    sourceHint: "lib/classifier/risk-engine.ts",
  },
  {
    name: "code-execute",
    description: "Execute JavaScript code in a sandboxed environment",
    category: "coding",
    requiresPermission: true,
    sourceHint: "lib/agent/tools/code-execute.ts",
  },
  {
    name: "file-analyze",
    description: "Parse and analyze JSON, CSV, or Markdown files",
    category: "analysis",
    requiresPermission: false,
    sourceHint: "lib/agent/tools/file-analyze.ts",
  },
  {
    name: "data-query",
    description: "Run SQL-like queries on local JSON data",
    category: "analysis",
    requiresPermission: false,
    sourceHint: "lib/agent/tools/data-query.ts",
  },
  {
    name: "generate-chart",
    description: "Create Chart.js-compatible visualization data",
    category: "visualization",
    requiresPermission: false,
    sourceHint: "lib/agent/tools/generate-chart.ts",
  },
  {
    name: "knowledge-base",
    description: "Store, retrieve, and search RAG-style documents",
    category: "knowledge",
    requiresPermission: false,
    sourceHint: "lib/agent/tools/knowledge-base.ts",
  },
];

// ─── API ──────────────────────────────────────────────────────────────────

export function getTool(name: string): ToolSnapshot | undefined {
  return loadToolSnapshot().find((t) => t.name === name);
}

export function getTools(names: string[]): ToolSnapshot[] {
  const snapshot = loadToolSnapshot();
  return names.map((n) => snapshot.find((t) => t.name === n)).filter(Boolean) as ToolSnapshot[];
}

export function toolNames(): string[] {
  return loadToolSnapshot().map((t) => t.name);
}

export function findTools(query: string): ToolSnapshot[] {
  const tokens = tokenize(query);
  return loadToolSnapshot().filter((tool) => {
    const text = `${tool.name} ${tool.description} ${tool.category}`.toLowerCase();
    return tokens.some((t) => text.includes(t));
  });
}

export function filterToolsByPermission(
  allowedCategories: string[]
): ToolSnapshot[] {
  return loadToolSnapshot().filter(
    (t) => !t.requiresPermission || allowedCategories.includes(t.category)
  );
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  prompt: string
): Promise<ToolExecution> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { toolRegistry } = require("../agent/tools/index");
    const result = await toolRegistry.execute(name, args);
    return {
      name,
      category: getTool(name)?.category ?? "unknown",
      prompt,
      handled: true,
      result,
    };
  } catch (err) {
    return {
      name,
      category: "unknown",
      prompt,
      handled: false,
      result: { error: err instanceof Error ? err.message : String(err) },
    };
  }
}

export function renderToolIndex(): string {
  const tools = loadToolSnapshot();
  const lines = ["## Brain AI Tools\n"];
  const categories = [...new Set(tools.map((t) => t.category))];
  for (const cat of categories) {
    lines.push(`### ${cat.charAt(0).toUpperCase() + cat.slice(1)}`);
    for (const t of tools.filter((x) => x.category === cat)) {
      lines.push(`- **${t.name}** — ${t.description}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

export function scoreToolMatch(tool: ToolSnapshot, query: string): number {
  const tokens = tokenize(query);
  const nameTokens = tokenize(tool.name);
  const descTokens = tokenize(tool.description);
  let score = 0;
  for (const t of tokens) {
    if (nameTokens.includes(t)) score += 3;
    else if (descTokens.some((d) => d.includes(t))) score += 1;
    if (t === tool.category) score += 2;
  }
  return score;
}

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
}
