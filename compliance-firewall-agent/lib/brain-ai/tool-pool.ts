/**
 * Brain AI — Tool Pool
 *
 * Assembles the active tool pool from available tool snapshots,
 * applying permission filters and capability gating.
 * Brain AI original implementation for Kaelus.online.
 */

import { loadToolSnapshot, ToolSnapshot, filterToolsByPermission } from "./tools";
import { PermissionManager } from "./permissions";

export interface ToolPool {
  tools: ToolSnapshot[];
  allowedCategories: string[];
  blockedTools: string[];
  totalAvailable: number;
  totalBlocked: number;
}

export interface ToolPoolConfig {
  allowedCategories?: string[];
  blockedTools?: string[];
  permissionManager?: PermissionManager;
}

/**
 * Assemble the active tool pool for a given context.
 * Filters out tools the user doesn't have permission to use.
 */
export function assembleToolPool(config: ToolPoolConfig = {}): ToolPool {
  const allTools = loadToolSnapshot();
  const {
    allowedCategories = ["research", "compliance", "analysis", "knowledge", "visualization"],
    blockedTools = [],
    permissionManager,
  } = config;

  let available: ToolSnapshot[];

  if (permissionManager) {
    // Filter using permission manager
    available = allTools.filter((t) => {
      if (blockedTools.includes(t.name)) return false;
      return permissionManager.checkTool(t.name).allowed;
    });
  } else {
    // Filter by category and blocklist
    available = filterToolsByPermission(allowedCategories).filter(
      (t) => !blockedTools.includes(t.name)
    );
  }

  const blocked = allTools.filter((t) => !available.some((a) => a.name === t.name));

  return {
    tools: available,
    allowedCategories,
    blockedTools: blocked.map((t) => t.name),
    totalAvailable: available.length,
    totalBlocked: blocked.length,
  };
}

/**
 * Get the default tool pool (free tier — no code execution).
 */
export function getDefaultToolPool(): ToolPool {
  return assembleToolPool({
    allowedCategories: ["research", "compliance", "analysis", "knowledge", "visualization"],
    blockedTools: ["code-execute"],
  });
}

/**
 * Get the full tool pool (enterprise — all tools).
 */
export function getFullToolPool(): ToolPool {
  return assembleToolPool({
    allowedCategories: ["research", "compliance", "analysis", "knowledge", "visualization", "coding"],
    blockedTools: [],
  });
}

/**
 * Get tool names from a pool (convenience helper).
 */
export function poolToolNames(pool: ToolPool): string[] {
  return pool.tools.map((t) => t.name);
}

/**
 * Render tool pool as markdown summary.
 */
export function renderToolPool(pool: ToolPool): string {
  const lines = [
    `## Active Tool Pool (${pool.totalAvailable} tools)`,
    "",
  ];
  for (const tool of pool.tools) {
    lines.push(`- **${tool.name}** [${tool.category}] — ${tool.description}`);
  }
  if (pool.blockedTools.length > 0) {
    lines.push("", `### Blocked (${pool.totalBlocked}): ${pool.blockedTools.join(", ")}`);
  }
  return lines.join("\n");
}
