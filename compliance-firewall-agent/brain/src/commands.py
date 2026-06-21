from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Literal

from .models import CommandExecution

CommandCategory = Literal["compliance", "agent", "reports", "admin", "navigation", "utility"]


@dataclass
class CommandSnapshot:
    name: str
    description: str
    source_hint: str
    category: CommandCategory
    requires_auth: bool


BUILTIN_COMMANDS: list[CommandSnapshot] = [
    CommandSnapshot(
        name="assess",
        description="Run a CMMC Level 2 compliance assessment for your organization",
        source_hint="/command-center/shield/assessment",
        category="compliance",
        requires_auth=True,
    ),
    CommandSnapshot(
        name="scan",
        description="Scan text or a document for CUI, PII, and compliance violations",
        source_hint="/api/scan",
        category="compliance",
        requires_auth=False,
    ),
    CommandSnapshot(
        name="report",
        description="Generate a PDF compliance report with SPRS score and gap analysis",
        source_hint="/api/reports/generate",
        category="reports",
        requires_auth=True,
    ),
    CommandSnapshot(
        name="gaps",
        description="Identify and prioritize compliance gaps mapped to CMMC domains",
        source_hint="/command-center/shield/gaps",
        category="compliance",
        requires_auth=True,
    ),
    CommandSnapshot(
        name="sprs",
        description="Calculate your SPRS (Supplier Performance Risk System) score",
        source_hint="/command-center/shield/assessment",
        category="compliance",
        requires_auth=True,
    ),
    CommandSnapshot(
        name="onboard",
        description="Start the CMMC onboarding wizard",
        source_hint="/command-center/shield/onboarding",
        category="navigation",
        requires_auth=True,
    ),
    CommandSnapshot(
        name="quarantine",
        description="Review quarantined AI requests flagged by the compliance firewall",
        source_hint="/command-center/quarantine",
        category="compliance",
        requires_auth=True,
    ),
    CommandSnapshot(
        name="timeline",
        description="View your CMMC compliance readiness timeline",
        source_hint="/command-center/timeline",
        category="compliance",
        requires_auth=True,
    ),
    CommandSnapshot(
        name="pricing",
        description="View Kaelus subscription plans and upgrade options",
        source_hint="/pricing",
        category="utility",
        requires_auth=False,
    ),
    CommandSnapshot(
        name="help",
        description="Get help and documentation for Brain AI capabilities",
        source_hint="/docs",
        category="utility",
        requires_auth=False,
    ),
    CommandSnapshot(
        name="demo",
        description="Run the Kaelus compliance firewall demo",
        source_hint="/demo",
        category="utility",
        requires_auth=False,
    ),
    CommandSnapshot(
        name="settings",
        description="Manage your account settings and API keys",
        source_hint="/command-center/settings",
        category="admin",
        requires_auth=True,
    ),
    CommandSnapshot(
        name="team",
        description="Manage team members and access controls",
        source_hint="/command-center/team",
        category="admin",
        requires_auth=True,
    ),
    CommandSnapshot(
        name="tasks",
        description="View and manage your compliance remediation tasks",
        source_hint="/command-center/tasks",
        category="compliance",
        requires_auth=True,
    ),
    CommandSnapshot(
        name="resources",
        description="Access CMMC Level 2 training resources and documentation",
        source_hint="/command-center/shield/resources",
        category="compliance",
        requires_auth=False,
    ),
]

_command_cache: list[CommandSnapshot] | None = None


def load_command_snapshot() -> list[CommandSnapshot]:
    global _command_cache
    if _command_cache is not None:
        return _command_cache
    _command_cache = BUILTIN_COMMANDS
    return _command_cache


def get_command(name: str) -> CommandSnapshot | None:
    target = name.lower().strip()
    return next((c for c in load_command_snapshot() if c.name == target), None)


def get_commands(names: list[str]) -> list[CommandSnapshot]:
    snapshot = load_command_snapshot()
    result = []
    for n in names:
        found = next((c for c in snapshot if c.name == n), None)
        if found:
            result.append(found)
    return result


def _tokenize(text: str) -> list[str]:
    return [t for t in re.split(r"\s+", text.lower()) if len(t) > 1]


def find_commands(query: str) -> list[CommandSnapshot]:
    tokens = _tokenize(query)
    snapshot = load_command_snapshot()
    result = []
    for cmd in snapshot:
        text = f"{cmd.name} {cmd.description} {cmd.category}".lower()
        if any(t in text for t in tokens):
            result.append(cmd)
    return result


def built_in_command_names() -> list[str]:
    return [c.name for c in load_command_snapshot()]


def execute_command(name: str, prompt: str) -> CommandExecution:
    cmd = get_command(name)
    if not cmd:
        return CommandExecution(
            name=name,
            source_hint="unknown",
            prompt=prompt,
            handled=False,
            message=f"Unknown command: {name}",
        )
    return CommandExecution(
        name=cmd.name,
        source_hint=cmd.source_hint,
        prompt=prompt,
        handled=True,
        message=f"Command /{cmd.name} → {cmd.source_hint}",
    )


def render_command_index() -> str:
    cmds = load_command_snapshot()
    lines = ["## Brain AI Commands\n"]
    categories: list[str] = []
    for c in cmds:
        if c.category not in categories:
            categories.append(c.category)
    for cat in categories:
        lines.append(f"### {cat[0].upper() + cat[1:]}")
        for cmd in [c for c in cmds if c.category == cat]:
            lines.append(f"- **/{cmd.name}** — {cmd.description}")
        lines.append("")
    return "\n".join(lines)


def score_command_match(cmd: CommandSnapshot, query: str) -> int:
    tokens = _tokenize(query)
    name_tokens = _tokenize(cmd.name)
    desc_tokens = _tokenize(cmd.description)
    score = 0
    for t in tokens:
        if t in name_tokens:
            score += 3
        elif any(t in d for d in desc_tokens):
            score += 1
    return score
