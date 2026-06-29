"""
VedicBrain.AI — Local Inference Service
Serves qwen3-coder directly via llama-cpp-python.

Zero API cost. No token limits. No usage limits.
No Ollama daemon required — loads the GGUF blob directly.
"""
from __future__ import annotations

import asyncio
import json
import logging
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any, AsyncIterator

log = logging.getLogger("vedic_brain.inference")


# ── Supported backends ────────────────────────────────────────────────────────

class InferenceService:
    """
    Abstract base. Concrete backends: LlamaCppService, OpenAICompatService.
    factory: InferenceService.from_settings() → picks the right one.
    """

    async def health_check(self) -> dict[str, Any]:
        raise NotImplementedError

    async def stream_chat(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
        max_tokens: int = 4096,
        temperature: float = 0.0,
    ) -> AsyncIterator[dict[str, Any]]:
        raise NotImplementedError

    @classmethod
    def from_settings(cls) -> "InferenceService":
        from vedic_brain.config.settings import settings, ModelBackend
        if settings.model_backend == ModelBackend.LLAMA_CPP:
            return LlamaCppService.from_settings()
        return OpenAICompatService.from_settings()


# ── llama-cpp-python (sovereign, zero-cost) ───────────────────────────────────

class LlamaCppService(InferenceService):
    """
    Loads qwen3-coder.gguf directly via llama-cpp-python.
    The GGUF blob lives at ~/.ollama/models/blobs/sha256-... — no Ollama daemon.
    """

    def __init__(self, model_path: str, n_ctx: int, n_gpu_layers: int, verbose: bool = False):
        from llama_cpp import Llama  # type: ignore[import]
        log.info("loading_model", path=model_path, n_ctx=n_ctx, n_gpu_layers=n_gpu_layers)
        self._model_path = model_path
        self._n_ctx = n_ctx
        # chat_format=None → auto-detect from GGUF (qwen3 embeds its template)
        self._llm = Llama(
            model_path=model_path,
            n_ctx=n_ctx,
            n_gpu_layers=n_gpu_layers,
            verbose=verbose,
            chat_format=None,
        )
        log.info("model_loaded", path=Path(model_path).name)

    @classmethod
    def from_settings(cls) -> "LlamaCppService":
        from vedic_brain.config.settings import settings
        path = settings.llama_model_path
        if not path or not Path(path).exists():
            raise RuntimeError(
                f"Model not found at: {path!r}\n"
                "Set LLAMA_MODEL_PATH in brain/.env to the absolute path of your GGUF file.\n"
                "Default: ~/.ollama/models/blobs/sha256-1194192cf2a187eb02722edcc3f77b11d21f537048ce04b67ccf8ba78863006a"
            )
        return cls(
            model_path=path,
            n_ctx=settings.llama_n_ctx,
            n_gpu_layers=settings.llama_n_gpu_layers,
        )

    async def health_check(self) -> dict[str, Any]:
        start = time.monotonic()
        # Tiny health probe — verify model responds
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                lambda: self._llm.create_chat_completion(
                    messages=[{"role": "user", "content": "hi"}],
                    max_tokens=1,
                    temperature=0.0,
                )
            )
            latency_ms = round((time.monotonic() - start) * 1000, 1)
            return {"status": "healthy", "model": Path(self._model_path).name,
                    "latency_ms": latency_ms, "backend": "llama_cpp"}
        except Exception as exc:
            return {"status": "unhealthy", "error": str(exc), "backend": "llama_cpp"}

    async def stream_chat(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
        max_tokens: int = 4096,
        temperature: float = 0.0,
    ) -> AsyncIterator[dict[str, Any]]:
        loop = asyncio.get_event_loop()
        queue: asyncio.Queue[dict[str, Any] | None] = asyncio.Queue()

        def _run_sync() -> None:
            """Execute llama.cpp streaming in a thread, push chunks to queue."""
            try:
                kwargs: dict[str, Any] = {
                    "messages": messages,
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                    "stream": True,
                }
                # Tool/function calling — pass spec if model supports it
                if tools:
                    kwargs["tools"] = tools
                    kwargs["tool_choice"] = "auto"

                stream = self._llm.create_chat_completion(**kwargs)
                input_tokens = 0
                output_tokens = 0

                for chunk in stream:
                    delta = chunk.get("choices", [{}])[0].get("delta", {})
                    finish = chunk.get("choices", [{}])[0].get("finish_reason")

                    # Text delta
                    content = delta.get("content")
                    if content:
                        loop.call_soon_threadsafe(
                            queue.put_nowait, {"type": "text_delta", "text": content}
                        )
                        output_tokens += 1  # rough count

                    # Tool call
                    tool_calls = delta.get("tool_calls")
                    if tool_calls:
                        for tc in tool_calls:
                            loop.call_soon_threadsafe(
                                queue.put_nowait,
                                {"type": "tool_call", "tool_call": {
                                    "id": tc.get("id", str(uuid.uuid4())),
                                    "type": "function",
                                    "function": tc.get("function", {}),
                                }}
                            )

                    # Usage (approximate — llama.cpp streams usage in last chunk)
                    usage = chunk.get("usage")
                    if usage:
                        input_tokens = usage.get("prompt_tokens", input_tokens)
                        output_tokens = usage.get("completion_tokens", output_tokens)

                    if finish:
                        loop.call_soon_threadsafe(
                            queue.put_nowait,
                            {
                                "type": "usage",
                                "input_tokens": input_tokens,
                                "output_tokens": output_tokens,
                            }
                        )
                        loop.call_soon_threadsafe(
                            queue.put_nowait,
                            {"type": "finish", "finish_reason": finish}
                        )

            except Exception as exc:
                loop.call_soon_threadsafe(
                    queue.put_nowait, {"type": "error", "error": str(exc)}
                )
            finally:
                loop.call_soon_threadsafe(queue.put_nowait, None)  # sentinel

        loop.run_in_executor(None, _run_sync)

        while True:
            chunk = await queue.get()
            if chunk is None:
                break
            yield chunk


