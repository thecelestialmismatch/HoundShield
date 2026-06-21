from __future__ import annotations

import json
import os
import re
import time
from dataclasses import replace

from .models import StoredMessage, StoredSession

SESSION_DIR = ".brain-sessions"
MAX_MEMORY_SESSIONS = 500

_memory_store: dict[str, StoredSession] = {}


def _is_filesystem_available() -> bool:
    try:
        if os.environ.get("NEXT_RUNTIME") == "edge":
            return False
        return True
    except Exception:
        return False


def _ensure_session_dir() -> None:
    if not _is_filesystem_available():
        return
    try:
        os.makedirs(SESSION_DIR, exist_ok=True)
    except Exception:
        pass


def _session_path(session_id: str) -> str:
    safe = re.sub(r"[^a-zA-Z0-9-_]", "_", session_id)
    return os.path.join(SESSION_DIR, f"{safe}.json")


def _session_to_dict(session: StoredSession) -> dict:
    return {
        "sessionId": session.session_id,
        "messages": [
            {
                "role": m.role,
                "content": m.content,
                "toolCallId": m.tool_call_id,
                "name": m.name,
            }
            for m in session.messages
        ],
        "inputTokens": session.input_tokens,
        "outputTokens": session.output_tokens,
        "createdAt": session.created_at,
        "updatedAt": session.updated_at,
        "metadata": session.metadata,
    }


def _dict_to_session(data: dict) -> StoredSession:
    return StoredSession(
        session_id=data["sessionId"],
        messages=[
            StoredMessage(
                role=m["role"],
                content=m["content"],
                tool_call_id=m.get("toolCallId"),
                name=m.get("name"),
            )
            for m in data.get("messages", [])
        ],
        input_tokens=data.get("inputTokens", 0),
        output_tokens=data.get("outputTokens", 0),
        created_at=data.get("createdAt", 0),
        updated_at=data.get("updatedAt", 0),
        metadata=data.get("metadata", {}),
    )


async def save_session(session: StoredSession) -> None:
    updated = replace(session, updated_at=int(time.time() * 1000))

    if _is_filesystem_available():
        try:
            _ensure_session_dir()
            with open(_session_path(session.session_id), "w", encoding="utf-8") as f:
                json.dump(_session_to_dict(updated), f, indent=2)
            return
        except Exception:
            pass

    if len(_memory_store) >= MAX_MEMORY_SESSIONS:
        oldest = min(_memory_store.items(), key=lambda kv: kv[1].updated_at, default=None)
        if oldest:
            del _memory_store[oldest[0]]
    _memory_store[session.session_id] = updated


async def load_session(session_id: str) -> StoredSession | None:
    if _is_filesystem_available():
        try:
            with open(_session_path(session_id), encoding="utf-8") as f:
                raw = json.load(f)
            return _dict_to_session(raw)
        except Exception:
            pass

    return _memory_store.get(session_id)


async def delete_session(session_id: str) -> None:
    if _is_filesystem_available():
        try:
            os.unlink(_session_path(session_id))
        except Exception:
            pass
    _memory_store.pop(session_id, None)


async def list_session_ids() -> list[str]:
    if _is_filesystem_available():
        try:
            files = os.listdir(SESSION_DIR)
            return [f[: -len(".json")] for f in files if f.endswith(".json")]
        except Exception:
            pass
    return list(_memory_store.keys())


def create_session(session_id: str, system_prompt: str | None = None) -> StoredSession:
    now = int(time.time() * 1000)
    messages = [StoredMessage(role="system", content=system_prompt)] if system_prompt else []
    return StoredSession(
        session_id=session_id,
        messages=messages,
        input_tokens=0,
        output_tokens=0,
        created_at=now,
        updated_at=now,
        metadata={},
    )


def append_message(session: StoredSession, message: StoredMessage) -> StoredSession:
    messages = [*session.messages, message]
    if len(messages) > 100:
        system = [m for m in messages if m.role == "system"]
        rest = [m for m in messages if m.role != "system"][-97:]
        return replace(session, messages=[*system, *rest])
    return replace(session, messages=messages)


def add_token_usage(session: StoredSession, input_tokens: int, output_tokens: int) -> StoredSession:
    return replace(
        session,
        input_tokens=session.input_tokens + input_tokens,
        output_tokens=session.output_tokens + output_tokens,
    )
