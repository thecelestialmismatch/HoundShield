from __future__ import annotations

from typing import Any, AsyncGenerator, Callable

from .models import *  # noqa: F401,F403
from .session_store import *  # noqa: F401,F403
from .commands import *  # noqa: F401,F403
from .tools import *  # noqa: F401,F403
from .system_init import *  # noqa: F401,F403
from .manifest import *  # noqa: F401,F403
from .cost_tracker import *  # noqa: F401,F403
from .permissions import *  # noqa: F401,F403
from .history import *  # noqa: F401,F403
from .execution_registry import *  # noqa: F401,F403
from .skills import *  # noqa: F401,F403
from .context import *  # noqa: F401,F403
from .tasks import *  # noqa: F401,F403
from .tool_pool import *  # noqa: F401,F403
from .deferred_init import *  # noqa: F401,F403
from .bootstrap_graph import *  # noqa: F401,F403
from .command_graph import *  # noqa: F401,F403
from .tool_definitions import *  # noqa: F401,F403
from .dialog_launchers import *  # noqa: F401,F403
from .setup import *  # noqa: F401,F403
from .runtime_modes import *  # noqa: F401,F403
from .onboarding_state import *  # noqa: F401,F403
from .prefetch import *  # noqa: F401,F403
from .hooks import *  # noqa: F401,F403
from .state import *  # noqa: F401,F403
from .utils import *  # noqa: F401,F403

from .query_engine import QueryEngineEvent, QueryEnginePort, SubmitOptions
from .runtime import PortRuntime, RuntimeConfig
from .transcript import generate_transcript, format_transcript
from .parity_audit import run_parity_audit
from .query import QueryEngineRuntime
from .system_init import build_system_init_message

# ─── Singletons ────────────────────────────────────────────────────────────

_query_engine: QueryEnginePort | None = None
_runtime: PortRuntime | None = None


def get_query_engine() -> QueryEnginePort:
    """Get the singleton QueryEnginePort instance. Lazily initialized on first access."""
    global _query_engine
    if _query_engine is None:
        import os

        _query_engine = QueryEnginePort(
            {
                "model": os.environ.get("BRAIN_AI_MODEL", "google/gemini-flash-1.5"),
                "max_turns": 15,
                "max_budget_tokens": 8192,
            }
        )
    return _query_engine


def get_runtime() -> PortRuntime:
    """Get the singleton PortRuntime instance. Lazily initialized on first access."""
    global _runtime
    if _runtime is None:
        import os

        _runtime = PortRuntime(
            RuntimeConfig(
                model=os.environ.get("BRAIN_AI_MODEL", "google/gemini-flash-1.5"),
                api_key=os.environ.get("OPENROUTER_API_KEY", ""),
                max_turns=15,
                max_budget_tokens=8192,
                allow_code_execution=False,
            )
        )
    return _runtime


class _BrainAI:
    """
    BrainAI — the unified interface for the entire intelligence layer.

    Usage:
        from brain.src import BrainAI
        async for event in BrainAI.chat(session_id="abc", message="What is CMMC?"):
            ...
    """

    name = "Brain AI"
    version = "1.0.0"
    owner = "Kaelus.online"

    def chat(
        self, session_id: str, message: str, api_key: str | None = None, model: str | None = None
    ) -> AsyncGenerator[QueryEngineEvent, None]:
        """Stream a conversation turn through Brain AI. Sessions are persisted automatically."""
        runtime = get_runtime()
        return runtime.run_turn_loop(session_id, message)

    def route(self, prompt: str):
        """Route a prompt and return scored matches (no LLM call)."""
        return get_runtime().route_prompt(prompt)

    async def bootstrap(self, session_id: str, context: str | None = None):
        """Bootstrap a new session with optional context."""
        return await get_runtime().bootstrap_session(session_id, context)

    def system_init(self):
        """Get the system initialization status."""
        return build_system_init_message()

    def audit(self):
        """Run a parity audit of the Brain AI feature surface."""
        return run_parity_audit()

    def setup(self):
        """Run the workspace setup report."""
        from .setup import run_setup

        return run_setup()

    def query_engine(self) -> QueryEnginePort:
        """Access the query engine directly for advanced use cases."""
        return get_query_engine()

    def runtime(self) -> PortRuntime:
        """Access the runtime directly."""
        return get_runtime()


BrainAI = _BrainAI()


def get_brain_ai() -> _BrainAI:
    return BrainAI


__all__ = [
    "BrainAI",
    "get_brain_ai",
    "get_query_engine",
    "get_runtime",
    "QueryEnginePort",
    "QueryEngineEvent",
    "SubmitOptions",
    "PortRuntime",
    "RuntimeConfig",
    "generate_transcript",
    "format_transcript",
    "run_parity_audit",
    "QueryEngineRuntime",
    "build_system_init_message",
]
