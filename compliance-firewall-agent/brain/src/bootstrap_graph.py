from __future__ import annotations

import time
from dataclasses import dataclass, field, replace
from typing import Literal

BootstrapStage = Literal[
    "env_check",
    "config_load",
    "session_store",
    "tool_pool",
    "command_registry",
    "classifier",
    "agent_ready",
]

BootstrapNodeStatus = Literal["pending", "running", "done", "failed"]


@dataclass
class BootstrapNode:
    stage: BootstrapStage
    label: str
    depends_on: list[BootstrapStage]
    status: BootstrapNodeStatus
    duration_ms: int | None = None
    error: str | None = None


@dataclass
class BootstrapGraph:
    nodes: list[BootstrapNode]
    started_at: int
    success: bool
    completed_at: int | None = None


_BOOTSTRAP_STAGES: list[BootstrapNode] = [
    BootstrapNode(stage="env_check", label="Environment Check", depends_on=[], status="pending"),
    BootstrapNode(
        stage="config_load", label="Configuration Load", depends_on=["env_check"], status="pending"
    ),
    BootstrapNode(
        stage="session_store",
        label="Session Store Init",
        depends_on=["config_load"],
        status="pending",
    ),
    BootstrapNode(
        stage="tool_pool", label="Tool Pool Assembly", depends_on=["config_load"], status="pending"
    ),
    BootstrapNode(
        stage="command_registry",
        label="Command Registry Load",
        depends_on=["config_load"],
        status="pending",
    ),
    BootstrapNode(
        stage="classifier",
        label="Compliance Classifier",
        depends_on=["config_load"],
        status="pending",
    ),
    BootstrapNode(
        stage="agent_ready",
        label="Brain AI Ready",
        depends_on=["session_store", "tool_pool", "command_registry", "classifier"],
        status="pending",
    ),
]


def create_bootstrap_graph() -> BootstrapGraph:
    return BootstrapGraph(
        nodes=[replace(n) for n in _BOOTSTRAP_STAGES],
        started_at=int(time.time() * 1000),
        success=False,
    )


async def run_bootstrap_graph() -> BootstrapGraph:
    graph = create_bootstrap_graph()
    node_map = {n.stage: n for n in graph.nodes}

    async def run_stage(node: BootstrapNode) -> None:
        for dep in node.depends_on:
            dep_node = node_map[dep]
            if dep_node.status == "pending":
                await run_stage(dep_node)
            if dep_node.status == "failed":
                node.status = "failed"
                node.error = f"Dependency {dep} failed"
                return

        node.status = "running"
        start = int(time.time() * 1000)

        try:
            await _execute_stage(node.stage)
            node.status = "done"
            node.duration_ms = int(time.time() * 1000) - start
        except Exception as err:  # noqa: BLE001 - faithful port of catch-all
            node.status = "failed"
            node.error = str(err)
            node.duration_ms = int(time.time() * 1000) - start

    for node in graph.nodes:
        if node.status == "pending":
            await run_stage(node)

    graph.completed_at = int(time.time() * 1000)
    graph.success = all(n.status == "done" for n in graph.nodes)
    return graph


async def _execute_stage(stage: BootstrapStage) -> None:
    if stage == "env_check":
        return
    if stage == "config_load":
        return
    if stage == "session_store":
        return
    if stage == "tool_pool":
        from .tools import load_tool_snapshot

        load_tool_snapshot()
        return
    if stage == "command_registry":
        from .commands import load_command_snapshot

        load_command_snapshot()
        return
    if stage == "classifier":
        return
    if stage == "agent_ready":
        return


def render_bootstrap_graph(graph: BootstrapGraph) -> str:
    total_ms = (graph.completed_at - graph.started_at) if graph.completed_at else 0
    lines = [
        f"## Brain AI Bootstrap ({total_ms}ms total)",
        "✅ All stages complete" if graph.success else "❌ Some stages failed",
        "",
    ]
    for node in graph.nodes:
        icon = "✅" if node.status == "done" else "❌" if node.status == "failed" else "⏳"
        time_str = f" ({node.duration_ms}ms)" if node.duration_ms is not None else ""
        error_str = f" — {node.error}" if node.error else ""
        lines.append(f"{icon} {node.label}{time_str}{error_str}")
    return "\n".join(lines)
