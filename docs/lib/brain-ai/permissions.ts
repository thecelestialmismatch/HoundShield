/**
 * Brain AI — Permissions
 *
 * Permission management for tools, commands, and data access.
 * Brain AI original implementation for Hound Shield.
 */

export type PermissionLevel = "deny" | "ask" | "allow";

export interface PermissionRule {
  target: string;       // tool name, command name, or "*"
  targetType: "tool" | "command" | "data" | "api";
  level: PermissionLevel;
  reason?: string;
}

export interface PermissionContext {
  userId?: string;
  sessionId: string;
  subscriptionTier?: "free" | "pro" | "growth" | "enterprise" | "agency";
  isDemo?: boolean;
  allowedTools?: string[];
  deniedTools?: string[];
}

// Default permission rules by subscription tier
const TIER_TOOL_PERMISSIONS: Record<string, string[]> = {
  free: ["web-search", "compliance-scan", "knowledge-base"],
  pro: ["web-search", "web-browse", "compliance-scan", "knowledge-base", "file-analyze", "data-query"],
  growth: ["web-search", "web-browse", "compliance-scan", "knowledge-base", "file-analyze", "data-query", "generate-chart"],
  enterprise: ["web-search", "web-browse", "compliance-scan", "knowledge-base", "file-analyze", "data-query", "generate-chart", "code-execute"],
  agency: ["web-search", "web-browse", "compliance-scan", "knowledge-base", "file-analyze", "data-query", "generate-chart", "code-execute"],
};

// Always-denied tools regardless of tier
const ALWAYS_DENIED_TOOLS = new Set<string>([]);

// Always-allowed tools regardless of tier
const ALWAYS_ALLOWED_TOOLS = new Set(["compliance-scan", "knowledge-base"]);

export class PermissionManager {
  private rules: PermissionRule[] = [];
  private context: PermissionContext;

  constructor(context: PermissionContext) {
    this.context = context;
    this.initDefaultRules();
  }

  private initDefaultRules(): void {
    const tier = this.context.subscriptionTier ?? "free";
    const allowedTools = TIER_TOOL_PERMISSIONS[tier] ?? TIER_TOOL_PERMISSIONS.free;

    // Add allow rules for tier-permitted tools
    for (const tool of allowedTools) {
      this.rules.push({ target: tool, targetType: "tool", level: "allow" });
    }

    // Add allow rules for always-allowed tools
    for (const tool of ALWAYS_ALLOWED_TOOLS) {
      if (!this.rules.some((r) => r.target === tool)) {
        this.rules.push({ target: tool, targetType: "tool", level: "allow" });
      }
    }

    // Add deny rules for always-denied tools
    for (const tool of ALWAYS_DENIED_TOOLS) {
      this.rules.push({
        target: tool,
        targetType: "tool",
        level: "deny",
        reason: "This tool is not permitted in any context.",
      });
    }

    // Context overrides
    for (const tool of this.context.deniedTools ?? []) {
      this.rules.unshift({ target: tool, targetType: "tool", level: "deny" });
    }
    for (const tool of this.context.allowedTools ?? []) {
      this.rules.unshift({ target: tool, targetType: "tool", level: "allow" });
    }
  }

  checkTool(toolName: string): { allowed: boolean; reason?: string } {
    // Always-denied
    if (ALWAYS_DENIED_TOOLS.has(toolName)) {
      return { allowed: false, reason: "Tool is globally denied." };
    }

    // Always-allowed
    if (ALWAYS_ALLOWED_TOOLS.has(toolName)) {
      return { allowed: true };
    }

    // Demo mode: only basic tools
    if (this.context.isDemo) {
      const demoAllowed = new Set(["web-search", "compliance-scan", "knowledge-base"]);
      return {
        allowed: demoAllowed.has(toolName),
        reason: demoAllowed.has(toolName)
          ? undefined
          : `Tool '${toolName}' requires a paid subscription. Sign up at houndshield.com.`,
      };
    }

    // Check rules (first match wins)
    const match = this.rules.find((r) => r.target === toolName || r.target === "*");
    if (!match) {
      return { allowed: false, reason: `Tool '${toolName}' is not permitted for your plan.` };
    }

    return {
      allowed: match.level === "allow",
      reason: match.level === "deny" ? (match.reason ?? `Tool '${toolName}' is denied.`) : undefined,
    };
  }

  checkCommand(commandName: string): { allowed: boolean; reason?: string } {
    const match = this.rules.find(
      (r) => r.targetType === "command" && (r.target === commandName || r.target === "*")
    );
    if (!match) return { allowed: true }; // commands allowed by default
    return {
      allowed: match.level === "allow",
      reason: match.level === "deny" ? match.reason : undefined,
    };
  }

  getAllowedTools(): string[] {
    return this.rules
      .filter((r) => r.targetType === "tool" && r.level === "allow")
      .map((r) => r.target)
      .filter((t) => t !== "*");
  }

  addRule(rule: PermissionRule): void {
    this.rules.unshift(rule); // prepend so it takes priority
  }

  getContext(): PermissionContext {
    return this.context;
  }
}

export function createPermissionManager(context: PermissionContext): PermissionManager {
  return new PermissionManager(context);
}

export function defaultPermissionContext(sessionId: string): PermissionContext {
  return {
    sessionId,
    subscriptionTier: "free",
    isDemo: !process.env.NEXT_PUBLIC_SUPABASE_URL,
  };
}
