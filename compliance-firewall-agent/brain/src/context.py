from __future__ import annotations

import os
import time
from dataclasses import dataclass, field, replace
from typing import Any

from .models import QueryEngineConfig, default_query_engine_config
from .permissions import (
    PermissionContext,
    PermissionManager,
    SubscriptionTier,
    create_permission_manager,
)


@dataclass
class BrainAIContext:
    session_id: str
    subscription_tier: SubscriptionTier
    is_demo: bool
    model: str
    max_token_budget: int
    max_turns: int
    api_key: str
    permission_manager: PermissionManager
    engine_config: QueryEngineConfig
    metadata: dict[str, Any]
    created_at: int
    user_id: str | None = None
    organization_id: str | None = None


@dataclass
class ContextOptions:
    session_id: str
    user_id: str | None = None
    organization_id: str | None = None
    subscription_tier: SubscriptionTier | None = None
    model: str | None = None
    api_key: str | None = None
    max_token_budget: int | None = None
    max_turns: int | None = None
    metadata: dict[str, Any] | None = None


def create_context(options: ContextOptions) -> BrainAIContext:
    tier: SubscriptionTier = options.subscription_tier or "free"
    is_demo = not os.environ.get("NEXT_PUBLIC_SUPABASE_URL")

    perm_context = PermissionContext(
        session_id=options.session_id,
        user_id=options.user_id,
        subscription_tier=tier,
        is_demo=is_demo,
    )

    base_config = default_query_engine_config()
    engine_config = QueryEngineConfig(
        max_turns=options.max_turns if options.max_turns is not None else 15,
        max_budget_tokens=options.max_token_budget if options.max_token_budget is not None else 8192,
        model=options.model or os.environ.get("BRAIN_AI_MODEL") or "google/gemini-flash-1.5",
        system_prompt=base_config.system_prompt,
        temperature=base_config.temperature,
    )

    return BrainAIContext(
        session_id=options.session_id,
        user_id=options.user_id,
        organization_id=options.organization_id,
        subscription_tier=tier,
        is_demo=is_demo,
        model=engine_config.model,
        max_token_budget=engine_config.max_budget_tokens,
        max_turns=engine_config.max_turns,
        api_key=options.api_key or os.environ.get("OPENROUTER_API_KEY") or "",
        permission_manager=create_permission_manager(perm_context),
        engine_config=engine_config,
        metadata=options.metadata or {},
        created_at=int(time.time() * 1000),
    )


def update_context(ctx: BrainAIContext, updates: ContextOptions | None = None) -> BrainAIContext:
    updates = updates or ContextOptions(session_id=ctx.session_id)
    merged = ContextOptions(
        session_id=updates.session_id or ctx.session_id,
        user_id=updates.user_id if updates.user_id is not None else ctx.user_id,
        organization_id=updates.organization_id if updates.organization_id is not None else ctx.organization_id,
        subscription_tier=updates.subscription_tier or ctx.subscription_tier,
        model=updates.model or ctx.model,
        api_key=updates.api_key or ctx.api_key,
        max_token_budget=updates.max_token_budget if updates.max_token_budget is not None else ctx.max_token_budget,
        max_turns=updates.max_turns if updates.max_turns is not None else ctx.max_turns,
        metadata=updates.metadata if updates.metadata is not None else ctx.metadata,
    )
    return create_context(merged)


def context_to_engine_config(ctx: BrainAIContext) -> QueryEngineConfig:
    return replace(
        ctx.engine_config,
        model=ctx.model,
        max_budget_tokens=ctx.max_token_budget,
        max_turns=ctx.max_turns,
    )
