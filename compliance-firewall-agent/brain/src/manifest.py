from __future__ import annotations

import time
from datetime import datetime, timezone

from .models import PortManifest, Subsystem

KAELUS_SUBSYSTEMS: list[Subsystem] = [
    Subsystem(
        name="Brain AI",
        path="lib/brain-ai/",
        file_count=9,
        notes="Query engine, session store, runtime, commands, tools — the intelligent core",
    ),
    Subsystem(
        name="Agent Orchestrator",
        path="lib/agent/",
        file_count=6,
        notes="ReAct loop, tool registry, memory, MemoryDNA — the execution engine",
    ),
    Subsystem(
        name="Compliance Gateway",
        path="lib/gateway/",
        file_count=4,
        notes="Stream proxy, event bus, WebSocket handler — AI traffic firewall",
    ),
    Subsystem(
        name="Compliance Classifier",
        path="lib/classifier/",
        file_count=5,
        notes="Risk engine, CUI/PII/CMMC/HIPAA patterns — 16+ detection signatures",
    ),
    Subsystem(
        name="Dashboard (Command Center)",
        path="app/command-center/",
        file_count=18,
        notes="Assessment, gaps, reports, quarantine, realtime, settings, team, tasks, timeline",
    ),
    Subsystem(
        name="API Routes",
        path="app/api/",
        file_count=15,
        notes="Agent execute, gateway stream, brain-ai, reports, scan, stripe webhook, auth",
    ),
    Subsystem(
        name="Landing & Marketing",
        path="app/",
        file_count=12,
        notes="Homepage, pricing, features, docs, HIPAA, partners, contact, demo pages",
    ),
    Subsystem(
        name="Components",
        path="components/",
        file_count=35,
        notes="Landing, dashboard, UI primitives, Logo, Navbar, PostHogProvider, ClientShell",
    ),
    Subsystem(
        name="Client SDK",
        path="sdk/",
        file_count=2,
        notes="@kaelus/sdk — zero-dependency client for gateway consumers",
    ),
    Subsystem(
        name="Compliance Brain (Local GPT)",
        path="brain/",
        file_count=2,
        notes="Karpathy microGPT trained on NIST 800-171 Rev 2 — zero API cost inference",
    ),
    Subsystem(
        name="Database Migrations",
        path="supabase/migrations/",
        file_count=4,
        notes="001-004: initial schema, shieldready, profiles/subscriptions, compliance logs",
    ),
    Subsystem(
        name="Infrastructure",
        path=".",
        file_count=8,
        notes="next.config.js, server.ts, middleware.ts, docker-compose.yml, Dockerfile",
    ),
]


def build_port_manifest() -> PortManifest:
    total_files = sum(s.file_count for s in KAELUS_SUBSYSTEMS)
    return PortManifest(
        project_name="Kaelus.online — Brain AI",
        subsystems=KAELUS_SUBSYSTEMS,
        total_files=total_files,
        generated_at=int(time.time() * 1000),
    )


def manifest_to_markdown(manifest: PortManifest) -> str:
    generated = datetime.fromtimestamp(manifest.generated_at / 1000, tz=timezone.utc).isoformat()
    lines = [
        f"# {manifest.project_name}",
        f"*Generated: {generated}*",
        f"*Total files: {manifest.total_files}*",
        "",
        "## Subsystems",
        "",
    ]

    for sys_ in manifest.subsystems:
        lines.append(f"### {sys_.name}")
        lines.append(f"- **Path:** `{sys_.path}`")
        lines.append(f"- **Files:** {sys_.file_count}")
        lines.append(f"- **Notes:** {sys_.notes}")
        lines.append("")

    lines.append("## Architecture Summary")
    lines.append("")
    lines.append("```")
    lines.append("User Request")
    lines.append("    ↓")
    lines.append("Brain AI Runtime (routing + scoring)")
    lines.append("    ↓")
    lines.append("QueryEnginePort (turn management + session persistence)")
    lines.append("    ↓")
    lines.append("Agent Orchestrator (ReAct loop)")
    lines.append("    ├── Tool Registry (8 tools)")
    lines.append("    ├── Compliance Classifier (16+ patterns)")
    lines.append("    └── OpenRouter (13 free + 5 paid models)")
    lines.append("    ↓")
    lines.append("Session Store (file-based JSON, survives restarts)")
    lines.append("    ↓")
    lines.append("SSE Stream → Client")
    lines.append("```")

    return "\n".join(lines)


def get_subsystem(name: str) -> Subsystem | None:
    return next((s for s in KAELUS_SUBSYSTEMS if s.name.lower() == name.lower()), None)


def get_subsystem_by_path(path: str) -> Subsystem | None:
    return next((s for s in KAELUS_SUBSYSTEMS if path.startswith(s.path)), None)
