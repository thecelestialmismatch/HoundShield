"""
VedicBrain.AI — Central Configuration
All settings loaded from environment variables / .env
"""
from __future__ import annotations

import secrets
from enum import Enum
from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class ModelBackend(str, Enum):
    VLLM = "vllm"
    OLLAMA = "ollama"
    OPENAI_COMPAT = "openai_compat"  # any OpenAI-compatible endpoint
    LLAMA_CPP = "llama_cpp"          # sovereign — loads GGUF directly, zero API cost


class LogLevel(str, Enum):
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Identity ────────────────────────────────────────────────────────────
    app_name: str = "VedicBrain.AI"
    app_version: str = "1.0.0"
    environment: Literal["development", "staging", "production"] = "development"

    # ── Model Backend ────────────────────────────────────────────────────────
    model_backend: ModelBackend = ModelBackend.LLAMA_CPP  # sovereign default — no API cost
    model_name: str = "qwen3-coder"                    # used for display / logging only
    model_base_url: str = "http://localhost:11434/v1"  # fallback (not used for llama_cpp)
    model_api_key: str = "not-required"                # vLLM / Ollama ignore this

    # llama-cpp-python (sovereign, zero-cost) — reads GGUF blob directly from disk
    llama_model_path: str = (
        "~/.ollama/models/blobs/"
        "sha256-1194192cf2a187eb02722edcc3f77b11d21f537048ce04b67ccf8ba78863006a"
    )
    llama_n_ctx: int = 32_768      # context window (tokens); tune up to 131072 if RAM allows
    llama_n_gpu_layers: int = -1   # -1 = offload ALL layers to Metal GPU (Apple Silicon)
    model_context_window: int = 131_072
    model_max_tokens: int = 16_384
    model_temperature: float = 0.0
    model_top_p: float = 1.0
    model_stream: bool = True

    # vLLM-specific
    vllm_base_url: str = "http://localhost:8000/v1"
    vllm_model: str = "Qwen/Qwen2.5-72B-Instruct"
    vllm_tensor_parallel_size: int = 4
    vllm_gpu_memory_utilization: float = 0.90

    # ── API Server ───────────────────────────────────────────────────────────
    api_host: str = "0.0.0.0"
    api_port: int = 8080
    api_workers: int = 4
    api_reload: bool = False
    api_cors_origins: list[str] = Field(default=["*"])
    api_docs_enabled: bool = True

    # ── Security ─────────────────────────────────────────────────────────────
    secret_key: str = Field(default_factory=lambda: secrets.token_hex(32))
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    api_key_prefix: str = "vb-"

    # ── Database ─────────────────────────────────────────────────────────────
    database_url: str = "sqlite+aiosqlite:///./vedic_brain.db"
    database_pool_size: int = 10
    database_echo: bool = False

    # ── Redis ────────────────────────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"
    redis_enabled: bool = False  # falls back to in-memory if False

    # ── Rate Limiting ────────────────────────────────────────────────────────
    rate_limit_free_rpm: int = 20
    rate_limit_starter_rpm: int = 100
    rate_limit_pro_rpm: int = 500
    rate_limit_enterprise_rpm: int = 2000

    # ── Billing ──────────────────────────────────────────────────────────────
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""

    # ── MCP ──────────────────────────────────────────────────────────────────
    mcp_enabled: bool = True
    mcp_servers: list[dict] = Field(default_factory=list)

    # ── Tools ────────────────────────────────────────────────────────────────
    bash_timeout_seconds: int = 120
    bash_max_output_chars: int = 50_000
    web_fetch_timeout_seconds: int = 30
    web_search_max_results: int = 10
    file_read_max_bytes: int = 10 * 1024 * 1024  # 10MB
    agent_max_depth: int = 5                      # sub-agent nesting limit

    # ── Session / Memory ────────────────────────────────────────────────────
    session_ttl_seconds: int = 60 * 60 * 24  # 24h
    max_turns_per_session: int = 200
    context_compact_threshold: float = 0.85  # compact when 85% of ctx window used
    memdir_path: str = ".vedic_sessions"

    # ── Telemetry ────────────────────────────────────────────────────────────
    otel_enabled: bool = False
    otel_endpoint: str = "http://localhost:4317"
    log_level: LogLevel = LogLevel.INFO

    @field_validator("model_base_url", "vllm_base_url", mode="before")
    @classmethod
    def strip_trailing_slash(cls, v: str) -> str:
        return v.rstrip("/")

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def active_model_base_url(self) -> str:
        if self.model_backend == ModelBackend.VLLM:
            return self.vllm_base_url
        return self.model_base_url

    @property
    def active_model_name(self) -> str:
        if self.model_backend == ModelBackend.VLLM:
            return self.vllm_model
        if self.model_backend == ModelBackend.LLAMA_CPP:
            from pathlib import Path
            return Path(self.llama_model_path).name
        return self.model_name


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
