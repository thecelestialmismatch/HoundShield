"""
VedicBrain.AI — Permission & Safety System
Hook-based permission validation for every tool call.
Pattern sourced from claw-code clean-room port.
"""
from __future__ import annotations

import fnmatch
import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Awaitable


class PermissionLevel(str, Enum):
    ALLOW = "allow"
    DENY = "deny"
    ASK = "ask"       # requires interactive approval


class RiskLevel(str, Enum):
    LOW = "low"         # read-only, reversible
    MEDIUM = "medium"   # writes files, queries external APIs
    HIGH = "high"       # shell execution, network, process spawn
    CRITICAL = "critical"  # system modification, destructive ops


@dataclass
class PermissionRule:
    """A single permission rule matching tools / paths."""
    tool_pattern: str           # glob pattern: "bash", "file_*", "*"
    risk_levels: set[RiskLevel] = field(default_factory=lambda: {RiskLevel.HIGH, RiskLevel.CRITICAL})
    permission: PermissionLevel = PermissionLevel.ASK
    path_pattern: str | None = None  # optional path restriction
    reason: str = ""

    def matches_tool(self, tool_name: str) -> bool:
        return fnmatch.fnmatch(tool_name.lower(), self.tool_pattern.lower())

    def matches_path(self, path: str) -> bool:
        if self.path_pattern is None:
            return True
        return bool(re.match(self.path_pattern, path))


@dataclass
class PermissionRequest:
    tool_name: str
    risk_level: RiskLevel
    description: str
    args: dict[str, Any]
    session_id: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "tool_name": self.tool_name,
            "risk_level": self.risk_level.value,
            "description": self.description,
            "args": self.args,
            "session_id": self.session_id,
        }


@dataclass
class PermissionDecision:
    granted: bool
    reason: str = ""
    remember: bool = False  # remember for this session


# Async callback for interactive approval
ApprovalCallback = Callable[[PermissionRequest], Awaitable[PermissionDecision]]


class PermissionContext:
    """
    Stateful permission context for a single session.
    Tracks granted/denied permissions within session scope.
    """

    # Default rules — safe for automated/API mode
    DEFAULT_RULES: list[PermissionRule] = [
        PermissionRule("bash",       {RiskLevel.HIGH, RiskLevel.CRITICAL}, PermissionLevel.ALLOW),
        PermissionRule("file_write", {RiskLevel.MEDIUM},                   PermissionLevel.ALLOW),
        PermissionRule("file_edit",  {RiskLevel.MEDIUM},                   PermissionLevel.ALLOW),
        PermissionRule("web_fetch",  {RiskLevel.MEDIUM},                   PermissionLevel.ALLOW),
        PermissionRule("web_search", {RiskLevel.LOW},                      PermissionLevel.ALLOW),
        PermissionRule("file_read",  {RiskLevel.LOW},                      PermissionLevel.ALLOW),
        PermissionRule("glob",       {RiskLevel.LOW},                      PermissionLevel.ALLOW),
        PermissionRule("grep",       {RiskLevel.LOW},                      PermissionLevel.ALLOW),
        PermissionRule("agent",      {RiskLevel.HIGH},                     PermissionLevel.ALLOW),
        PermissionRule("mcp_*",      {RiskLevel.MEDIUM},                   PermissionLevel.ALLOW),
        PermissionRule("*",          {RiskLevel.LOW},                      PermissionLevel.ALLOW),
    ]

    def __init__(
        self,
        rules: list[PermissionRule] | None = None,
        approval_callback: ApprovalCallback | None = None,
        auto_approve: bool = True,   # True = API mode (headless)
    ) -> None:
        self.rules = rules or list(self.DEFAULT_RULES)
        self.approval_callback = approval_callback
        self.auto_approve = auto_approve
        self._session_grants: set[str] = set()
        self._session_denies: set[str] = set()

    def _make_key(self, tool_name: str) -> str:
        return tool_name.lower()

    def _find_rule(self, tool_name: str) -> PermissionRule | None:
        for rule in self.rules:
            if rule.matches_tool(tool_name):
                return rule
        return None

    async def check(self, request: PermissionRequest) -> PermissionDecision:
        key = self._make_key(request.tool_name)

        # Session memory
        if key in self._session_grants:
            return PermissionDecision(granted=True, reason="session grant")
        if key in self._session_denies:
            return PermissionDecision(granted=False, reason="session deny")

        rule = self._find_rule(request.tool_name)
        if rule is None:
            # No rule found — default allow for LOW risk, deny otherwise
            if request.risk_level == RiskLevel.LOW:
                return PermissionDecision(granted=True, reason="default allow low-risk")
            return PermissionDecision(granted=False, reason="no permission rule matched")

        if rule.permission == PermissionLevel.ALLOW:
            return PermissionDecision(granted=True, reason="rule allow")

        if rule.permission == PermissionLevel.DENY:
            return PermissionDecision(granted=False, reason="rule deny")

        # ASK — use callback or auto-approve in headless mode
        if self.auto_approve:
            return PermissionDecision(granted=True, reason="auto-approve headless")

        if self.approval_callback:
            decision = await self.approval_callback(request)
            if decision.remember:
                if decision.granted:
                    self._session_grants.add(key)
                else:
                    self._session_denies.add(key)
            return decision

        # No callback — deny by default in interactive-ask mode
        return PermissionDecision(granted=False, reason="no approval callback configured")

    def deny_tool(self, tool_name: str) -> None:
        """Explicitly deny a tool for this session."""
        self._session_denies.add(self._make_key(tool_name))

    def allow_tool(self, tool_name: str) -> None:
        """Explicitly allow a tool for this session."""
        self._session_grants.add(self._make_key(tool_name))

    @classmethod
    def api_mode(cls) -> "PermissionContext":
        """Fully permissive context for API/headless use."""
        return cls(auto_approve=True)

    @classmethod
    def restricted_mode(cls, allowed_tools: list[str]) -> "PermissionContext":
        """Only allow specific tools; deny everything else."""
        rules = [
            PermissionRule(t, set(RiskLevel), PermissionLevel.ALLOW)
            for t in allowed_tools
        ]
        rules.append(PermissionRule("*", set(RiskLevel), PermissionLevel.DENY, reason="restricted mode"))
        ctx = cls(rules=rules, auto_approve=True)
        return ctx
