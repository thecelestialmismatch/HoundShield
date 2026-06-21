from __future__ import annotations

from dataclasses import dataclass, replace
from typing import Any, AsyncGenerator, Callable, Literal

from .models import (
    QueryEngineConfig,
    StoredMessage,
    StoredSession,
    TurnResult,
    UsageSummary,
    add_turn,
    create_usage_summary,
    default_query_engine_config,
)
from .session_store import add_token_usage, append_message, create_session, load_session, save_session

QueryEngineEventType = Literal[
    "thinking",
    "token",
    "tool_call",
    "tool_result",
    "turn_complete",
    "done",
    "error",
    "budget_exceeded",
    "max_turns_reached",
]


@dataclass
class QueryEngineEvent:
    type: QueryEngineEventType
    content: str | None = None
    tool_name: str | None = None
    args: Any = None
    result: Any = None
    turn: int | None = None
    max_turns: int | None = None
    usage: UsageSummary | None = None
    turn_result: TurnResult | None = None
    message: str | None = None
    tokens_used: int | None = None
    max_tokens: int | None = None
    turns_used: int | None = None


@dataclass
class SubmitOptions:
    session_id: str
    user_message: str
    config: dict[str, Any] | None = None
    on_event: Callable[[QueryEngineEvent], None] | None = None
    api_key: str | None = None


class QueryEnginePort:
    def __init__(self, config: dict[str, Any] | None = None) -> None:
        base = default_query_engine_config()
        self.config: QueryEngineConfig = replace(base, **(config or {}))

    async def stream_submit_message(self, options: SubmitOptions) -> AsyncGenerator[QueryEngineEvent, None]:
        cfg = replace(self.config, **(options.config or {}))
        session_id = options.session_id
        user_message = options.user_message
        on_event = options.on_event

        session = await load_session(session_id)
        if not session:
            session = create_session(session_id, cfg.system_prompt)

        current_tokens = session.input_tokens + session.output_tokens
        if current_tokens >= cfg.max_budget_tokens:
            event = QueryEngineEvent(
                type="budget_exceeded",
                tokens_used=current_tokens,
                max_tokens=cfg.max_budget_tokens,
            )
            if on_event:
                on_event(event)
            yield event
            return

        turn_count = len([m for m in session.messages if m.role == "user"])
        if turn_count >= cfg.max_turns:
            event = QueryEngineEvent(type="max_turns_reached", turns_used=turn_count)
            if on_event:
                on_event(event)
            yield event
            return

        session = append_message(session, StoredMessage(role="user", content=user_message))
        await save_session(session)

        messages = session.messages

        usage = create_usage_summary()
        output_content = ""
        matched_tools: list[Any] = []

        try:
            from agent.orchestrator import execute_agent_loop  # type: ignore

            open_router_messages = [
                {"role": m.role, "content": m.content} for m in messages if m.role != "system"
            ]
            system_msg = next((m.content for m in messages if m.role == "system"), cfg.system_prompt)

            def _on_agent_event(agent_event: dict[str, Any]) -> None:
                nonlocal output_content, usage
                evt_type = agent_event.get("type")
                if evt_type == "thinking" and agent_event.get("content"):
                    q_event = QueryEngineEvent(type="thinking", content=agent_event["content"])
                    if on_event:
                        on_event(q_event)
                elif evt_type == "content" and agent_event.get("content"):
                    output_content += agent_event["content"]
                    q_event = QueryEngineEvent(type="token", content=agent_event["content"])
                    if on_event:
                        on_event(q_event)
                elif evt_type == "tool_call" and agent_event.get("toolName"):
                    q_event = QueryEngineEvent(
                        type="tool_call",
                        tool_name=agent_event["toolName"],
                        args=agent_event.get("args") or {},
                    )
                    if on_event:
                        on_event(q_event)
                elif evt_type == "tool_result" and agent_event.get("toolName"):
                    matched_tools.append(
                        {
                            "name": agent_event["toolName"],
                            "category": "unknown",
                            "prompt": user_message,
                            "handled": True,
                            "result": agent_event.get("result"),
                        }
                    )
                    q_event = QueryEngineEvent(
                        type="tool_result",
                        tool_name=agent_event["toolName"],
                        result=agent_event.get("result"),
                    )
                    if on_event:
                        on_event(q_event)
                elif evt_type == "usage" and agent_event.get("usage"):
                    usage = add_turn(
                        usage,
                        agent_event["usage"]["inputTokens"],
                        agent_event["usage"]["outputTokens"],
                    )

            import os

            await execute_agent_loop(
                open_router_messages,
                {
                    "model": cfg.model,
                    "systemPrompt": system_msg,
                    "maxIterations": min(cfg.max_turns - turn_count, 15),
                    "temperature": cfg.temperature,
                    "apiKey": options.api_key or os.environ.get("OPENROUTER_API_KEY", ""),
                    "sessionId": session_id,
                    "onEvent": _on_agent_event,
                },
            )
        except Exception as err:
            event = QueryEngineEvent(type="error", message=str(err))
            if on_event:
                on_event(event)
            yield event
            return

        if output_content:
            session = append_message(session, StoredMessage(role="assistant", content=output_content))
            session = add_token_usage(session, usage.input_tokens, usage.output_tokens)
            await save_session(session)

        turn_result = TurnResult(
            prompt=user_message,
            output=output_content,
            matched_commands=[],
            matched_tools=matched_tools,
            permission_denials=[],
            usage=usage,
            stop_reason="end_turn",
        )

        done_event = QueryEngineEvent(type="done", turn_result=turn_result)
        if on_event:
            on_event(done_event)
        yield done_event

    async def submit_message(self, options: SubmitOptions) -> TurnResult:
        final_result: TurnResult | None = None
        async for event in self.stream_submit_message(options):
            if event.type == "done":
                final_result = event.turn_result
        if not final_result:
            return TurnResult(
                prompt=options.user_message,
                output="",
                matched_commands=[],
                matched_tools=[],
                permission_denials=[],
                usage=create_usage_summary(),
                stop_reason="error",
            )
        return final_result

    async def get_session(self, session_id: str) -> StoredSession | None:
        return await load_session(session_id)

    async def new_session(self, session_id: str) -> StoredSession:
        session = create_session(session_id, self.config.system_prompt)
        await save_session(session)
        return session

    def update_config(self, config: dict[str, Any]) -> None:
        self.config = replace(self.config, **config)

    def get_config(self) -> QueryEngineConfig:
        return replace(self.config)
