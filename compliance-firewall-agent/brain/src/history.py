from __future__ import annotations

import math
import time
from dataclasses import dataclass, field

from .models import StoredMessage, StoredMessageRole

DEFAULT_MAX_MESSAGES = 50
DEFAULT_MAX_TOKENS = 4000


@dataclass
class HistoryEntry:
    role: StoredMessageRole
    content: str
    timestamp: int
    tokens: int | None = None
    tool_call_id: str | None = None
    name: str | None = None


@dataclass
class CompactedHistory:
    messages: list[HistoryEntry]
    dropped_count: int
    summarized: bool


def compact_history(
    messages: list[HistoryEntry],
    max_messages: int | None = None,
    max_tokens: int | None = None,
    keep_system_message: bool | None = None,
) -> CompactedHistory:
    max_messages = max_messages if max_messages is not None else DEFAULT_MAX_MESSAGES
    keep_system = keep_system_message if keep_system_message is not None else True

    if len(messages) <= max_messages:
        return CompactedHistory(messages=messages, dropped_count=0, summarized=False)

    system = [m for m in messages if m.role == "system"] if keep_system else []
    non_system = [m for m in messages if m.role != "system"]

    keep = max_messages - len(system)
    trimmed = non_system[-keep:] if keep > 0 else []
    dropped = len(non_system) - len(trimmed)

    return CompactedHistory(messages=[*system, *trimmed], dropped_count=dropped, summarized=False)


def from_stored_messages(messages: list[StoredMessage]) -> list[HistoryEntry]:
    now = int(time.time() * 1000)
    return [
        HistoryEntry(
            role=m.role,
            content=m.content,
            timestamp=now,
            tool_call_id=m.tool_call_id,
            name=m.name,
        )
        for m in messages
    ]


def to_stored_messages(entries: list[HistoryEntry]) -> list[StoredMessage]:
    return [
        StoredMessage(role=e.role, content=e.content, tool_call_id=e.tool_call_id, name=e.name) for e in entries
    ]


def estimate_tokens(text: str) -> int:
    return math.ceil(len(text.split()) * 1.3)


def estimate_total_tokens(messages: list[HistoryEntry]) -> int:
    return sum(estimate_tokens(m.content) for m in messages)


class HistoryManager:
    def __init__(self, max_messages: int = DEFAULT_MAX_MESSAGES) -> None:
        self._entries: list[HistoryEntry] = []
        self._max_messages = max_messages

    def add(self, entry: HistoryEntry) -> None:
        self._entries.append(entry)
        if len(self._entries) > self._max_messages:
            compacted = compact_history(self._entries, max_messages=self._max_messages)
            self._entries = compacted.messages

    def add_user(self, content: str) -> None:
        self.add(HistoryEntry(role="user", content=content, timestamp=int(time.time() * 1000)))

    def add_assistant(self, content: str) -> None:
        self.add(HistoryEntry(role="assistant", content=content, timestamp=int(time.time() * 1000)))

    def add_system(self, content: str) -> None:
        self._entries = [
            HistoryEntry(role="system", content=content, timestamp=int(time.time() * 1000)),
            *[e for e in self._entries if e.role != "system"],
        ]

    def get_all(self) -> list[HistoryEntry]:
        return [*self._entries]

    def get_last(self, n: int) -> list[HistoryEntry]:
        return self._entries[-n:] if n > 0 else []

    def clear(self) -> None:
        self._entries = [e for e in self._entries if e.role == "system"]

    def to_stored_messages(self) -> list[StoredMessage]:
        return to_stored_messages(self._entries)

    def estimated_tokens(self) -> int:
        return estimate_total_tokens(self._entries)

    @property
    def length(self) -> int:
        return len(self._entries)
