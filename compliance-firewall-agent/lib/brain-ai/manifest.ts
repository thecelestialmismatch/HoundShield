/**
 * Brain AI — Port Manifest
 *
 * scans the Hound Shield codebase
 * structure and generates a human-readable subsystem manifest.
 * Gives Brain AI "knowledge of itself" — its own architecture.
 */

import { Subsystem, PortManifest } from "./models";

// Static manifest of Hound Shield subsystems (matches actual codebase structure)
const HOUNDSHIELD_SUBSYSTEMS: Subsystem[] = [
  {
    name: "Brain AI",
    path: "lib/brain-ai/",
    fileCount: 9,
    notes: "Query engine, session store, runtime, commands, tools — the intelligent core",
  },
  {
    name: "Agent Orchestrator",
    path: "lib/agent/",
    fileCount: 6,
    notes: "ReAct loop, tool registry, memory, MemoryDNA — the execution engine",
  },
  {
    name: "Compliance Gateway",
    path: "lib/gateway/",
    fileCount: 4,
    notes: "Stream proxy, event bus, WebSocket handler — AI traffic firewall",
  },
  {
    name: "Compliance Classifier",
    path: "lib/classifier/",
    fileCount: 5,
    notes: "Risk engine, CUI/PII/CMMC/HIPAA patterns — 16+ detection signatures",
  },
  {
    name: "Dashboard (Command Center)",
    path: "app/command-center/",
    fileCount: 18,
    notes: "Assessment, gaps, reports, quarantine, realtime, settings, team, tasks, timeline",
  },
  {
    name: "API Routes",
    path: "app/api/",
    fileCount: 15,
    notes: "Agent execute, gateway stream, brain-ai, reports, scan, stripe webhook, auth",
  },
  {
    name: "Landing & Marketing",
    path: "app/",
    fileCount: 12,
    notes: "Homepage, pricing, features, docs, HIPAA, partners, contact, demo pages",
  },
  {
    name: "Components",
    path: "components/",
    fileCount: 35,
    notes: "Landing, dashboard, UI primitives, Logo, Navbar, PostHogProvider, ClientShell",
  },
  {
    name: "Client SDK",
    path: "sdk/",
    fileCount: 2,
    notes: "@houndshield/sdk — zero-dependency client for gateway consumers",
  },
  {
    name: "Compliance Brain (Local GPT)",
    path: "brain/",
    fileCount: 2,
    notes: "Karpathy microGPT trained on NIST 800-171 Rev 2 — zero API cost inference",
  },
  {
    name: "Database Migrations",
    path: "supabase/migrations/",
    fileCount: 4,
    notes: "001-004: initial schema, shieldready, profiles/subscriptions, compliance logs",
  },
  {
    name: "Infrastructure",
    path: ".",
    fileCount: 8,
    notes: "next.config.js, server.ts, middleware.ts, docker-compose.yml, Dockerfile",
  },
];

export function buildPortManifest(): PortManifest {
  const totalFiles = HOUNDSHIELD_SUBSYSTEMS.reduce((sum, s) => sum + s.fileCount, 0);
  return {
    projectName: "Hound Shield — Brain AI",
    subsystems: HOUNDSHIELD_SUBSYSTEMS,
    totalFiles,
    generatedAt: Date.now(),
  };
}

export function manifestToMarkdown(manifest: PortManifest): string {
  const lines = [
    `# ${manifest.projectName}`,
    `*Generated: ${new Date(manifest.generatedAt).toISOString()}*`,
    `*Total files: ${manifest.totalFiles}*`,
    "",
    "## Subsystems",
    "",
  ];

  for (const sys of manifest.subsystems) {
    lines.push(`### ${sys.name}`);
    lines.push(`- **Path:** \`${sys.path}\``);
    lines.push(`- **Files:** ${sys.fileCount}`);
    lines.push(`- **Notes:** ${sys.notes}`);
    lines.push("");
  }

  lines.push("## Architecture Summary");
  lines.push("");
  lines.push("```");
  lines.push("User Request");
  lines.push("    ↓");
  lines.push("Brain AI Runtime (routing + scoring)");
  lines.push("    ↓");
  lines.push("QueryEnginePort (turn management + session persistence)");
  lines.push("    ↓");
  lines.push("Agent Orchestrator (ReAct loop)");
  lines.push("    ├── Tool Registry (8 tools)");
  lines.push("    ├── Compliance Classifier (16+ patterns)");
  lines.push("    └── OpenRouter (13 free + 5 paid models)");
  lines.push("    ↓");
  lines.push("Session Store (file-based JSON, survives restarts)");
  lines.push("    ↓");
  lines.push("SSE Stream → Client");
  lines.push("```");

  return lines.join("\n");
}

export function getSubsystem(name: string): Subsystem | undefined {
  return HOUNDSHIELD_SUBSYSTEMS.find(
    (s) => s.name.toLowerCase() === name.toLowerCase()
  );
}

export function getSubsystemByPath(path: string): Subsystem | undefined {
  return HOUNDSHIELD_SUBSYSTEMS.find((s) => path.startsWith(s.path));
}
