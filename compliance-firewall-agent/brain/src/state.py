from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Literal

AgentStatus = Literal["idle", "initializing", "ready", "processing", "streaming", "error", "shutdown"]


@dataclass
class ToolCallState:
    tool_name: str
    call_id: str
    started_at: int
    ended_at: int | None = None
    success: bool | None = None
    error_message: str | None = None


@dataclass
class TurnState:
    turn_index: int
    user_message: str
    started_at: int
    tokens_used: int = 0
    tool_calls: list[ToolCallState] = field(default_factory=list)
    response_preview: str = ""
    ended_at: int | None = None


@dataclass
class SessionState:
    session_id: str
    status: AgentStatus
    created_at: int
    last_activity_at: int
    turn_count: int = 0
    total_tokens: int = 0
    current_turn: TurnState | None = None
    turns: list[TurnState] = field(default_factory=list)
    error_count: int = 0
    last_error: str | None = None


@dataclass
class GlobalAgentState:
    status: AgentStatus
    active_sessions: dict[str, SessionState]
    total_sessions_created: int
    total_turns_processed: int
    total_tokens_consumed: int
    started_at: int
    last_activity_at: int


_global_state = GlobalAgentState(
    status="idle",
    active_sessions={},
    total_sessions_created=0,
    total_turns_processed=0,
    total_tokens_consumed=0,
    started_at=int(time.time() * 1000),
    last_activity_at=int(time.time() * 1000),
)


@dataclass
class GlobalStateSnapshot:
    status: AgentStatus
    total_sessions_created: int
    total_turns_processed: int
    total_tokens_consumed: int
    started_at: int
    last_activity_at: int
    session_count: int


def get_global_state() -> GlobalStateSnapshot:
    return GlobalStateSnapshot(
        status=_global_state.status,
        total_sessions_created=_global_state.total_sessions_created,
        total_turns_processed=_global_state.total_turns_processed,
        total_tokens_consumed=_global_state.total_tokens_consumed,
        started_at=_global_state.started_at,
        last_activity_at=_global_state.last_activity_at,
        session_count=len(_global_state.active_sessions),
    )


def set_global_status(status: AgentStatus) -> None:
    _global_state.status = status
    _global_state.last_activity_at = int(time.time() * 1000)


def create_session_state(session_id: str) -> SessionState:
    state = SessionState(
        session_id=session_id,
        status="idle",
        created_at=int(time.time() * 1000),
        last_activity_at=int(time.time() * 1000),
        turn_count=0,
        total_tokens=0,
        current_turn=None,
        turns=[],
        error_count=0,
        last_error=None,
    )
    _global_state.active_sessions[session_id] = state
    _global_state.total_sessions_created += 1
    return state


def get_session_state(session_id: str) -> SessionState | None:
    return _global_state.active_sessions.get(session_id)


def update_session_status(session_id: str, status: AgentStatus) -> None:
    s = _global_state.active_sessions.get(session_id)
    if not s:
        return
    s.status = status
    s.last_activity_at = int(time.time() * 1000)
    _global_state.last_activity_at = int(time.time() * 1000)


def start_turn(session_id: str, user_message: str) -> TurnState:
    s = _global_state.active_sessions.get(session_id)
    if not s:
        raise ValueError(f"Session not found: {session_id}")

    turn = TurnState(
        turn_index=s.turn_count,
        user_message=user_message,
        started_at=int(time.time() * 1000),
        tokens_used=0,
        tool_calls=[],
        response_preview="",
    )

    s.current_turn = turn
    s.status = "processing"
    s.last_activity_at = int(time.time() * 1000)
    return turn


def end_turn(session_id: str, tokens_used: int, response_preview: str) -> None:
    s = _global_state.active_sessions.get(session_id)
    if not s or not s.current_turn:
        return

    turn = s.current_turn
    turn.ended_at = int(time.time() * 1000)
    turn.tokens_used = tokens_used
    turn.response_preview = response_preview[:200]

    s.turns.append(turn)
    s.current_turn = None
    s.turn_count += 1
    s.total_tokens += tokens_used
    s.status = "ready"
    s.last_activity_at = int(time.time() * 1000)

    _global_state.total_turns_processed += 1
    _global_state.total_tokens_consumed += tokens_used
    _global_state.last_activity_at = int(time.time() * 1000)


def record_tool_call(session_id: str, tool_name: str, call_id: str) -> None:
    s = _global_state.active_sessions.get(session_id)
    if not s or not s.current_turn:
        return
    s.current_turn.tool_calls.append(
        ToolCallState(tool_name=tool_name, call_id=call_id, started_at=int(time.time() * 1000))
    )


def resolve_tool_call(session_id: str, call_id: str, success: bool, error_message: str | None = None) -> None:
    s = _global_state.active_sessions.get(session_id)
    if not s or not s.current_turn:
        return
    tc = next((t for t in s.current_turn.tool_calls if t.call_id == call_id), None)
    if tc:
        tc.ended_at = int(time.time() * 1000)
        tc.success = success
        tc.error_message = error_message


def record_error(session_id: str, message: str) -> None:
    s = _global_state.active_sessions.get(session_id)
    if not s:
        return
    s.error_count += 1
    s.last_error = message
    s.status = "error"
    s.last_activity_at = int(time.time() * 1000)


def remove_session(session_id: str) -> bool:
    if session_id in _global_state.active_sessions:
        del _global_state.active_sessions[session_id]
        return True
    return False


def render_state_report(session_id: str | None = None) -> str:
    if session_id:
        s = _global_state.active_sessions.get(session_id)
        if not s:
            return f"Session `{session_id}` not found."
        lines = [
            f"## Session State: {session_id}",
            f"- Status: **{s.status}**",
            f"- Turns: {s.turn_count}",
            f"- Tokens: {s.total_tokens}",
            f"- Errors: {s.error_count}",
        ]
        if s.last_error:
            lines.append(f"- Last error: {s.last_error}")
        return "\n".join(lines)

    g = get_global_state()
    return "\n".join(
        [
            "## Brain AI Global State",
            f"- Status: **{g.status}**",
            f"- Active sessions: {g.session_count}",
            f"- Total sessions: {g.total_sessions_created}",
            f"- Total turns: {g.total_turns_processed}",
            f"- Total tokens: {g.total_tokens_consumed}",
        ]
    )
