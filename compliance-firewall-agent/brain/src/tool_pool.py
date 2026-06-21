from __future__ import annotations

from dataclasses import dataclass, field

from .permissions import PermissionManager
from .tools import ToolSnapshot, filter_tools_by_permission, load_tool_snapshot


@dataclass
class ToolPool:
    tools: list[ToolSnapshot]
    allowed_categories: list[str]
    blocked_tools: list[str]
    total_available: int
    total_blocked: int


@dataclass
class ToolPoolConfig:
    allowed_categories: list[str] | None = None
    blocked_tools: list[str] | None = None
    permission_manager: PermissionManager | None = None


def assemble_tool_pool(config: ToolPoolConfig | None = None) -> ToolPool:
    config = config or ToolPoolConfig()
    all_tools = load_tool_snapshot()
    allowed_categories = config.allowed_categories or [
        "research",
        "compliance",
        "analysis",
        "knowledge",
        "visualization",
    ]
    blocked_tools = config.blocked_tools or []
    permission_manager = config.permission_manager

    if permission_manager is not None:
        available = [
            t
            for t in all_tools
            if t.name not in blocked_tools and permission_manager.check_tool(t.name).allowed
        ]
    else:
        available = [t for t in filter_tools_by_permission(allowed_categories) if t.name not in blocked_tools]

    blocked = [t for t in all_tools if not any(a.name == t.name for a in available)]

    return ToolPool(
        tools=available,
        allowed_categories=allowed_categories,
        blocked_tools=[t.name for t in blocked],
        total_available=len(available),
        total_blocked=len(blocked),
    )


def get_default_tool_pool() -> ToolPool:
    return assemble_tool_pool(
        ToolPoolConfig(
            allowed_categories=["research", "compliance", "analysis", "knowledge", "visualization"],
            blocked_tools=["code-execute"],
        )
    )


def get_full_tool_pool() -> ToolPool:
    return assemble_tool_pool(
        ToolPoolConfig(
            allowed_categories=[
                "research",
                "compliance",
                "analysis",
                "knowledge",
                "visualization",
                "coding",
            ],
            blocked_tools=[],
        )
    )


def pool_tool_names(pool: ToolPool) -> list[str]:
    return [t.name for t in pool.tools]


def render_tool_pool(pool: ToolPool) -> str:
    lines = [f"## Active Tool Pool ({pool.total_available} tools)", ""]
    for tool in pool.tools:
        lines.append(f"- **{tool.name}** [{tool.category}] — {tool.description}")
    if pool.blocked_tools:
        lines.append("")
        lines.append(f"### Blocked ({pool.total_blocked}): {', '.join(pool.blocked_tools)}")
    return "\n".join(lines)
