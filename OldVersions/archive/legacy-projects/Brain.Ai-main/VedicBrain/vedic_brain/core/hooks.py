"""
VedicBrain.AI — Hook System
Pre/post tool execution hooks for validation, logging, mutation.
Mirrors claw-code hook architecture pattern.
"""
from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Awaitable


class HookEvent(str, Enum):
    PRE_TOOL_CALL = "pre_tool_call"
    POST_TOOL_CALL = "post_tool_call"
    PRE_TURN = "pre_turn"
    POST_TURN = "post_turn"
    SESSION_START = "session_start"
    SESSION_END = "session_end"
    TOOL_ERROR = "tool_error"
    TOKEN_LIMIT_WARNING = "token_limit_warning"


@dataclass
class HookPayload:
    event: HookEvent
    session_id: str
    tool_name: str | None = None
    tool_args: dict[str, Any] | None = None
    tool_result: Any | None = None
    error: Exception | None = None
    metadata: dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)


@dataclass
class HookResult:
    """Return from a hook handler. Can mutate args or abort."""
    proceed: bool = True
    modified_args: dict[str, Any] | None = None  # replace tool args if set
    abort_reason: str = ""


HookHandler = Callable[[HookPayload], Awaitable[HookResult]]


class HookRegistry:
    """Registry of pre/post hooks keyed by HookEvent."""

    def __init__(self) -> None:
        self._handlers: dict[HookEvent, list[HookHandler]] = {e: [] for e in HookEvent}

    def register(self, event: HookEvent, handler: HookHandler) -> None:
        self._handlers[event].append(handler)

    def unregister(self, event: HookEvent, handler: HookHandler) -> None:
        try:
            self._handlers[event].remove(handler)
        except ValueError:
            pass

    async def fire(self, payload: HookPayload) -> HookResult:
        """
        Fire all handlers for the event in registration order.
        First handler that sets proceed=False aborts the chain.
        """
        result = HookResult(proceed=True)
        for handler in self._handlers[payload.event]:
            try:
                r = await handler(payload)
                if not r.proceed:
                    return r
                if r.modified_args:
                    result.modified_args = r.modified_args
                    # Propagate modified args into next handler's payload
                    if payload.tool_args is not None:
                        payload.tool_args = r.modified_args
            except Exception as exc:
                # Hook errors should never crash the engine
                import structlog
                log = structlog.get_logger()
                log.warning("hook_error", event=payload.event, handler=handler.__name__, error=str(exc))
        return result


# ── Built-in hooks ───────────────────────────────────────────────────────────

class LoggingHook:
    """Structured logging for every tool call."""

    def __init__(self) -> None:
        import structlog
        self._log = structlog.get_logger("vedic_brain.hooks.logging")

    async def pre_tool_call(self, payload: HookPayload) -> HookResult:
        self._log.info(
            "tool_call_start",
            tool=payload.tool_name,
            session=payload.session_id,
            args_keys=list((payload.tool_args or {}).keys()),
        )
        return HookResult(proceed=True)

    async def post_tool_call(self, payload: HookPayload) -> HookResult:
        self._log.info(
            "tool_call_end",
            tool=payload.tool_name,
            session=payload.session_id,
            has_result=payload.tool_result is not None,
            has_error=payload.error is not None,
        )
        return HookResult(proceed=True)


class UsageTrackingHook:
    """Accumulates per-session tool usage stats."""

    def __init__(self) -> None:
        self._stats: dict[str, dict[str, int]] = {}  # session_id -> {tool: count}

    async def post_tool_call(self, payload: HookPayload) -> HookResult:
        sid = payload.session_id
        tool = payload.tool_name or "unknown"
        if sid not in self._stats:
            self._stats[sid] = {}
        self._stats[sid][tool] = self._stats[sid].get(tool, 0) + 1
        return HookResult(proceed=True)

    def get_stats(self, session_id: str) -> dict[str, int]:
        return dict(self._stats.get(session_id, {}))


class BashSafetyHook:
    """
    Block destructive bash commands.
    Pattern from claw-code permission system.
    """
    BLOCKED_PATTERNS = [
        r"rm\s+-rf\s+/",
        r"dd\s+if=",
        r"mkfs\.",
        r":\(\)\{.*\}",     # fork bomb
        r">\s*/dev/sda",
    ]

    def __init__(self) -> None:
        import re
        self._patterns = [re.compile(p) for p in self.BLOCKED_PATTERNS]

    async def pre_tool_call(self, payload: HookPayload) -> HookResult:
        if payload.tool_name != "bash":
            return HookResult(proceed=True)
        command = (payload.tool_args or {}).get("command", "")
        for pattern in self._patterns:
            if pattern.search(command):
                return HookResult(
                    proceed=False,
                    abort_reason=f"Blocked dangerous command pattern: {pattern.pattern}",
                )
        return HookResult(proceed=True)


def build_default_registry(enable_logging: bool = True,
                            enable_safety: bool = True,
                            enable_usage: bool = True) -> tuple[HookRegistry, UsageTrackingHook]:
    registry = HookRegistry()
    usage_hook = UsageTrackingHook()

    if enable_logging:
        lh = LoggingHook()
        registry.register(HookEvent.PRE_TOOL_CALL, lh.pre_tool_call)
        registry.register(HookEvent.POST_TOOL_CALL, lh.post_tool_call)

    if enable_safety:
        sh = BashSafetyHook()
        registry.register(HookEvent.PRE_TOOL_CALL, sh.pre_tool_call)

    if enable_usage:
        registry.register(HookEvent.POST_TOOL_CALL, usage_hook.post_tool_call)

    return registry, usage_hook
