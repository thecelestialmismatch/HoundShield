from __future__ import annotations

import time
from dataclasses import dataclass, field, replace
from typing import Awaitable, Callable

INIT_STAGE_NAMES = [
    "plugin_init",
    "skill_init",
    "mcp_prefetch",
    "session_hooks",
    "tool_pool_ready",
    "command_registry_ready",
    "memory_ready",
    "classifier_ready",
]


@dataclass
class DeferredInitResult:
    plugin_init: bool = False
    skill_init: bool = False
    mcp_prefetch: bool = False
    session_hooks: bool = False
    tool_pool_ready: bool = False
    command_registry_ready: bool = False
    memory_ready: bool = False
    classifier_ready: bool = False

    def get(self, name: str) -> bool:
        return bool(getattr(self, name))

    def set(self, name: str, value: bool) -> None:
        setattr(self, name, value)

    def items(self) -> list[tuple[str, bool]]:
        return [(n, self.get(n)) for n in INIT_STAGE_NAMES]


@dataclass
class InitStage:
    name: str
    label: str
    required: bool
    initialized: bool
    error: str | None = None
    duration_ms: int | None = None


_init_result = DeferredInitResult()
_init_log: list[InitStage] = []


def get_deferred_init_result() -> DeferredInitResult:
    return replace(_init_result)


def get_init_log() -> list[InitStage]:
    return [*_init_log]


def _stage_label(stage: str) -> str:
    labels = {
        "plugin_init": "Plugin System",
        "skill_init": "Skill Library",
        "mcp_prefetch": "MCP Prefetch",
        "session_hooks": "Session Hooks",
        "tool_pool_ready": "Tool Pool",
        "command_registry_ready": "Command Registry",
        "memory_ready": "Memory System",
        "classifier_ready": "Compliance Classifier",
    }
    return labels.get(stage, stage)


def _is_required(stage: str) -> bool:
    return stage in ("tool_pool_ready", "command_registry_ready", "classifier_ready")


def mark_initialized(stage: str, duration_ms: int | None = None) -> None:
    _init_result.set(stage, True)
    existing = next((s for s in _init_log if s.name == stage), None)
    if existing:
        existing.initialized = True
        existing.duration_ms = duration_ms
    else:
        _init_log.append(
            InitStage(
                name=stage,
                label=_stage_label(stage),
                required=_is_required(stage),
                initialized=True,
                duration_ms=duration_ms,
            )
        )


def mark_init_failed(stage: str, error: str) -> None:
    existing = next((s for s in _init_log if s.name == stage), None)
    if existing:
        existing.error = error
    else:
        _init_log.append(
            InitStage(
                name=stage,
                label=_stage_label(stage),
                required=_is_required(stage),
                initialized=False,
                error=error,
            )
        )


def is_fully_initialized() -> bool:
    required = ["tool_pool_ready", "command_registry_ready", "classifier_ready"]
    return all(_init_result.get(k) for k in required)


def get_init_summary() -> str:
    result = get_deferred_init_result()
    stages = result.items()
    done = len([v for _, v in stages if v])
    return f"Brain AI Init: {done}/{len(stages)} subsystems ready"


async def run_deferred_init() -> DeferredInitResult:
    async def _command_registry_ready() -> None:
        from .commands import load_command_snapshot

        load_command_snapshot()

    async def _tool_pool_ready() -> None:
        from .tools import load_tool_snapshot

        load_tool_snapshot()

    async def _skill_init() -> None:
        from .skills import get_all_skills

        get_all_skills()

    async def _classifier_ready() -> None:
        return None

    async def _memory_ready() -> None:
        return None

    async def _session_hooks() -> None:
        return None

    async def _mcp_prefetch() -> None:
        return None

    async def _plugin_init() -> None:
        return None

    tasks: list[tuple[str, Callable[[], Awaitable[None]]]] = [
        ("command_registry_ready", _command_registry_ready),
        ("tool_pool_ready", _tool_pool_ready),
        ("skill_init", _skill_init),
        ("classifier_ready", _classifier_ready),
        ("memory_ready", _memory_ready),
        ("session_hooks", _session_hooks),
        ("mcp_prefetch", _mcp_prefetch),
        ("plugin_init", _plugin_init),
    ]

    for stage, fn in tasks:
        if _init_result.get(stage):
            continue
        start = int(time.time() * 1000)
        try:
            await fn()
            mark_initialized(stage, int(time.time() * 1000) - start)
        except Exception as err:  # noqa: BLE001 - faithful port of catch-all
            mark_init_failed(stage, str(err))

    return get_deferred_init_result()
