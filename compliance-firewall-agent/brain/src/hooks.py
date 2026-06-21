from __future__ import annotations

import sys
import time
from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable, Literal, Union

HookEvent = Literal[
    "before_message",
    "after_message",
    "before_tool",
    "after_tool",
    "session_start",
    "session_end",
    "error",
    "permission_denied",
    "turn_complete",
]


@dataclass
class HookPayload:
    event: HookEvent
    session_id: str
    timestamp: int
    data: dict[str, Any]


HookHandler = Callable[[HookPayload], Union[None, Awaitable[None]]]


@dataclass
class RegisteredHook:
    id: str
    event: HookEvent
    handler: HookHandler
    priority: int
    once: bool


_hooks: dict[HookEvent, list[RegisteredHook]] = {}
_hook_counter = 0


def on(event: HookEvent, handler: HookHandler, priority: int = 50) -> str:
    global _hook_counter
    _hook_counter += 1
    hook_id = f"hook_{_hook_counter}"
    hook_list = _hooks.get(event, [])
    hook_list.append(RegisteredHook(id=hook_id, event=event, handler=handler, priority=priority, once=False))
    hook_list.sort(key=lambda h: h.priority)
    _hooks[event] = hook_list
    return hook_id


def once(event: HookEvent, handler: HookHandler, priority: int = 50) -> str:
    global _hook_counter
    _hook_counter += 1
    hook_id = f"hook_{_hook_counter}"
    hook_list = _hooks.get(event, [])
    hook_list.append(RegisteredHook(id=hook_id, event=event, handler=handler, priority=priority, once=True))
    hook_list.sort(key=lambda h: h.priority)
    _hooks[event] = hook_list
    return hook_id


def off(hook_id: str) -> bool:
    for event, hook_list in _hooks.items():
        idx = next((i for i, h in enumerate(hook_list) if h.id == hook_id), -1)
        if idx != -1:
            hook_list.pop(idx)
            _hooks[event] = hook_list
            return True
    return False


async def emit(event: HookEvent, session_id: str, data: dict[str, Any] | None = None) -> None:
    data = data or {}
    hook_list = _hooks.get(event)
    if not hook_list:
        return

    payload = HookPayload(event=event, session_id=session_id, timestamp=int(time.time() * 1000), data=data)
    to_remove: list[str] = []

    for hook in hook_list:
        try:
            result = hook.handler(payload)
            if result is not None and hasattr(result, "__await__"):
                await result
        except Exception as err:  # noqa: BLE001 - hooks must not crash Brain AI
            print(f"[BrainAI Hook] Error in {hook.id} ({event}): {err}", file=sys.stderr)
        if hook.once:
            to_remove.append(hook.id)

    for hook_id in to_remove:
        off(hook_id)


def clear_hooks(event: HookEvent | None = None) -> None:
    if event:
        _hooks.pop(event, None)
    else:
        _hooks.clear()


def get_hook_count(event: HookEvent | None = None) -> int:
    if event:
        return len(_hooks.get(event, []))
    total = 0
    for hook_list in _hooks.values():
        total += len(hook_list)
    return total


def register_telemetry_hooks(on_event: Callable[[HookPayload], None]) -> None:
    events: list[HookEvent] = [
        "session_start",
        "session_end",
        "turn_complete",
        "error",
        "permission_denied",
    ]
    for event in events:
        on(event, on_event, 100)


def build_payload(event: HookEvent, session_id: str, data: dict[str, Any] | None = None) -> HookPayload:
    return HookPayload(event=event, session_id=session_id, timestamp=int(time.time() * 1000), data=data or {})


def render_hook_registry() -> str:
    lines = ["## Brain AI Hook Registry\n"]
    for event, hook_list in _hooks.items():
        suffix = "s" if len(hook_list) != 1 else ""
        lines.append(f"### {event} ({len(hook_list)} handler{suffix})")
        for h in hook_list:
            once_suffix = " (once)" if h.once else ""
            lines.append(f"- `{h.id}` priority={h.priority}{once_suffix}")
        lines.append("")
    if len(_hooks) == 0:
        lines.append("_No hooks registered._")
    return "\n".join(lines)
