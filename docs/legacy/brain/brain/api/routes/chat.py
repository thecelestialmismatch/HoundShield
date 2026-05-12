"""
VedicBrain.AI — /v1/chat/completions
OpenAI-compatible chat completions endpoint (streaming + non-streaming).
"""
from __future__ import annotations

import json
import time
import uuid
from typing import Annotated, Any, AsyncIterator

import structlog
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field

from vedic_brain.api.auth import AuthenticatedUser, get_current_user
from vedic_brain.api.rate_limiter import enforce_rate_limit
from vedic_brain.config import settings
from vedic_brain.core.context import ConversationContext, TokenBudget
from vedic_brain.core.query_engine import EventType, QueryEngine, QueryEngineConfig, StreamEvent
from vedic_brain.core.session import get_session_store

log = structlog.get_logger("vedic_brain.api.chat")
router = APIRouter()


# ── Request / Response Models ────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str
    content: str | list[Any]
    name: str | None = None


class ChatCompletionRequest(BaseModel):
    model: str = settings.active_model_name
    messages: list[ChatMessage]
    stream: bool = False
    max_tokens: int | None = None
    temperature: float | None = None
    tools: list[dict[str, Any]] | None = None
    tool_choice: str | None = None
    session_id: str | None = None     # VedicBrain extension: resume session
    system_prompt: str | None = None  # VedicBrain extension: override system
    enable_tools: bool = True         # VedicBrain extension


class ChatCompletionChoice(BaseModel):
    index: int = 0
    message: dict[str, Any]
    finish_reason: str = "stop"


class ChatCompletionResponse(BaseModel):
    id: str = Field(default_factory=lambda: f"chatcmpl-{uuid.uuid4().hex[:12]}")
    object: str = "chat.completion"
    created: int = Field(default_factory=lambda: int(time.time()))
    model: str
    choices: list[ChatCompletionChoice]
    usage: dict[str, int] = Field(default_factory=dict)


# ── Engine factory (set at app startup) ──────────────────────────────────────

_engine: QueryEngine | None = None


def set_engine(engine: QueryEngine) -> None:
    global _engine
    _engine = engine


def get_engine() -> QueryEngine:
    if _engine is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Inference engine not initialized",
        )
    return _engine


# ── Helpers ──────────────────────────────────────────────────────────────────

def _build_context(req: ChatCompletionRequest) -> ConversationContext:
    ctx = ConversationContext(
        token_budget=TokenBudget(context_window=settings.model_context_window),
    )
    # Set system prompt
    system = req.system_prompt or settings.active_model_name  # placeholder
    ctx.system_prompt = req.system_prompt or ""

    # Load messages
    for msg in req.messages:
        if msg.role == "system":
            ctx.system_prompt = str(msg.content)
        else:
            ctx.add_message(msg.role, msg.content)  # type: ignore[arg-type]

    return ctx


async def _stream_response(
    context: ConversationContext,
    engine: QueryEngine,
    config: QueryEngineConfig,
    model: str,
) -> AsyncIterator[str]:
    """Generate SSE chunks in OpenAI streaming format."""
    completion_id = f"chatcmpl-{uuid.uuid4().hex[:12]}"
    created = int(time.time())

    async for event in engine.run(context, config):
        if event.type == EventType.TEXT_DELTA:
            chunk = {
                "id": completion_id,
                "object": "chat.completion.chunk",
                "created": created,
                "model": model,
                "choices": [{"index": 0, "delta": {"content": event.data.get("text", "")},
                              "finish_reason": None}],
            }
            yield f"data: {json.dumps(chunk)}\n\n"

        elif event.type == EventType.TOOL_CALL_START:
            chunk = {
                "id": completion_id,
                "object": "chat.completion.chunk",
                "created": created,
                "model": model,
                "choices": [{"index": 0, "delta": {
                    "tool_calls": [{
                        "index": 0,
                        "id": event.data.get("tool_call_id"),
                        "type": "function",
                        "function": {"name": event.data.get("tool_name"), "arguments": ""},
                    }]
                }, "finish_reason": None}],
            }
            yield f"data: {json.dumps(chunk)}\n\n"

        elif event.type == EventType.STOP:
            usage = event.data.get("usage", {})
            chunk = {
                "id": completion_id,
                "object": "chat.completion.chunk",
                "created": created,
                "model": model,
                "choices": [{"index": 0, "delta": {}, "finish_reason": "stop"}],
                "usage": {
                    "prompt_tokens": usage.get("input_tokens", 0),
                    "completion_tokens": usage.get("output_tokens", 0),
                    "total_tokens": usage.get("input_tokens", 0) + usage.get("output_tokens", 0),
                },
            }
            yield f"data: {json.dumps(chunk)}\n\n"
            break

    yield "data: [DONE]\n\n"


# ── Route ─────────────────────────────────────────────────────────────────────

@router.post("/v1/chat/completions")
async def chat_completions(
    req: ChatCompletionRequest,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> Any:
    # Rate limit
    rl_headers = await enforce_rate_limit(user.user_id, user.rpm_limit)

    engine = get_engine()
    context = _build_context(req)
    cfg = QueryEngineConfig(
        max_tokens=req.max_tokens,
        temperature=req.temperature,
        stream=req.stream,
        enable_tools=req.enable_tools,
    )

    log.info("chat_request", user=user.user_id, tier=user.tier,
             messages=len(req.messages), stream=req.stream)

    if req.stream:
        return StreamingResponse(
            _stream_response(context, engine, cfg, req.model),
            media_type="text/event-stream",
            headers={
                **rl_headers,
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )

    # Non-streaming
    result = await engine.run_non_streaming(context, cfg)
    usage = result.get("usage", {})
    response = ChatCompletionResponse(
        model=req.model,
        choices=[ChatCompletionChoice(
            message={"role": "assistant", "content": result.get("content", "")},
            finish_reason=result.get("stop_reason", "stop"),
        )],
        usage={
            "prompt_tokens": usage.get("input_tokens", 0),
            "completion_tokens": usage.get("output_tokens", 0),
            "total_tokens": usage.get("input_tokens", 0) + usage.get("output_tokens", 0),
        },
    )
    return JSONResponse(content=response.model_dump(), headers=rl_headers)
