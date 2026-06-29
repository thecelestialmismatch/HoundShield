"""
VedicBrain.AI — QueryEngine
Streaming, multi-turn, tool-call loop.

Architecture pattern derived from claw-code clean-room port:
  - Submit user message → stream model response
  - Parse tool_calls from response chunks
  - Execute tools through ToolRegistry with permission check + hooks
  - Feed tool results back to model
  - Repeat until stop_reason = "end_turn" or max_turns reached
  - Yield StreamEvent objects to caller for SSE / CLI rendering
"""
from __future__ import annotations

import asyncio
import json
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, AsyncIterator

import structlog

from vedic_brain.config import settings
from vedic_brain.core.context import ConversationContext, Message
from vedic_brain.core.hooks import HookEvent, HookPayload, HookRegistry, build_default_registry
from vedic_brain.core.permissions import PermissionContext, PermissionRequest, RiskLevel
from vedic_brain.core.session import FilesystemSessionStore, get_session_store

log = structlog.get_logger("vedic_brain.query_engine")


# ── Stream Events ────────────────────────────────────────────────────────────

class EventType(str, Enum):
    TEXT_DELTA = "text_delta"
    TOOL_CALL_START = "tool_call_start"
    TOOL_CALL_RESULT = "tool_call_result"
    TOOL_CALL_ERROR = "tool_call_error"
    TURN_START = "turn_start"
    TURN_END = "turn_end"
    STOP = "stop"
    ERROR = "error"
    USAGE = "usage"


@dataclass
class StreamEvent:
    type: EventType
    data: dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)

    def to_sse(self) -> str:
        return f"data: {json.dumps({'type': self.type.value, **self.data})}\n\n"

    def to_openai_chunk(self, model: str) -> dict[str, Any]:
        """Convert to OpenAI streaming chunk format."""
        chunk_id = f"chatcmpl-{uuid.uuid4().hex[:12]}"
        if self.type == EventType.TEXT_DELTA:
            return {
                "id": chunk_id,
                "object": "chat.completion.chunk",
                "created": int(self.timestamp),
                "model": model,
                "choices": [{"index": 0, "delta": {"content": self.data.get("text", "")},
                              "finish_reason": None}],
            }
        if self.type == EventType.STOP:
            return {
                "id": chunk_id,
                "object": "chat.completion.chunk",
                "created": int(self.timestamp),
                "model": model,
                "choices": [{"index": 0, "delta": {},
                              "finish_reason": self.data.get("stop_reason", "stop")}],
                "usage": self.data.get("usage"),
            }
        return {"id": chunk_id, "type": self.type.value, **self.data}


# ── Stop Reasons ─────────────────────────────────────────────────────────────

class StopReason(str, Enum):
    END_TURN = "end_turn"
    MAX_TURNS = "max_turns"
    TOOL_ERROR = "tool_error"
    PERMISSION_DENIED = "permission_denied"
    CONTEXT_LIMIT = "context_limit"
    ERROR = "error"


# ── Engine Configuration ─────────────────────────────────────────────────────

@dataclass
class QueryEngineConfig:
    max_turns: int = 50
    max_tokens: int | None = None
    temperature: float | None = None
    stream: bool = True
    enable_tools: bool = True
    system_prompt: str | None = None
    allowed_tools: list[str] | None = None   # None = all tools
    denied_tools: list[str] = field(default_factory=list)


# ── Main Engine ──────────────────────────────────────────────────────────────

