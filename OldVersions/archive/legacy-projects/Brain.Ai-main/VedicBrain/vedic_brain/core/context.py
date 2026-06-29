"""
VedicBrain.AI — Context Management
Tracks conversation state, token usage, and triggers compaction.
"""
from __future__ import annotations

import time
import uuid
from dataclasses import dataclass, field
from typing import Any, Literal

from pydantic import BaseModel

MessageRole = Literal["system", "user", "assistant", "tool"]


class Message(BaseModel):
    role: MessageRole
    content: str | list[dict[str, Any]]
    tool_call_id: str | None = None
    tool_calls: list[dict[str, Any]] | None = None
    name: str | None = None
    timestamp: float = field(default_factory=time.time)

    model_config = {"arbitrary_types_allowed": True}


@dataclass
class TokenBudget:
    context_window: int
    used_input: int = 0
    used_output: int = 0
    cache_read: int = 0
    cache_write: int = 0

    @property
    def total_used(self) -> int:
        return self.used_input + self.used_output

    @property
    def remaining(self) -> int:
        return max(0, self.context_window - self.used_input)

    @property
    def utilization(self) -> float:
        if self.context_window == 0:
            return 0.0
        return self.used_input / self.context_window

    def add_turn(self, input_tokens: int, output_tokens: int) -> None:
        self.used_input += input_tokens
        self.used_output += output_tokens


@dataclass
class ConversationContext:
    session_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    messages: list[Message] = field(default_factory=list)
    system_prompt: str = ""
    token_budget: TokenBudget = field(default_factory=lambda: TokenBudget(context_window=131_072))
    turn_count: int = 0
    created_at: float = field(default_factory=time.time)
    metadata: dict[str, Any] = field(default_factory=dict)

    def add_message(self, role: MessageRole, content: str | list[dict[str, Any]],
                    **kwargs: Any) -> Message:
        msg = Message(role=role, content=content, timestamp=time.time(), **kwargs)
        self.messages.append(msg)
        return msg

    def add_user(self, content: str) -> Message:
        return self.add_message("user", content)

    def add_assistant(self, content: str,
                      tool_calls: list[dict[str, Any]] | None = None) -> Message:
        return self.add_message("assistant", content, tool_calls=tool_calls)

    def add_tool_result(self, tool_call_id: str, content: str, name: str) -> Message:
        return self.add_message("tool", content, tool_call_id=tool_call_id, name=name)

    def to_api_messages(self) -> list[dict[str, Any]]:
        """Convert to OpenAI-compatible message list."""
        result: list[dict[str, Any]] = []
        if self.system_prompt:
            result.append({"role": "system", "content": self.system_prompt})
        for msg in self.messages:
            d: dict[str, Any] = {"role": msg.role, "content": msg.content}
            if msg.tool_calls:
                d["tool_calls"] = msg.tool_calls
            if msg.tool_call_id:
                d["tool_call_id"] = msg.tool_call_id
            if msg.name:
                d["name"] = msg.name
            result.append(d)
        return result

    def trim_to_fit(self, max_messages: int = 100) -> int:
        """Remove oldest non-system messages when context grows too large.
        Returns number of messages removed."""
        if len(self.messages) <= max_messages:
            return 0
        to_remove = len(self.messages) - max_messages
        self.messages = self.messages[to_remove:]
        return to_remove

    def clone_for_subagent(self, system_prompt: str | None = None) -> "ConversationContext":
        """Create a fresh context for a sub-agent, inheriting system prompt."""
        ctx = ConversationContext(
            system_prompt=system_prompt or self.system_prompt,
            token_budget=TokenBudget(context_window=self.token_budget.context_window),
        )
        ctx.metadata["parent_session_id"] = self.session_id
        return ctx
