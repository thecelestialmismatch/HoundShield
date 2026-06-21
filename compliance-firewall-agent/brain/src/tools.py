from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from .models import ToolExecution


@dataclass
class ToolSnapshot:
    name: str
    description: str
    category: str
    requires_permission: bool
    source_hint: str


_tool_snapshot_cache: list[ToolSnapshot] | None = None


def load_tool_snapshot() -> list[ToolSnapshot]:
    global _tool_snapshot_cache
    if _tool_snapshot_cache is not None:
        return _tool_snapshot_cache

    try:
        from agent.tools import tool_registry  # type: ignore[import-not-found]

        manifest = tool_registry.get_manifest()
        _tool_snapshot_cache = [
            ToolSnapshot(
                name=t["name"],
                description=t["description"],
                category=t["category"],
                requires_permission=False,
                source_hint=f"lib/agent/tools/{t['name']}.py",
            )
            for t in manifest
        ]
    except Exception:
        _tool_snapshot_cache = DEFAULT_TOOL_SNAPSHOTS

    return _tool_snapshot_cache


DEFAULT_TOOL_SNAPSHOTS: list[ToolSnapshot] = [
    ToolSnapshot(
        name="web-search",
        description="Search the web using DuckDuckGo — returns titles, URLs, and snippets",
        category="research",
        requires_permission=False,
        source_hint="lib/agent/tools/web-search.ts",
    ),
    ToolSnapshot(
        name="web-browse",
        description="Fetch and extract content from a URL — returns markdown text",
        category="research",
        requires_permission=False,
        source_hint="lib/agent/tools/web-browse.ts",
    ),
    ToolSnapshot(
        name="compliance-scan",
        description="Scan text for CUI, PII, and CMMC/HIPAA compliance violations",
        category="compliance",
        requires_permission=False,
        source_hint="lib/classifier/risk-engine.ts",
    ),
    ToolSnapshot(
        name="code-execute",
        description="Execute JavaScript code in a sandboxed environment",
        category="coding",
        requires_permission=True,
        source_hint="lib/agent/tools/code-execute.ts",
    ),
    ToolSnapshot(
        name="file-analyze",
        description="Parse and analyze JSON, CSV, or Markdown files",
        category="analysis",
        requires_permission=False,
        source_hint="lib/agent/tools/file-analyze.ts",
    ),
    ToolSnapshot(
        name="data-query",
        description="Run SQL-like queries on local JSON data",
        category="analysis",
        requires_permission=False,
        source_hint="lib/agent/tools/data-query.ts",
    ),
    ToolSnapshot(
        name="generate-chart",
        description="Create Chart.js-compatible visualization data",
        category="visualization",
        requires_permission=False,
        source_hint="lib/agent/tools/generate-chart.ts",
    ),
    ToolSnapshot(
        name="knowledge-base",
        description="Store, retrieve, and search RAG-style documents",
        category="knowledge",
        requires_permission=False,
        source_hint="lib/agent/tools/knowledge-base.ts",
    ),
]


def get_tool(name: str) -> ToolSnapshot | None:
    return next((t for t in load_tool_snapshot() if t.name == name), None)


def get_tools(names: list[str]) -> list[ToolSnapshot]:
    snapshot = load_tool_snapshot()
    result = []
    for n in names:
        found = next((t for t in snapshot if t.name == n), None)
        if found:
            result.append(found)
    return result


def tool_names() -> list[str]:
    return [t.name for t in load_tool_snapshot()]


def _tokenize(text: str) -> list[str]:
    return [t for t in re.split(r"\s+", text.lower()) if len(t) > 1]


def find_tools(query: str) -> list[ToolSnapshot]:
    tokens = _tokenize(query)
    result = []
    for tool in load_tool_snapshot():
        text = f"{tool.name} {tool.description} {tool.category}".lower()
        if any(t in text for t in tokens):
            result.append(tool)
    return result


def filter_tools_by_permission(allowed_categories: list[str]) -> list[ToolSnapshot]:
    return [t for t in load_tool_snapshot() if not t.requires_permission or t.category in allowed_categories]


async def execute_tool(name: str, args: dict[str, Any], prompt: str) -> ToolExecution:
    try:
        from agent.tools import tool_registry  # type: ignore[import-not-found]

        result = await tool_registry.execute(name, args)
        tool = get_tool(name)
        return ToolExecution(
            name=name,
            category=tool.category if tool else "unknown",
            prompt=prompt,
            handled=True,
            result=result,
        )
    except Exception as err:  # noqa: BLE001 - faithful port of catch-all
        return ToolExecution(
            name=name,
            category="unknown",
            prompt=prompt,
            handled=False,
            result={"error": str(err)},
        )


def render_tool_index() -> str:
    tools = load_tool_snapshot()
    lines = ["## Brain AI Tools\n"]
    categories: list[str] = []
    for t in tools:
        if t.category not in categories:
            categories.append(t.category)
    for cat in categories:
        lines.append(f"### {cat[0].upper() + cat[1:]}")
        for t in [x for x in tools if x.category == cat]:
            lines.append(f"- **{t.name}** — {t.description}")
        lines.append("")
    return "\n".join(lines)


def score_tool_match(tool: ToolSnapshot, query: str) -> int:
    tokens = _tokenize(query)
    name_tokens = _tokenize(tool.name)
    desc_tokens = _tokenize(tool.description)
    score = 0
    for t in tokens:
        if t in name_tokens:
            score += 3
        elif any(t in d for d in desc_tokens):
            score += 1
        if t == tool.category:
            score += 2
    return score
