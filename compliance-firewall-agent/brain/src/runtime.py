from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, AsyncGenerator, Callable

from .models import PermissionDenial, RoutedMatch, RuntimeSession, create_usage_summary
from .commands import load_command_snapshot, score_command_match
from .tools import load_tool_snapshot, score_tool_match
from .query_engine import QueryEngineEvent, QueryEnginePort, SubmitOptions
from .session_store import create_session, load_session, save_session

RESTRICTED_TOOLS: set[str] = {"code-execute"}
RESTRICTED_COMMANDS: set[str] = set()


@dataclass
class RuntimeConfig:
    max_turns: int = 15
    max_budget_tokens: int = 8192
    model: str = "google/gemini-flash-1.5"
    api_key: str = ""
    allow_code_execution: bool = False
    on_event: Callable[[QueryEngineEvent], None] | None = None


@dataclass
class RoutePromptResult:
    matches: list[RoutedMatch]
    denials: list[PermissionDenial]


class PortRuntime:
    def __init__(self, config: RuntimeConfig | None = None) -> None:
        import os

        config = config or RuntimeConfig()
        self.config = RuntimeConfig(
            max_turns=config.max_turns,
            max_budget_tokens=config.max_budget_tokens,
            model=config.model,
            api_key=config.api_key or os.environ.get("OPENROUTER_API_KEY", ""),
            allow_code_execution=config.allow_code_execution,
            on_event=config.on_event or (lambda event: None),
        )
        self.query_engine = QueryEnginePort(
            {
                "max_turns": self.config.max_turns,
                "max_budget_tokens": self.config.max_budget_tokens,
                "model": self.config.model,
            }
        )

    def route_prompt(self, prompt: str) -> RoutePromptResult:
        commands = load_command_snapshot()
        tools = load_tool_snapshot()
        matches: list[RoutedMatch] = []

        for cmd in commands:
            score = score_command_match(cmd, prompt)
            if score > 0:
                matches.append(RoutedMatch(type="command", name=cmd.name, score=score, source_hint=cmd.source_hint))

        for tool in tools:
            score = score_tool_match(tool, prompt)
            if score > 0:
                matches.append(RoutedMatch(type="tool", name=tool.name, score=score, source_hint=tool.source_hint))

        matches.sort(key=lambda m: m.score, reverse=True)

        denials = self._infer_permission_denials(matches)

        allowed_matches = [m for m in matches if not any(d.tool_name == m.name for d in denials)]

        return RoutePromptResult(matches=allowed_matches[:5], denials=denials)

    def _infer_permission_denials(self, matches: list[RoutedMatch]) -> list[PermissionDenial]:
        denials: list[PermissionDenial] = []
        for match in matches:
            if match.type == "tool" and match.name in RESTRICTED_TOOLS:
                if not self.config.allow_code_execution:
                    denials.append(
                        PermissionDenial(
                            tool_name=match.name,
                            reason="Code execution requires explicit user permission. Enable in settings.",
                        )
                    )
            if match.type == "command" and match.name in RESTRICTED_COMMANDS:
                denials.append(
                    PermissionDenial(tool_name=match.name, reason="This command requires elevated permissions.")
                )
        return denials

    async def bootstrap_session(self, session_id: str, context: str | None = None) -> RuntimeSession:
        existing = await load_session(session_id)
        stored_session = existing or create_session(session_id)
        await save_session(stored_session)

        return RuntimeSession(
            session_id=session_id,
            prompt="",
            setup=context or "Kaelus.online Brain AI — CMMC Compliance Firewall",
            history=[],
            total_usage=create_usage_summary(),
            created_at=stored_session.created_at,
            updated_at=stored_session.updated_at,
        )

    async def run_turn_loop(self, session_id: str, prompt: str) -> AsyncGenerator[QueryEngineEvent, None]:
        routed = self.route_prompt(prompt)
        matches = routed.matches
        denials = routed.denials

        if matches:
            top_match = matches[0]
            thinking_event = QueryEngineEvent(
                type="thinking",
                content=f"Routing to: {top_match.type}/{top_match.name} (score: {top_match.score})",
            )
            yield thinking_event
            self.config.on_event(thinking_event)

        for denial in denials:
            thinking_event = QueryEngineEvent(
                type="thinking",
                content=f"Permission denied for {denial.tool_name}: {denial.reason}",
            )
            yield thinking_event

        async for event in self.query_engine.stream_submit_message(
            SubmitOptions(
                session_id=session_id,
                user_message=prompt,
                config={"model": self.config.model},
                api_key=self.config.api_key,
                on_event=self.config.on_event,
            )
        ):
            yield event

    def as_markdown(self, session: RuntimeSession) -> str:
        created = datetime.fromtimestamp(session.created_at / 1000, tz=timezone.utc).isoformat()
        lines = [
            f"# Brain AI Session — {session.session_id}",
            f"**Started:** {created}",
            f"**Turns:** {len(session.history)}",
            f"**Tokens:** {session.total_usage.total_tokens}",
            "",
            "## Setup",
            session.setup,
            "",
            "## Conversation",
        ]

        for turn in session.history:
            lines.append(f"\n### User\n{turn.prompt}")
            lines.append(f"\n### Brain AI\n{turn.output}")
            if turn.matched_tools:
                tool_names = ", ".join(t.name if hasattr(t, "name") else t["name"] for t in turn.matched_tools)
                lines.append(f"\n**Tools used:** {tool_names}")

        return "\n".join(lines)

    def get_query_engine(self) -> QueryEnginePort:
        return self.query_engine
