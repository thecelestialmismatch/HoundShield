from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

from .commands import CommandSnapshot, load_command_snapshot

CommandCategory = Literal["builtin", "plugin_like", "skill_like"]

BUILTIN_NAMES: set[str] = {"help", "scan", "assess", "report", "pricing", "demo"}
SKILL_LIKE_CATEGORIES: set[str] = {"compliance", "reports"}


@dataclass
class CommandGraphNode:
    command: CommandSnapshot
    graph_category: CommandCategory
    weight: int


@dataclass
class CommandGraph:
    builtins: list[CommandGraphNode]
    plugin_like: list[CommandGraphNode]
    skill_like: list[CommandGraphNode]
    all: list[CommandGraphNode]


def build_command_graph() -> CommandGraph:
    commands = load_command_snapshot()
    nodes = [
        CommandGraphNode(command=cmd, graph_category=_classify_command(cmd), weight=_weight_command(cmd))
        for cmd in commands
    ]

    sorted_nodes = sorted(nodes, key=lambda n: n.weight, reverse=True)

    return CommandGraph(
        builtins=[n for n in sorted_nodes if n.graph_category == "builtin"],
        plugin_like=[n for n in sorted_nodes if n.graph_category == "plugin_like"],
        skill_like=[n for n in sorted_nodes if n.graph_category == "skill_like"],
        all=sorted_nodes,
    )


def _classify_command(cmd: CommandSnapshot) -> CommandCategory:
    if cmd.name in BUILTIN_NAMES:
        return "builtin"
    if cmd.category in SKILL_LIKE_CATEGORIES:
        return "skill_like"
    return "plugin_like"


_PRIORITY_NAMES: dict[str, int] = {
    "assess": 100,
    "report": 90,
    "gaps": 85,
    "scan": 80,
    "sprs": 75,
    "quarantine": 70,
    "onboard": 65,
    "tasks": 60,
    "timeline": 55,
    "team": 50,
    "settings": 45,
    "resources": 40,
    "pricing": 30,
    "demo": 20,
    "help": 10,
}


def _weight_command(cmd: CommandSnapshot) -> int:
    return _PRIORITY_NAMES.get(cmd.name, 50)


def render_command_graph(graph: CommandGraph) -> str:
    lines = ["## Brain AI Command Graph\n"]

    if graph.builtins:
        lines.append("### Built-in Commands")
        for n in graph.builtins:
            lines.append(f"- **/{n.command.name}** — {n.command.description}")
        lines.append("")

    if graph.skill_like:
        lines.append("### Compliance Skills")
        for n in graph.skill_like:
            lines.append(f"- **/{n.command.name}** — {n.command.description}")
        lines.append("")

    if graph.plugin_like:
        lines.append("### Navigation & Admin")
        for n in graph.plugin_like:
            lines.append(f"- **/{n.command.name}** — {n.command.description}")

    return "\n".join(lines)


def get_top_commands(n: int) -> list[CommandGraphNode]:
    return build_command_graph().all[:n]
