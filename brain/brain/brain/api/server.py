"""
VedicBrain.AI — FastAPI Application Server
Production-grade, OpenAI-compatible API.
"""
from __future__ import annotations

import time
from contextlib import asynccontextmanager
from typing import Any

import structlog
import uvicorn
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from vedic_brain.api.routes import chat_router, keys_router, models_router, set_engine
from vedic_brain.config import settings
from vedic_brain.core.context import ConversationContext
from vedic_brain.core.hooks import build_default_registry
from vedic_brain.core.permissions import PermissionContext
from vedic_brain.core.query_engine import QueryEngine, QueryEngineConfig
from vedic_brain.services.inference import InferenceService
from vedic_brain.tools import build_default_registry as build_tools

log = structlog.get_logger("vedic_brain.server")


# ── Startup / Shutdown ────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize all services at startup, clean up at shutdown."""
    log.info("vedic_brain_starting", version=settings.app_version,
             backend=settings.model_backend, model=settings.active_model_name)

    # Inference service
    inference = InferenceService.from_settings()
    health = await inference.health_check()
    if health["status"] == "healthy":
        log.info("inference_ready", model=health["model"], latency_ms=health["latency_ms"])
    else:
        log.warning("inference_unhealthy", error=health.get("error"))

    # MCP (optional)
    mcp_manager = None
    if settings.mcp_enabled and settings.mcp_servers:
        from vedic_brain.services.mcp_client import MCPClientManager
        mcp_manager = await MCPClientManager.from_config(settings.mcp_servers)
        log.info("mcp_started", servers=len(settings.mcp_servers))

    # Tool registry
    hook_registry, usage_hook = build_default_registry()

    # Engine factory (used by AgentTool for sub-agents)
    def engine_factory() -> QueryEngine:
        tools = build_tools(engine_factory=engine_factory, mcp_manager=mcp_manager)
        return QueryEngine(
            inference_service=inference,
            tool_registry=tools,
            hook_registry=hook_registry,
            permission_context=PermissionContext.api_mode(),
        )

    tools = build_tools(engine_factory=engine_factory, mcp_manager=mcp_manager)
    engine = QueryEngine(
        inference_service=inference,
        tool_registry=tools,
        hook_registry=hook_registry,
        permission_context=PermissionContext.api_mode(),
    )

    set_engine(engine)
    app.state.engine = engine
    app.state.inference = inference
    app.state.usage_hook = usage_hook

    log.info("vedic_brain_ready", tools=len(tools), host=settings.api_host, port=settings.api_port)
    yield

    # Shutdown
    if mcp_manager:
        await mcp_manager.stop_all()
    log.info("vedic_brain_stopped")


# ── App ───────────────────────────────────────────────────────────────────────

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="VedicBrain.AI — Sovereign General-Purpose AI API for Kaelus.Online",
        docs_url="/docs" if settings.api_docs_enabled else None,
        redoc_url="/redoc" if settings.api_docs_enabled else None,
        openapi_url="/openapi.json" if settings.api_docs_enabled else None,
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.api_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Request timing middleware
    @app.middleware("http")
    async def timing_middleware(request: Request, call_next: Any) -> Any:
        start = time.monotonic()
        response = await call_next(request)
        elapsed = (time.monotonic() - start) * 1000
        response.headers["X-Response-Time"] = f"{elapsed:.1f}ms"
        response.headers["X-VedicBrain-Version"] = settings.app_version
        return response

    # Routers
    app.include_router(chat_router)
    app.include_router(models_router)
    app.include_router(keys_router)

    # ── Health / Meta ─────────────────────────────────────────────────────────

    @app.get("/health", tags=["System"])
    async def health() -> dict:
        inference: InferenceService = request_app_state_inference(app)
        h = await inference.health_check() if inference else {"status": "unknown"}
        return {
            "status": "ok" if h.get("status") == "healthy" else "degraded",
            "version": settings.app_version,
            "model": settings.active_model_name,
            "backend": settings.model_backend.value,
            "inference": h,
        }

    @app.get("/", tags=["System"])
    async def root() -> dict:
        return {
            "name": settings.app_name,
            "version": settings.app_version,
            "docs": "/docs",
            "api": "/v1/chat/completions",
        }

    # ── Error Handlers ────────────────────────────────────────────────────────

    @app.exception_handler(Exception)
    async def global_error_handler(request: Request, exc: Exception) -> JSONResponse:
        log.error("unhandled_error", path=request.url.path, error=str(exc))
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": {"message": "Internal server error", "type": "server_error"}},
        )

    return app


def request_app_state_inference(app: FastAPI) -> InferenceService | None:
    return getattr(app.state, "inference", None)


app = create_app()


def run() -> None:
    uvicorn.run(
        "vedic_brain.api.server:app",
        host=settings.api_host,
        port=settings.api_port,
        workers=settings.api_workers if not settings.api_reload else 1,
        reload=settings.api_reload,
        log_level=settings.log_level.value,
        access_log=True,
    )


if __name__ == "__main__":
    run()
