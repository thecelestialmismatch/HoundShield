/**
 * Brain AI — Command Registry
 *
 * adapted for Hound Shield slash-commands.
 * Manages discovery, routing, and execution of Brain AI commands.
 */

import { CommandExecution } from "./models";

export interface CommandSnapshot {
  name: string;
  description: string;
  sourceHint: string;
  category: "compliance" | "agent" | "reports" | "admin" | "navigation" | "utility";
  requiresAuth: boolean;
}

// ─── Built-in Hound Shield Brain AI commands ───────────────────────────────────

const BUILTIN_COMMANDS: CommandSnapshot[] = [
  {
    name: "assess",
    description: "Run a CMMC Level 2 compliance assessment for your organization",
    sourceHint: "/command-center/shield/assessment",
    category: "compliance",
    requiresAuth: true,
  },
  {
    name: "scan",
    description: "Scan text or a document for CUI, PII, and compliance violations",
    sourceHint: "/api/scan",
    category: "compliance",
    requiresAuth: false,
  },
  {
    name: "report",
    description: "Generate a PDF compliance report with SPRS score and gap analysis",
    sourceHint: "/api/reports/generate",
    category: "reports",
    requiresAuth: true,
  },
  {
    name: "gaps",
    description: "Identify and prioritize compliance gaps mapped to CMMC domains",
    sourceHint: "/command-center/shield/gaps",
    category: "compliance",
    requiresAuth: true,
  },
  {
    name: "sprs",
    description: "Calculate your SPRS (Supplier Performance Risk System) score",
    sourceHint: "/command-center/shield/assessment",
    category: "compliance",
    requiresAuth: true,
  },
  {
    name: "onboard",
    description: "Start the CMMC onboarding wizard",
    sourceHint: "/command-center/shield/onboarding",
    category: "navigation",
    requiresAuth: true,
  },
  {
    name: "quarantine",
    description: "Review quarantined AI requests flagged by the compliance firewall",
    sourceHint: "/command-center/quarantine",
    category: "compliance",
    requiresAuth: true,
  },
  {
    name: "timeline",
    description: "View your CMMC compliance readiness timeline",
    sourceHint: "/command-center/timeline",
    category: "compliance",
    requiresAuth: true,
  },
  {
    name: "pricing",
    description: "View Hound Shield subscription plans and upgrade options",
    sourceHint: "/pricing",
    category: "utility",
    requiresAuth: false,
  },
  {
    name: "help",
    description: "Get help and documentation for Brain AI capabilities",
    sourceHint: "/docs",
    category: "utility",
    requiresAuth: false,
  },
  {
    name: "demo",
    description: "Run the Hound Shield compliance firewall demo",
    sourceHint: "/demo",
    category: "utility",
    requiresAuth: false,
  },
  {
    name: "settings",
    description: "Manage your account settings and API keys",
    sourceHint: "/command-center/settings",
    category: "admin",
    requiresAuth: true,
  },
  {
    name: "team",
    description: "Manage team members and access controls",
    sourceHint: "/command-center/team",
    category: "admin",
    requiresAuth: true,
  },
  {
    name: "tasks",
    description: "View and manage your compliance remediation tasks",
    sourceHint: "/command-center/tasks",
    category: "compliance",
    requiresAuth: true,
  },
  {
    name: "resources",
    description: "Access CMMC Level 2 training resources and documentation",
    sourceHint: "/command-center/shield/resources",
    category: "compliance",
    requiresAuth: false,
  },
];

// ─── In-memory command registry ───────────────────────────────────────────

let commandCache: CommandSnapshot[] | null = null;

export function loadCommandSnapshot(): CommandSnapshot[] {
  if (commandCache) return commandCache;
  commandCache = BUILTIN_COMMANDS;
  return commandCache;
}

export function getCommand(name: string): CommandSnapshot | undefined {
  return loadCommandSnapshot().find((c) => c.name === name.toLowerCase().trim());
}

export function getCommands(names: string[]): CommandSnapshot[] {
  const snapshot = loadCommandSnapshot();
  return names.map((n) => snapshot.find((c) => c.name === n)).filter(Boolean) as CommandSnapshot[];
}

export function findCommands(query: string): CommandSnapshot[] {
  const tokens = tokenize(query);
  const snapshot = loadCommandSnapshot();
  return snapshot.filter((cmd) => {
    const text = `${cmd.name} ${cmd.description} ${cmd.category}`.toLowerCase();
    return tokens.some((t) => text.includes(t));
  });
}

export function builtInCommandNames(): string[] {
  return loadCommandSnapshot().map((c) => c.name);
}

export function executeCommand(
  name: string,
  prompt: string
): CommandExecution {
  const cmd = getCommand(name);
  if (!cmd) {
    return {
      name,
      sourceHint: "unknown",
      prompt,
      handled: false,
      message: `Unknown command: ${name}`,
    };
  }
  return {
    name: cmd.name,
    sourceHint: cmd.sourceHint,
    prompt,
    handled: true,
    message: `Command /${cmd.name} → ${cmd.sourceHint}`,
  };
}

export function renderCommandIndex(): string {
  const cmds = loadCommandSnapshot();
  const lines = ["## Brain AI Commands\n"];
  const categories = [...new Set(cmds.map((c) => c.category))];
  for (const cat of categories) {
    lines.push(`### ${cat.charAt(0).toUpperCase() + cat.slice(1)}`);
    for (const cmd of cmds.filter((c) => c.category === cat)) {
      lines.push(`- **/${cmd.name}** — ${cmd.description}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

// ─── Utilities ────────────────────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
}

export function scoreCommandMatch(cmd: CommandSnapshot, query: string): number {
  const tokens = tokenize(query);
  const nameTokens = tokenize(cmd.name);
  const descTokens = tokenize(cmd.description);
  let score = 0;
  for (const t of tokens) {
    if (nameTokens.includes(t)) score += 3;
    else if (descTokens.some((d) => d.includes(t))) score += 1;
  }
  return score;
}
