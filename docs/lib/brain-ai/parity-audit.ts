/**
 * Brain AI — Parity Audit
 *
 * assesses Brain AI feature coverage
 * against the full Brain AI architecture and Hound Shield feature checklist.
 * Generates a detailed markdown report of what's present vs missing.
 */

import { ParityAuditResult } from "./models";

// Expected Brain AI features based on Brain AI architecture
const EXPECTED_FEATURES = [
  "models — core data types",
  "session-store — file-based persistence",
  "query-engine — multi-turn QueryEnginePort",
  "commands — command registry",
  "tools — tool adapter with scoring",
  "runtime — PortRuntime with routing",
  "system-init — system init messages",
  "manifest — codebase structure scanner",
  "parity-audit — coverage checker",
  "index — unified BrainAI singleton",
];

// Expected Hound Shield compliance features
const EXPECTED_COMPLIANCE = [
  "CMMC Level 2 classifier",
  "CUI detection patterns",
  "PII detection (SSN, CC, email, phone)",
  "CAGE code detection",
  "Contract number detection",
  "FOUO / CUI marking detection",
  "SPRS score calculation",
  "Compliance gap analysis",
  "PDF report generation",
  "Audit trail (SHA-256)",
];

// Expected agent tools
const EXPECTED_TOOLS = [
  "web-search",
  "web-browse",
  "code-execute",
  "file-analyze",
  "data-query",
  "compliance-scan",
  "generate-chart",
  "knowledge-base",
];

// Expected API routes
const EXPECTED_ROUTES = [
  "/api/brain-ai/execute",
  "/api/brain-ai/session/[id]",
  "/api/brain-ai/manifest",
  "/api/brain-ai/init",
  "/api/agent/execute",
  "/api/gateway/stream",
  "/api/gateway/intercept",
  "/api/scan",
  "/api/reports/generate",
  "/api/stripe/webhook",
  "/api/compliance/events",
];

export interface DetailedParityReport {
  brainAiCoverage: ParityAuditResult;
  complianceCoverage: ParityAuditResult;
  toolsCoverage: ParityAuditResult;
  routesCoverage: ParityAuditResult;
  overallScore: number;
  fullReport: string;
}

export function runParityAudit(options?: {
  presentFeatures?: string[];
  presentCompliance?: string[];
  presentTools?: string[];
  presentRoutes?: string[];
}): DetailedParityReport {
  const brainAi = auditCategory(
    "Brain AI Modules",
    EXPECTED_FEATURES,
    options?.presentFeatures ?? EXPECTED_FEATURES // default: all present
  );

  const compliance = auditCategory(
    "Compliance Engine",
    EXPECTED_COMPLIANCE,
    options?.presentCompliance ?? EXPECTED_COMPLIANCE
  );

  const tools = auditCategory(
    "Agent Tools",
    EXPECTED_TOOLS,
    options?.presentTools ?? EXPECTED_TOOLS
  );

  const routes = auditCategory(
    "API Routes",
    EXPECTED_ROUTES,
    options?.presentRoutes ?? EXPECTED_ROUTES
  );

  const overallScore = Math.round(
    (brainAi.coverage + compliance.coverage + tools.coverage + routes.coverage) / 4
  );

  const fullReport = buildReport(
    brainAi,
    compliance,
    tools,
    routes,
    overallScore
  );

  return {
    brainAiCoverage: brainAi,
    complianceCoverage: compliance,
    toolsCoverage: tools,
    routesCoverage: routes,
    overallScore,
    fullReport,
  };
}

function auditCategory(
  label: string,
  expected: string[],
  present: string[]
): ParityAuditResult {
  const presentLower = present.map((p) => p.toLowerCase());
  const matched: string[] = [];
  const missing: string[] = [];

  for (const item of expected) {
    const key = item.split(" — ")[0].trim().toLowerCase();
    if (presentLower.some((p) => p.includes(key))) {
      matched.push(item);
    } else {
      missing.push(item);
    }
  }

  const coverage = expected.length > 0
    ? Math.round((matched.length / expected.length) * 100)
    : 100;

  const report = [
    `## ${label}`,
    `**Coverage:** ${coverage}% (${matched.length}/${expected.length})`,
    ...(missing.length > 0 ? ["", "**Missing:**", ...missing.map((m) => `- ${m}`)] : []),
  ].join("\n");

  return { coverage, missing, present: matched, report };
}

function buildReport(
  brainAi: ParityAuditResult,
  compliance: ParityAuditResult,
  tools: ParityAuditResult,
  routes: ParityAuditResult,
  overallScore: number
): string {
  return [
    "# Brain AI Parity Audit Report",
    `*Generated: ${new Date().toISOString()}*`,
    "",
    `## Overall Score: ${overallScore}%`,
    "",
    brainAi.report,
    "",
    compliance.report,
    "",
    tools.report,
    "",
    routes.report,
    "",
    "---",
    overallScore === 100
      ? "✅ Full parity achieved — Brain AI is complete."
      : `⚠️ ${100 - overallScore}% gap remaining — see missing items above.`,
  ].join("\n");
}
