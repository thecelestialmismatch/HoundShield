from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal

PortingModuleStatus = Literal["pending", "in_progress", "complete", "skipped"]
StoredMessageRole = Literal["user", "assistant", "system", "tool"]
StopReason = Literal["end_turn", "max_turns", "max_tokens", "error", "user_stop"]


@dataclass
class Subsystem:
    name: str
    path: str
    file_count: int
    notes: str


@dataclass
class PortingModule:
    name: str
    responsibility: str
    source_hint: str
    status: PortingModuleStatus


@dataclass
class PermissionDenial:
    tool_name: str
    reason: str


@dataclass
class UsageSummary:
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0


def create_usage_summary() -> UsageSummary:
    return UsageSummary(input_tokens=0, output_tokens=0, total_tokens=0)


def add_turn(summary: UsageSummary, input_tokens: int, output_tokens: int) -> UsageSummary:
    return UsageSummary(
        input_tokens=summary.input_tokens + input_tokens,
        output_tokens=summary.output_tokens + output_tokens,
        total_tokens=summary.total_tokens + input_tokens + output_tokens,
    )


@dataclass
class CommandExecution:
    name: str
    source_hint: str
    prompt: str
    handled: bool
    message: str


@dataclass
class ToolExecution:
    name: str
    category: str
    prompt: str
    handled: bool
    result: Any


@dataclass
class TurnResult:
    prompt: str
    output: str
    matched_commands: list[CommandExecution]
    matched_tools: list[ToolExecution]
    permission_denials: list[PermissionDenial]
    usage: UsageSummary
    stop_reason: StopReason


@dataclass
class RuntimeSession:
    session_id: str
    prompt: str
    setup: str
    history: list[TurnResult]
    total_usage: UsageSummary
    created_at: int
    updated_at: int


@dataclass
class StoredMessage:
    role: StoredMessageRole
    content: str
    tool_call_id: str | None = None
    name: str | None = None


@dataclass
class StoredSession:
    session_id: str
    messages: list[StoredMessage]
    input_tokens: int
    output_tokens: int
    created_at: int
    updated_at: int
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class QueryEngineConfig:
    max_turns: int
    max_budget_tokens: int
    model: str
    system_prompt: str
    temperature: float


def default_query_engine_config() -> QueryEngineConfig:
    return QueryEngineConfig(
        max_turns=15,
        max_budget_tokens=8192,
        model="google/gemini-flash-1.5",
        system_prompt=(
            "You are Brain AI — the intelligent core of Kaelus.online, an AI compliance "
            "firewall for defense contractors and regulated industries. You help users "
            "achieve CMMC Level 2, HIPAA, and SOC 2 compliance through intelligent "
            "guidance, threat analysis, and automated documentation."
        ),
        temperature=0.7,
    )


@dataclass
class RoutedMatch:
    type: Literal["command", "tool"]
    name: str
    score: int
    source_hint: str


@dataclass
class PortManifest:
    project_name: str
    subsystems: list[Subsystem]
    total_files: int
    generated_at: int


@dataclass
class ParityAuditResult:
    coverage: int
    missing: list[str]
    present: list[str]
    report: str
