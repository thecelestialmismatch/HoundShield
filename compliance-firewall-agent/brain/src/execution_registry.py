from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any, Literal

ExecutionStatus = Literal["pending", "running", "success", "error", "cancelled"]
ExecutionType = Literal["tool_call", "agent_turn", "command", "query"]


@dataclass
class ExecutionRecord:
    id: str
    session_id: str
    type: ExecutionType
    name: str
    input: Any
    status: ExecutionStatus
    started_at: int
    output: Any = None
    completed_at: int | None = None
    duration_ms: int | None = None
    error_message: str | None = None
    input_tokens: int | None = None
    output_tokens: int | None = None
    cost_usd: float | None = None


_registry: dict[str, list[ExecutionRecord]] = {}
MAX_PER_SESSION = 1000

_counter = 0


def _to_base36(num: int) -> str:
    if num == 0:
        return "0"
    digits = "0123456789abcdefghijklmnopqrstuvwxyz"
    result = ""
    n = abs(num)
    while n:
        n, rem = divmod(n, 36)
        result = digits[rem] + result
    return result


def _generate_id() -> str:
    global _counter
    _counter += 1
    return f"exec-{int(time.time() * 1000)}-{_to_base36(_counter)}"


def start_execution(session_id: str, type_: ExecutionType, name: str, input_: Any) -> ExecutionRecord:
    record = ExecutionRecord(
        id=_generate_id(),
        session_id=session_id,
        type=type_,
        name=name,
        input=input_,
        status="running",
        started_at=int(time.time() * 1000),
    )

    existing = _registry.get(session_id, [])
    if len(existing) >= MAX_PER_SESSION:
        existing.pop(0)
    _registry[session_id] = [*existing, record]
    return record


def complete_execution(
    id_: str,
    session_id: str,
    output: Any,
    input_tokens: int | None = None,
    output_tokens: int | None = None,
    cost_usd: float | None = None,
) -> ExecutionRecord | None:
    entries = _registry.get(session_id)
    if entries is None:
        return None

    idx = next((i for i, e in enumerate(entries) if e.id == id_), -1)
    if idx == -1:
        return None

    now = int(time.time() * 1000)
    existing = entries[idx]
    updated = ExecutionRecord(
        id=existing.id,
        session_id=existing.session_id,
        type=existing.type,
        name=existing.name,
        input=existing.input,
        status="success",
        started_at=existing.started_at,
        output=output,
        completed_at=now,
        duration_ms=now - existing.started_at,
        error_message=existing.error_message,
        input_tokens=input_tokens if input_tokens is not None else existing.input_tokens,
        output_tokens=output_tokens if output_tokens is not None else existing.output_tokens,
        cost_usd=cost_usd if cost_usd is not None else existing.cost_usd,
    )

    entries[idx] = updated
    return updated


def fail_execution(id_: str, session_id: str, error_message: str) -> ExecutionRecord | None:
    entries = _registry.get(session_id)
    if entries is None:
        return None

    idx = next((i for i, e in enumerate(entries) if e.id == id_), -1)
    if idx == -1:
        return None

    now = int(time.time() * 1000)
    existing = entries[idx]
    updated = ExecutionRecord(
        id=existing.id,
        session_id=existing.session_id,
        type=existing.type,
        name=existing.name,
        input=existing.input,
        status="error",
        started_at=existing.started_at,
        output=existing.output,
        completed_at=now,
        duration_ms=now - existing.started_at,
        error_message=error_message,
        input_tokens=existing.input_tokens,
        output_tokens=existing.output_tokens,
        cost_usd=existing.cost_usd,
    )

    entries[idx] = updated
    return updated


def get_session_executions(session_id: str) -> list[ExecutionRecord]:
    return _registry.get(session_id, [])


def get_execution(id_: str, session_id: str) -> ExecutionRecord | None:
    entries = _registry.get(session_id)
    if not entries:
        return None
    return next((e for e in entries if e.id == id_), None)


@dataclass
class SessionStats:
    total: int
    success: int
    error: int
    total_tokens: int
    total_cost_usd: float
    avg_duration_ms: float


def get_session_stats(session_id: str) -> SessionStats:
    entries = _registry.get(session_id, [])
    completed = [e for e in entries if e.completed_at is not None]

    return SessionStats(
        total=len(entries),
        success=len([e for e in entries if e.status == "success"]),
        error=len([e for e in entries if e.status == "error"]),
        total_tokens=sum((e.input_tokens or 0) + (e.output_tokens or 0) for e in entries),
        total_cost_usd=sum(e.cost_usd or 0 for e in entries),
        avg_duration_ms=(sum(e.duration_ms or 0 for e in completed) / len(completed)) if completed else 0,
    )


def clear_session_executions(session_id: str) -> None:
    _registry.pop(session_id, None)