# ── OpenAI-compatible (any external endpoint, kept for flexibility) ───────────

class OpenAICompatService(InferenceService):
    """
    Talks to any OpenAI-compatible endpoint via httpx.
    Use MODEL_BACKEND=openai_compat + MODEL_BASE_URL=http://... if you want
    to point at vLLM, LM Studio, or any other server instead.
    """

    def __init__(self, base_url: str, api_key: str, model: str):
        import httpx  # type: ignore[import]
        self._base_url = base_url.rstrip("/")
        self._model = model
        self._client = httpx.AsyncClient(
            base_url=self._base_url,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=120.0,
        )

    @classmethod
    def from_settings(cls) -> "OpenAICompatService":
        from vedic_brain.config.settings import settings
        return cls(
            base_url=settings.model_base_url,
            api_key=settings.model_api_key,
            model=settings.model_name,
        )

    async def health_check(self) -> dict[str, Any]:
        start = time.monotonic()
        try:
            resp = await self._client.get("/health", timeout=5.0)
            latency_ms = round((time.monotonic() - start) * 1000, 1)
            return {"status": "healthy", "model": self._model,
                    "latency_ms": latency_ms, "backend": "openai_compat"}
        except Exception as exc:
            return {"status": "unhealthy", "error": str(exc), "backend": "openai_compat"}

    async def stream_chat(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
        max_tokens: int = 4096,
        temperature: float = 0.0,
    ) -> AsyncIterator[dict[str, Any]]:
        payload: dict[str, Any] = {
            "model": self._model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "stream": True,
        }
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"

        async with self._client.stream("POST", "/v1/chat/completions", json=payload) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if not line.startswith("data: "):
                    continue
                data = line[6:]
                if data == "[DONE]":
                    break
                try:
                    chunk = json.loads(data)
                except json.JSONDecodeError:
                    continue

                delta = chunk.get("choices", [{}])[0].get("delta", {})
                finish = chunk.get("choices", [{}])[0].get("finish_reason")

                content = delta.get("content")
                if content:
                    yield {"type": "text_delta", "text": content}

                tool_calls = delta.get("tool_calls")
                if tool_calls:
                    for tc in tool_calls:
                        yield {"type": "tool_call", "tool_call": {
                            "id": tc.get("id", str(uuid.uuid4())),
                            "type": "function",
                            "function": tc.get("function", {}),
                        }}

                if finish:
                    usage = chunk.get("usage", {})
                    yield {
                        "type": "usage",
                        "input_tokens": usage.get("prompt_tokens", 0),
                        "output_tokens": usage.get("completion_tokens", 0),
                    }
                    yield {"type": "finish", "finish_reason": finish}
