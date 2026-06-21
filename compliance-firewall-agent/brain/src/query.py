from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from .commands import load_command_snapshot, score_command_match
from .models import RoutedMatch
from .tools import load_tool_snapshot, score_tool_match


@dataclass
class QueryRequest:
    prompt: str
    session_id: str
    model: str | None = None
    max_tokens: int | None = None
    stream: bool | None = None
    metadata: dict[str, Any] | None = None


@dataclass
class QueryResponse:
    session_id: str
    output: str
    matches: list[RoutedMatch]
    input_tokens: int
    output_tokens: int
    duration_ms: int
    error: str | None = None


class QueryEngineRuntime:
    def route(self, prompt: str) -> list[RoutedMatch]:
        matches: list[RoutedMatch] = []

        for cmd in load_command_snapshot():
            score = score_command_match(cmd, prompt)
            if score > 0:
                matches.append(RoutedMatch(type="command", name=cmd.name, score=score, source_hint=cmd.source_hint))

        for tool in load_tool_snapshot():
            score = score_tool_match(tool, prompt)
            if score > 0:
                matches.append(RoutedMatch(type="tool", name=tool.name, score=score, source_hint=tool.source_hint))

        return sorted(matches, key=lambda m: m.score, reverse=True)

    def top_match(self, prompt: str) -> RoutedMatch | None:
        matches = self.route(prompt)
        return matches[0] if matches else None

    def top_n(self, prompt: str, n: int) -> list[RoutedMatch]:
        return self.route(prompt)[:n]

    def render_matches(self, prompt: str) -> str:
        matches = self.route(prompt)[:5]
        if not matches:
            return "No matches found for: " + prompt
        lines = [f'## Routing: "{prompt}"\n']
        for m in matches:
            lines.append(f"- **{m.type}/{m.name}** (score: {m.score}) → `{m.source_hint}`")
        return "\n".join(lines)


_runtime: QueryEngineRuntime | None = None


def get_query_engine_runtime() -> QueryEngineRuntime:
    global _runtime
    if _runtime is None:
        _runtime = QueryEngineRuntime()
    return _runtime