class QueryEngine:
    """
    Core agentic loop for VedicBrain.AI.
    Wires together: InferenceService → ToolRegistry → HookRegistry → PermissionContext.
    """

    def __init__(
        self,
        inference_service: Any,          # vedic_brain.services.inference.InferenceService
        tool_registry: Any,              # vedic_brain.tools.ToolRegistry
        hook_registry: HookRegistry | None = None,
        permission_context: PermissionContext | None = None,
        session_store: FilesystemSessionStore | None = None,
        config: QueryEngineConfig | None = None,
    ) -> None:
        self.inference = inference_service
        self.tools = tool_registry
        self.hooks, self.usage_hook = (
            (hook_registry, None) if hook_registry
            else build_default_registry()
        )
        self.permissions = permission_context or PermissionContext.api_mode()
        self.session_store = session_store or get_session_store()
        self.config = config or QueryEngineConfig()

    async def run(
        self,
        context: ConversationContext,
        config: QueryEngineConfig | None = None,
    ) -> AsyncIterator[StreamEvent]:
        """
        Main entry: stream events until stop condition.
        Caller iterates: async for event in engine.run(ctx): ...
        """
        cfg = config or self.config
        turn = 0

        # Fire session-start hook
        await self.hooks.fire(HookPayload(
            event=HookEvent.SESSION_START,
            session_id=context.session_id,
        ))

        try:
            async for event in self._agent_loop(context, cfg):
                yield event
                if event.type == EventType.STOP:
                    break
        finally:
            await self.hooks.fire(HookPayload(
                event=HookEvent.SESSION_END,
                session_id=context.session_id,
            ))

    async def _agent_loop(
        self,
        context: ConversationContext,
        cfg: QueryEngineConfig,
    ) -> AsyncIterator[StreamEvent]:
        turn = 0

        while turn < cfg.max_turns:
            turn += 1
            yield StreamEvent(EventType.TURN_START, {"turn": turn})

            # ── Build tool specs for this turn ───────────────────────────────
            tool_specs = []
            if cfg.enable_tools:
                tool_specs = self.tools.get_specs(
                    allowed=cfg.allowed_tools,
                    denied=cfg.denied_tools,
                )

            # ── Pre-turn hook ────────────────────────────────────────────────
            await self.hooks.fire(HookPayload(
                event=HookEvent.PRE_TURN,
                session_id=context.session_id,
                metadata={"turn": turn},
            ))

            # ── Check context utilization ────────────────────────────────────
            if context.token_budget.utilization > settings.context_compact_threshold:
                yield StreamEvent(EventType.USAGE, {
                    "warning": "context_near_limit",
                    "utilization": context.token_budget.utilization,
                })

            # ── Call inference service ───────────────────────────────────────
            text_buffer = ""
            tool_calls_raw: list[dict[str, Any]] = []
            finish_reason = "stop"
            input_tokens = 0
            output_tokens = 0

            async for chunk in self.inference.stream_chat(
                messages=context.to_api_messages(),
                tools=tool_specs if tool_specs else None,
                max_tokens=cfg.max_tokens or settings.model_max_tokens,
                temperature=cfg.temperature if cfg.temperature is not None else settings.model_temperature,
            ):
                chunk_type = chunk.get("type")

                if chunk_type == "text_delta":
                    text_buffer += chunk["text"]
                    yield StreamEvent(EventType.TEXT_DELTA, {"text": chunk["text"]})

                elif chunk_type == "tool_call":
                    tool_calls_raw.append(chunk["tool_call"])

                elif chunk_type == "usage":
                    input_tokens = chunk.get("input_tokens", 0)
                    output_tokens = chunk.get("output_tokens", 0)
                    context.token_budget.add_turn(input_tokens, output_tokens)

                elif chunk_type == "finish":
                    finish_reason = chunk.get("finish_reason", "stop")

            # ── Add assistant message to context ─────────────────────────────
            context.add_assistant(
                content=text_buffer,
                tool_calls=tool_calls_raw if tool_calls_raw else None,
            )

            # ── Post-turn hook ───────────────────────────────────────────────
            await self.hooks.fire(HookPayload(
                event=HookEvent.POST_TURN,
                session_id=context.session_id,
                metadata={"turn": turn, "finish_reason": finish_reason},
            ))

            yield StreamEvent(EventType.TURN_END, {
                "turn": turn,
                "finish_reason": finish_reason,
                "text_length": len(text_buffer),
                "tool_calls": len(tool_calls_raw),
            })

            # ── No tool calls → done ─────────────────────────────────────────
            if not tool_calls_raw:
                yield StreamEvent(EventType.STOP, {
                    "stop_reason": StopReason.END_TURN.value,
                    "turns": turn,
                    "usage": {
                        "input_tokens": context.token_budget.used_input,
                        "output_tokens": context.token_budget.used_output,
                    },
                })
                return

            # ── Execute tool calls ───────────────────────────────────────────
            tool_error_occurred = False
            for tc in tool_calls_raw:
                tool_name = tc.get("function", {}).get("name", "")
                tool_call_id = tc.get("id", str(uuid.uuid4()))
                try:
                    raw_args = tc.get("function", {}).get("arguments", "{}")
                    tool_args = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
                except json.JSONDecodeError:
                    tool_args = {}

                yield StreamEvent(EventType.TOOL_CALL_START, {
                    "tool_call_id": tool_call_id,
                    "tool_name": tool_name,
                    "args": tool_args,
                })

                # Permission check
                tool_def = self.tools.get(tool_name)
                risk = tool_def.risk_level if tool_def else RiskLevel.HIGH
                perm_req = PermissionRequest(
                    tool_name=tool_name,
                    risk_level=risk,
                    description=f"Execute tool: {tool_name}",
                    args=tool_args,
                    session_id=context.session_id,
                )
                decision = await self.permissions.check(perm_req)
                if not decision.granted:
                    result_content = f"[Permission denied: {decision.reason}]"
                    context.add_tool_result(tool_call_id, result_content, tool_name)
                    yield StreamEvent(EventType.TOOL_CALL_ERROR, {
                        "tool_call_id": tool_call_id,
                        "tool_name": tool_name,
                        "error": result_content,
                    })
                    tool_error_occurred = True
                    continue

                # Pre-tool hook
                pre_payload = HookPayload(
                    event=HookEvent.PRE_TOOL_CALL,
                    session_id=context.session_id,
                    tool_name=tool_name,
                    tool_args=tool_args,
                )
                pre_result = await self.hooks.fire(pre_payload)
                if not pre_result.proceed:
                    result_content = f"[Blocked by hook: {pre_result.abort_reason}]"
                    context.add_tool_result(tool_call_id, result_content, tool_name)
                    yield StreamEvent(EventType.TOOL_CALL_ERROR, {
                        "tool_call_id": tool_call_id,
                        "tool_name": tool_name,
                        "error": result_content,
                    })
                    continue

                effective_args = pre_result.modified_args or tool_args

                # Execute
                try:
                    result_content = await self.tools.execute(tool_name, effective_args, context)
                    if not isinstance(result_content, str):
                        result_content = json.dumps(result_content)
                except Exception as exc:
                    result_content = f"[Tool error: {exc}]"
                    await self.hooks.fire(HookPayload(
                        event=HookEvent.TOOL_ERROR,
                        session_id=context.session_id,
                        tool_name=tool_name,
                        tool_args=effective_args,
                        error=exc,
                    ))
                    yield StreamEvent(EventType.TOOL_CALL_ERROR, {
                        "tool_call_id": tool_call_id,
                        "tool_name": tool_name,
                        "error": str(exc),
                    })
                    tool_error_occurred = True

                # Post-tool hook
                await self.hooks.fire(HookPayload(
                    event=HookEvent.POST_TOOL_CALL,
                    session_id=context.session_id,
                    tool_name=tool_name,
                    tool_args=effective_args,
                    tool_result=result_content,
                ))

                context.add_tool_result(tool_call_id, result_content, tool_name)
                yield StreamEvent(EventType.TOOL_CALL_RESULT, {
                    "tool_call_id": tool_call_id,
                    "tool_name": tool_name,
                    "result_preview": result_content[:500],
                    "result_length": len(result_content),
                })

        # Max turns exceeded
        yield StreamEvent(EventType.STOP, {
            "stop_reason": StopReason.MAX_TURNS.value,
            "turns": turn,
            "usage": {
                "input_tokens": context.token_budget.used_input,
                "output_tokens": context.token_budget.used_output,
            },
        })

    async def run_non_streaming(
        self,
        context: ConversationContext,
        config: QueryEngineConfig | None = None,
    ) -> dict[str, Any]:
        """
        Collect all stream events into a single response.
        Used for non-streaming API mode.
        """
        text_parts: list[str] = []
        tool_results: list[dict[str, Any]] = []
        stop_event: dict[str, Any] = {}

        async for event in self.run(context, config):
            if event.type == EventType.TEXT_DELTA:
                text_parts.append(event.data.get("text", ""))
            elif event.type == EventType.TOOL_CALL_RESULT:
                tool_results.append(event.data)
            elif event.type == EventType.STOP:
                stop_event = event.data

        return {
            "content": "".join(text_parts),
            "tool_results": tool_results,
            "stop_reason": stop_event.get("stop_reason", "end_turn"),
            "usage": stop_event.get("usage", {}),
        }
