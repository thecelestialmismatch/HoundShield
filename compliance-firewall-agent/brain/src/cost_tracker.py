from __future__ import annotations

import time
from dataclasses import dataclass, field


@dataclass
class ModelPricing:
    input_per_1k: float
    output_per_1k: float


BRAIN_AI_PRICING: dict[str, ModelPricing] = {
    "google/gemini-flash-1.5": ModelPricing(input_per_1k=0, output_per_1k=0),
    "meta-llama/llama-3.3-70b-instruct:free": ModelPricing(input_per_1k=0, output_per_1k=0),
    "deepseek/deepseek-chat": ModelPricing(input_per_1k=0, output_per_1k=0),
    "qwen/qwen-2.5-72b-instruct:free": ModelPricing(input_per_1k=0, output_per_1k=0),
    "microsoft/phi-3-medium-128k-instruct:free": ModelPricing(input_per_1k=0, output_per_1k=0),
    "anthropic/claude-sonnet-4-6": ModelPricing(input_per_1k=0.003, output_per_1k=0.015),
    "openai/gpt-4o": ModelPricing(input_per_1k=0.005, output_per_1k=0.015),
    "openai/gpt-4o-mini": ModelPricing(input_per_1k=0.00015, output_per_1k=0.0006),
    "google/gemini-pro-1.5": ModelPricing(input_per_1k=0.00125, output_per_1k=0.005),
    "anthropic/claude-3-haiku": ModelPricing(input_per_1k=0.00025, output_per_1k=0.00125),
}


@dataclass
class CostEntry:
    session_id: str
    model: str
    input_tokens: int
    output_tokens: int
    cost_usd: float
    timestamp: int


@dataclass
class ModelCostBucket:
    tokens: int
    cost_usd: float


@dataclass
class SessionCostSummary:
    session_id: str
    total_input_tokens: int
    total_output_tokens: int
    total_cost_usd: float
    by_model: dict[str, ModelCostBucket]
    entries: list[CostEntry]


_cost_store: dict[str, list[CostEntry]] = {}


def calculate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    pricing = BRAIN_AI_PRICING.get(model, ModelPricing(input_per_1k=0.001, output_per_1k=0.002))
    return (input_tokens / 1000) * pricing.input_per_1k + (output_tokens / 1000) * pricing.output_per_1k


def record_cost(session_id: str, model: str, input_tokens: int, output_tokens: int) -> CostEntry:
    entry = CostEntry(
        session_id=session_id,
        model=model,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        cost_usd=calculate_cost(model, input_tokens, output_tokens),
        timestamp=int(time.time() * 1000),
    )

    existing = _cost_store.get(session_id, [])
    _cost_store[session_id] = [*existing, entry]
    return entry


def get_session_cost_summary(session_id: str) -> SessionCostSummary:
    entries = _cost_store.get(session_id, [])
    by_model: dict[str, ModelCostBucket] = {}

    total_input_tokens = 0
    total_output_tokens = 0
    total_cost_usd = 0.0

    for entry in entries:
        total_input_tokens += entry.input_tokens
        total_output_tokens += entry.output_tokens
        total_cost_usd += entry.cost_usd

        existing = by_model.get(entry.model, ModelCostBucket(tokens=0, cost_usd=0))
        by_model[entry.model] = ModelCostBucket(
            tokens=existing.tokens + entry.input_tokens + entry.output_tokens,
            cost_usd=existing.cost_usd + entry.cost_usd,
        )

    return SessionCostSummary(
        session_id=session_id,
        total_input_tokens=total_input_tokens,
        total_output_tokens=total_output_tokens,
        total_cost_usd=total_cost_usd,
        by_model=by_model,
        entries=entries,
    )


def get_total_cost_all_sessions() -> float:
    total = 0.0
    for entries in _cost_store.values():
        for entry in entries:
            total += entry.cost_usd
    return total


def format_cost_usd(cost_usd: float) -> str:
    if cost_usd == 0:
        return "$0.00"
    if cost_usd < 0.001:
        return f"${cost_usd * 1000:.3f}m"
    return f"${cost_usd:.4f}"
