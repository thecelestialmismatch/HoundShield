/**
 * Brain AI — System Init
 *
 * constructs the diagnostic startup
 * message that tells the agent about its tools, commands, and environment.
 */

import { renderCommandIndex } from "./commands";
import { renderToolIndex } from "./tools";

export interface SystemInitMessage {
  version: string;
  trustStatus: "trusted" | "untrusted" | "demo";
  commandCount: number;
  toolCount: number;
  sessionStoreType: "file" | "memory";
  body: string;
  timestamp: number;
}

export function buildSystemInitMessage(): SystemInitMessage {
  const version = "2.0.0";
  const trustStatus = process.env.NEXT_PUBLIC_SUPABASE_URL ? "trusted" : "demo";
  const sessionStoreType =
    process.env.NEXT_RUNTIME === "edge" ? "memory" : "file";

  const commandIndex = renderCommandIndex();
  const toolIndex = renderToolIndex();

  // Count entries
  const commandCount = (commandIndex.match(/^- \*\*/gm) ?? []).length;
  const toolCount = (toolIndex.match(/^- \*\*/gm) ?? []).length;

  const body = [
    `# Brain AI v${version} — Initialized`,
    "",
    `**Trust Status:** ${trustStatus}`,
    `**Session Store:** ${sessionStoreType}`,
    `**Runtime:** ${process.env.NEXT_RUNTIME ?? "nodejs"}`,
    `**Environment:** ${process.env.NODE_ENV ?? "development"}`,
    "",
    "## Capabilities",
    `- ${commandCount} slash commands registered`,
    `- ${toolCount} agent tools registered`,
    "- CMMC Level 2 compliance classification engine active",
    "- Real-time streaming via Server-Sent Events",
    "- File-based session persistence (survives restarts)",
    "",
    commandIndex,
    toolIndex,
    "",
    "## System Prompt",
    "You are Brain AI — the intelligent core of Hound Shield, the AI compliance firewall",
    "for defense contractors and regulated industries. You help users achieve CMMC Level 2,",
    "HIPAA, and SOC 2 compliance through intelligent guidance, threat analysis, and",
    "automated documentation.",
    "",
    "When users ask compliance questions, use your compliance-scan and knowledge-base tools.",
    "For research questions, use web-search. For technical questions, use code-execute (if permitted).",
  ].join("\n");

  return {
    version,
    trustStatus,
    commandCount,
    toolCount,
    sessionStoreType,
    body,
    timestamp: Date.now(),
  };
}

export function buildSystemPromptForSession(context?: string): string {
  const base = [
    "You are Brain AI — the intelligent core of Hound Shield.",
    "",
    "Your mission: help users achieve and maintain CMMC Level 2, HIPAA, and SOC 2 compliance.",
    "You are a compliance expert, security analyst, and technical advisor rolled into one.",
    "",
    "Capabilities you have:",
    "- CMMC Level 2 knowledge (all 110 NIST 800-171 Rev 2 controls)",
    "- CUI and PII detection patterns",
    "- SPRS score calculation methodology",
    "- Real-time threat classification",
    "- Web research for compliance guidance",
    "- Document analysis",
    "",
    "Always be direct, authoritative, and actionable. Compliance is not optional for defense contractors.",
    "When you identify a risk, tell the user exactly what to do about it.",
  ];

  if (context) {
    base.push("", "## Session Context", context);
  }

  return base.join("\n");
}
