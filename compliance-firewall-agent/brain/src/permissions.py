from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Literal

PermissionLevel = Literal["deny", "ask", "allow"]
PermissionTargetType = Literal["tool", "command", "data", "api"]
SubscriptionTier = Literal["free", "pro", "growth", "enterprise", "agency"]


@dataclass
class PermissionRule:
    target: str
    target_type: PermissionTargetType
    level: PermissionLevel
    reason: str | None = None


@dataclass
class PermissionContext:
    session_id: str
    user_id: str | None = None
    subscription_tier: SubscriptionTier | None = None
    is_demo: bool | None = None
    allowed_tools: list[str] | None = None
    denied_tools: list[str] | None = None


TIER_TOOL_PERMISSIONS: dict[str, list[str]] = {
    "free": ["web-search", "compliance-scan", "knowledge-base"],
    "pro": ["web-search", "web-browse", "compliance-scan", "knowledge-base", "file-analyze", "data-query"],
    "growth": [
        "web-search",
        "web-browse",
        "compliance-scan",
        "knowledge-base",
        "file-analyze",
        "data-query",
        "generate-chart",
    ],
    "enterprise": [
        "web-search",
        "web-browse",
        "compliance-scan",
        "knowledge-base",
        "file-analyze",
        "data-query",
        "generate-chart",
        "code-execute",
    ],
    "agency": [
        "web-search",
        "web-browse",
        "compliance-scan",
        "knowledge-base",
        "file-analyze",
        "data-query",
        "generate-chart",
        "code-execute",
    ],
}

ALWAYS_DENIED_TOOLS: set[str] = set()
ALWAYS_ALLOWED_TOOLS: set[str] = {"compliance-scan", "knowledge-base"}


@dataclass
class PermissionCheckResult:
    allowed: bool
    reason: str | None = None


class PermissionManager:
    def __init__(self, context: PermissionContext) -> None:
        self.rules: list[PermissionRule] = []
        self.context = context
        self._init_default_rules()

    def _init_default_rules(self) -> None:
        tier = self.context.subscription_tier or "free"
        allowed_tools = TIER_TOOL_PERMISSIONS.get(tier, TIER_TOOL_PERMISSIONS["free"])

        for tool in allowed_tools:
            self.rules.append(PermissionRule(target=tool, target_type="tool", level="allow"))

        for tool in ALWAYS_ALLOWED_TOOLS:
            if not any(r.target == tool for r in self.rules):
                self.rules.append(PermissionRule(target=tool, target_type="tool", level="allow"))

        for tool in ALWAYS_DENIED_TOOLS:
            self.rules.append(
                PermissionRule(
                    target=tool,
                    target_type="tool",
                    level="deny",
                    reason="This tool is not permitted in any context.",
                )
            )

        for tool in self.context.denied_tools or []:
            self.rules.insert(0, PermissionRule(target=tool, target_type="tool", level="deny"))
        for tool in self.context.allowed_tools or []:
            self.rules.insert(0, PermissionRule(target=tool, target_type="tool", level="allow"))

    def check_tool(self, tool_name: str) -> PermissionCheckResult:
        if tool_name in ALWAYS_DENIED_TOOLS:
            return PermissionCheckResult(allowed=False, reason="Tool is globally denied.")

        if tool_name in ALWAYS_ALLOWED_TOOLS:
            return PermissionCheckResult(allowed=True)

        if self.context.is_demo:
            demo_allowed = {"web-search", "compliance-scan", "knowledge-base"}
            allowed = tool_name in demo_allowed
            return PermissionCheckResult(
                allowed=allowed,
                reason=None
                if allowed
                else f"Tool '{tool_name}' requires a paid subscription. Sign up at kaelus.online.",
            )

        match = next((r for r in self.rules if r.target == tool_name or r.target == "*"), None)
        if match is None:
            return PermissionCheckResult(allowed=False, reason=f"Tool '{tool_name}' is not permitted for your plan.")

        return PermissionCheckResult(
            allowed=match.level == "allow",
            reason=(match.reason or f"Tool '{tool_name}' is denied.") if match.level == "deny" else None,
        )

    def check_command(self, command_name: str) -> PermissionCheckResult:
        match = next(
            (r for r in self.rules if r.target_type == "command" and (r.target == command_name or r.target == "*")),
            None,
        )
        if match is None:
            return PermissionCheckResult(allowed=True)
        return PermissionCheckResult(
            allowed=match.level == "allow",
            reason=match.reason if match.level == "deny" else None,
        )

    def get_allowed_tools(self) -> list[str]:
        return [r.target for r in self.rules if r.target_type == "tool" and r.level == "allow" and r.target != "*"]

    def add_rule(self, rule: PermissionRule) -> None:
        self.rules.insert(0, rule)

    def get_context(self) -> PermissionContext:
        return self.context


def create_permission_manager(context: PermissionContext) -> PermissionManager:
    return PermissionManager(context)


def default_permission_context(session_id: str) -> PermissionContext:
    return PermissionContext(
        session_id=session_id,
        subscription_tier="free",
        is_demo=not os.environ.get("NEXT_PUBLIC_SUPABASE_URL"),
    )
