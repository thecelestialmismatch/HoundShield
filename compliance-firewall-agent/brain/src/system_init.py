from __future__ import annotations

import os
import re
import time
from dataclasses import dataclass
from typing import Literal

from .commands import render_command_index
from .tools import render_tool_index

TrustStatus = Literal["trusted", "untrusted", "demo"]
SessionStoreType = Literal["file", "memory"]


@dataclass
class SystemInitMessage:
    version: str
    trust_status: TrustStatus
    command_count: int
    tool_count: int
    session_store_type: SessionStoreType
    body: str
    timestamp: int


def build_system_init_message() -> SystemInitMessage:
    version = "2.0.0"
    trust_status: TrustStatus = "trusted" if os.environ.get("NEXT_PUBLIC_SUPABASE_URL") else "demo"
    session_store_type: SessionStoreType = "memory" if os.environ.get("NEXT_RUNTIME") == "edge" else "file"

    command_index = render_command_index()
    tool_index = render_tool_index()

    command_count = len(re.findall(r"^- \*\*", command_index, flags=re.MULTILINE))
    tool_count = len(re.findall(r"^- \*\*", tool_index, flags=re.MULTILINE))

    body = "\n".join(
        [
            f"# Brain AI v{version} — Initialized",
            "",
            f"**Trust Status:** {trust_status}",
            f"**Session Store:** {session_store_type}",
            f"**Runtime:** {os.environ.get('NEXT_RUNTIME') or 'nodejs'}",
            f"**Environment:** {os.environ.get('NODE_ENV') or 'development'}",
            "",
            "## Capabilities",
            f"- {command_count} slash commands registered",
            f"- {tool_count} agent tools registered",
            "- CMMC Level 2 compliance classification engine active",
            "- Real-time streaming via Server-Sent Events",
            "- File-based session persistence (survives restarts)",
            "",
            command_index,
            tool_index,
            "",
            "## System Prompt",
            "You are Brain AI — the intelligent core of Kaelus.online, the AI compliance firewall",
            "for defense contractors and regulated industries. You help users achieve CMMC Level 2,",
            "HIPAA, and SOC 2 compliance through intelligent guidance, threat analysis, and",
            "automated documentation.",
            "",
            "When users ask compliance questions, use your compliance-scan and knowledge-base tools.",
            "For research questions, use web-search. For technical questions, use code-execute (if permitted).",
        ]
    )

    return SystemInitMessage(
        version=version,
        trust_status=trust_status,
        command_count=command_count,
        tool_count=tool_count,
        session_store_type=session_store_type,
        body=body,
        timestamp=int(time.time() * 1000),
    )


def build_system_prompt_for_session(context: str | None = None) -> str:
    base = [
        "You are Brain AI — the intelligent core of Kaelus.online.",
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
    ]

    if context:
        base.extend(["", "## Session Context", context])

    return "\n".join(base)
