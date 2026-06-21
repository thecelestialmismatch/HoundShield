from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from typing import Literal
from urllib.parse import quote

RuntimeMode = Literal["standard", "direct", "deep_link", "remote", "ssh", "embedded"]
LatencyClass = Literal["realtime", "fast", "standard"]


@dataclass
class DirectModeReport:
    mode: RuntimeMode
    endpoint: str
    supports_streaming: bool
    supports_tools: bool
    max_tokens: int
    latency_class: LatencyClass
    notes: str


@dataclass
class RuntimeModeReport:
    active_mode: RuntimeMode
    available: list[DirectModeReport]
    recommended: RuntimeMode


RUNTIME_MODES: list[DirectModeReport] = [
    DirectModeReport(
        mode="standard",
        endpoint="/api/brain-ai/execute",
        supports_streaming=True,
        supports_tools=True,
        max_tokens=8192,
        latency_class="realtime",
        notes="Default mode. SSE streaming. Works on Vercel and Docker.",
    ),
    DirectModeReport(
        mode="direct",
        endpoint="/api/brain-ai/execute",
        supports_streaming=False,
        supports_tools=True,
        max_tokens=8192,
        latency_class="fast",
        notes="Non-streaming. Good for programmatic use via Brain AI SDK.",
    ),
    DirectModeReport(
        mode="deep_link",
        endpoint="/chat",
        supports_streaming=True,
        supports_tools=False,
        max_tokens=4096,
        latency_class="fast",
        notes="Launched via URL: /chat?q=<prompt>. Pre-fills chat input.",
    ),
    DirectModeReport(
        mode="remote",
        endpoint="/api/gateway/stream",
        supports_streaming=True,
        supports_tools=False,
        max_tokens=16384,
        latency_class="standard",
        notes="Routes through Kaelus compliance gateway with full scanning.",
    ),
    DirectModeReport(
        mode="embedded",
        endpoint="https://gateway.kaelus.online/v1",
        supports_streaming=True,
        supports_tools=False,
        max_tokens=16384,
        latency_class="standard",
        notes="SDK mode — drop-in replacement for OpenAI/Anthropic API base URL.",
    ),
]


def get_active_mode() -> RuntimeMode:
    mode = os.environ.get("BRAIN_AI_MODE")
    if mode:
        return mode  # type: ignore[return-value]
    return "standard"


def get_runtime_mode_report() -> RuntimeModeReport:
    active_mode = get_active_mode()
    return RuntimeModeReport(active_mode=active_mode, available=RUNTIME_MODES, recommended="standard")


def get_mode_config(mode: RuntimeMode) -> DirectModeReport | None:
    return next((m for m in RUNTIME_MODES if m.mode == mode), None)


@dataclass
class DirectConnectRequest:
    url: str
    method: str
    body: str


def run_direct_connect(prompt: str, session_id: str) -> DirectConnectRequest:
    return DirectConnectRequest(
        url="/api/brain-ai/execute",
        method="POST",
        body=json.dumps({"sessionId": session_id, "message": prompt}),
    )


def run_deep_link(prompt: str, base_url: str = "") -> str:
    return f"{base_url}/chat?q={quote(prompt)}"


def render_runtime_modes() -> str:
    lines = ["## Brain AI Runtime Modes\n"]
    for m in RUNTIME_MODES:
        stream = "streaming" if m.supports_streaming else "sync"
        tools = "tools ✅" if m.supports_tools else "no tools"
        lines.append(f"### {m.mode}")
        lines.append(f"- **Endpoint:** `{m.endpoint}`")
        lines.append(f"- **Mode:** {stream} · {tools} · max {m.max_tokens} tokens")
        lines.append(f"- **Latency:** {m.latency_class}")
        lines.append(f"- {m.notes}")
        lines.append("")
    return "\n".join(lines)
