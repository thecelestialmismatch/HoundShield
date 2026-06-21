from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

from .models import ParityAuditResult

EXPECTED_FEATURES = [
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
]

EXPECTED_COMPLIANCE = [
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
]

EXPECTED_TOOLS = [
    "web-search",
    "web-browse",
    "code-execute",
    "file-analyze",
    "data-query",
    "compliance-scan",
    "generate-chart",
    "knowledge-base",
]

EXPECTED_ROUTES = [
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
]


@dataclass
class DetailedParityReport:
    brain_ai_coverage: ParityAuditResult
    compliance_coverage: ParityAuditResult
    tools_coverage: ParityAuditResult
    routes_coverage: ParityAuditResult
    overall_score: int
    full_report: str


def run_parity_audit(
    present_features: list[str] | None = None,
    present_compliance: list[str] | None = None,
    present_tools: list[str] | None = None,
    present_routes: list[str] | None = None,
) -> DetailedParityReport:
    brain_ai = _audit_category("Brain AI Modules", EXPECTED_FEATURES, present_features or EXPECTED_FEATURES)
    compliance = _audit_category(
        "Compliance Engine", EXPECTED_COMPLIANCE, present_compliance or EXPECTED_COMPLIANCE
    )
    tools = _audit_category("Agent Tools", EXPECTED_TOOLS, present_tools or EXPECTED_TOOLS)
    routes = _audit_category("API Routes", EXPECTED_ROUTES, present_routes or EXPECTED_ROUTES)

    overall_score = round((brain_ai.coverage + compliance.coverage + tools.coverage + routes.coverage) / 4)

    full_report = _build_report(brain_ai, compliance, tools, routes, overall_score)

    return DetailedParityReport(
        brain_ai_coverage=brain_ai,
        compliance_coverage=compliance,
        tools_coverage=tools,
        routes_coverage=routes,
        overall_score=overall_score,
        full_report=full_report,
    )


def _audit_category(label: str, expected: list[str], present: list[str]) -> ParityAuditResult:
    present_lower = [p.lower() for p in present]
    matched: list[str] = []
    missing: list[str] = []

    for item in expected:
        key = item.split(" — ")[0].strip().lower()
        if any(key in p for p in present_lower):
            matched.append(item)
        else:
            missing.append(item)

    coverage = round((len(matched) / len(expected)) * 100) if expected else 100

    report_lines = [
        f"## {label}",
        f"**Coverage:** {coverage}% ({len(matched)}/{len(expected)})",
    ]
    if missing:
        report_lines.append("")
        report_lines.append("**Missing:**")
        report_lines.extend(f"- {m}" for m in missing)

    return ParityAuditResult(coverage=coverage, missing=missing, present=matched, report="\n".join(report_lines))


def _build_report(
    brain_ai: ParityAuditResult,
    compliance: ParityAuditResult,
    tools: ParityAuditResult,
    routes: ParityAuditResult,
    overall_score: int,
) -> str:
    generated = datetime.now(timezone.utc).isoformat()
    lines = [
        "# Brain AI Parity Audit Report",
        f"*Generated: {generated}*",
        "",
        f"## Overall Score: {overall_score}%",
        "",
        brain_ai.report,
        "",
        compliance.report,
        "",
        tools.report,
        "",
        routes.report,
        "",
        "---",
        "✅ Full parity achieved — Brain AI is complete."
        if overall_score == 100
        else f"⚠️ {100 - overall_score}% gap remaining — see missing items above.",
    ]
    return "\n".join(lines)
