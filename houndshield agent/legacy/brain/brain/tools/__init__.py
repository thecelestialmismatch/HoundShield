"""
VedicBrain.AI — Python Tool Registry
Exposes dev tools to the agent: bash, file read/write/glob/grep, web fetch.
These are native Python implementations — no Node.js or Ollama required.
"""
from __future__ import annotations

import asyncio
import glob as _glob
import os
import subprocess
import time
from pathlib import Path
from typing import Any, Callable

import httpx


# ── Tool descriptor (mirrors OpenAI function-calling schema) ──────────────────

class ToolSpec:
    def __init__(
        self,
        name: str,
        description: str,
        parameters: dict[str, Any],
        handler: Callable[..., Any],
    ) -> None:
        self.name = name
        self.description = description
        self.parameters = parameters
        self.handler = handler

    def to_openai_schema(self) -> dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters,
            },
        }


# ── ToolRegistry ──────────────────────────────────────────────────────────────

class ToolRegistry:
    """
    Holds all registered tools and dispatches execution by name.
    """

    def __init__(self) -> None:
        self._tools: dict[str, ToolSpec] = {}

    def register(self, spec: ToolSpec) -> None:
        self._tools[spec.name] = spec

    def get(self, name: str) -> ToolSpec | None:
        return self._tools.get(name)

    def get_specs(
        self,
        allowed: list[str] | None = None,
        denied: list[str] | None = None,
    ) -> list[dict[str, Any]]:
        """Return OpenAI-schema tool specs, filtered by allow/deny lists."""
        specs = []
        for name, tool in self._tools.items():
            if denied and name in denied:
                continue
            if allowed and name not in allowed:
                continue
            specs.append(tool.to_openai_schema())
        return specs

    async def execute(
        self,
        tool_name: str,
        args: dict[str, Any],
        context: dict[str, Any] | None = None,
    ) -> Any:
        spec = self._tools.get(tool_name)
        if spec is None:
            raise ValueError(f"Unknown tool: {tool_name!r}")
        result = spec.handler(**args)
        if asyncio.iscoroutine(result):
            return await result
        return result


# ── Core tool implementations ─────────────────────────────────────────────────

def _bash(command: str, timeout: int = 120) -> dict[str, Any]:
    """Run a shell command, return stdout/stderr/exit_code."""
    start = time.monotonic()
    try:
        proc = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        return {
            "stdout": proc.stdout,
            "stderr": proc.stderr,
            "exit_code": proc.returncode,
            "elapsed_ms": round((time.monotonic() - start) * 1000, 1),
        }
    except subprocess.TimeoutExpired:
        return {"error": f"Command timed out after {timeout}s", "exit_code": -1}
    except Exception as exc:
        return {"error": str(exc), "exit_code": -1}


def _read_file(path: str, offset: int = 0, limit: int = 2000) -> dict[str, Any]:
    """Read a file, returning up to `limit` lines starting at `offset`."""
    p = Path(os.path.expanduser(path))
    if not p.exists():
        return {"error": f"File not found: {path}"}
    try:
        lines = p.read_text(encoding="utf-8", errors="replace").splitlines()
        chunk = lines[offset: offset + limit]
        return {
            "content": "\n".join(chunk),
            "total_lines": len(lines),
            "offset": offset,
            "returned_lines": len(chunk),
        }
    except Exception as exc:
        return {"error": str(exc)}


def _write_file(path: str, content: str) -> dict[str, Any]:
    """Write content to a file (creates parent dirs if needed)."""
    p = Path(os.path.expanduser(path))
    try:
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content, encoding="utf-8")
        return {"success": True, "path": str(p), "bytes_written": len(content.encode())}
    except Exception as exc:
        return {"error": str(exc)}


def _glob_files(pattern: str, path: str = ".") -> dict[str, Any]:
    """Find files matching a glob pattern under `path`."""
    try:
        base = Path(os.path.expanduser(path))
        matches = list(base.glob(pattern))
        return {
            "matches": [str(m) for m in sorted(matches)],
            "count": len(matches),
        }
    except Exception as exc:
        return {"error": str(exc)}


def _grep(pattern: str, path: str = ".", include: str = "*") -> dict[str, Any]:
    """Search for a regex pattern in files under `path`."""
    try:
        result = subprocess.run(
            ["grep", "-rn", "--include", include, pattern, os.path.expanduser(path)],
            capture_output=True,
            text=True,
            timeout=30,
        )
        lines = result.stdout.strip().splitlines()
        return {"matches": lines[:500], "total": len(lines), "truncated": len(lines) > 500}
    except subprocess.TimeoutExpired:
        return {"error": "grep timed out"}
    except Exception as exc:
        return {"error": str(exc)}


async def _web_fetch(url: str, timeout: int = 30) -> dict[str, Any]:
    """Fetch the text content of a URL."""
    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "VedicBrain/1.0"})
            return {
                "url": str(resp.url),
                "status_code": resp.status_code,
                "content": resp.text[:50_000],  # cap at 50KB
                "content_type": resp.headers.get("content-type", ""),
            }
    except Exception as exc:
        return {"error": str(exc)}


# ── Registry builder ──────────────────────────────────────────────────────────

def build_default_registry(
    engine_factory: Any = None,
    mcp_manager: Any = None,
) -> ToolRegistry:
    """
    Build the default tool registry.
    `engine_factory` and `mcp_manager` are optional — accepted for API compatibility
    with the VedicBrain server bootstrap but not required for the built-in tools.
    """
    registry = ToolRegistry()

    registry.register(ToolSpec(
        name="bash",
        description="Run a shell command and return stdout, stderr, and exit code.",
        parameters={
            "type": "object",
            "properties": {
                "command": {"type": "string", "description": "Shell command to execute"},
                "timeout": {"type": "integer", "default": 120, "description": "Timeout in seconds"},
            },
            "required": ["command"],
        },
        handler=_bash,
    ))

    registry.register(ToolSpec(
        name="read_file",
        description="Read a file from disk. Returns file content with line numbers.",
        parameters={
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Absolute or ~ path to the file"},
                "offset": {"type": "integer", "default": 0, "description": "Start line (0-indexed)"},
                "limit": {"type": "integer", "default": 2000, "description": "Max lines to return"},
            },
            "required": ["path"],
        },
        handler=_read_file,
    ))

    registry.register(ToolSpec(
        name="write_file",
        description="Write content to a file, creating parent directories as needed.",
        parameters={
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Absolute or ~ path to write"},
                "content": {"type": "string", "description": "File content to write"},
            },
            "required": ["path", "content"],
        },
        handler=_write_file,
    ))

    registry.register(ToolSpec(
        name="glob",
        description="Find files matching a glob pattern (e.g. '**/*.ts') under a directory.",
        parameters={
            "type": "object",
            "properties": {
                "pattern": {"type": "string", "description": "Glob pattern"},
                "path": {"type": "string", "default": ".", "description": "Root directory to search"},
            },
            "required": ["pattern"],
        },
        handler=_glob_files,
    ))

    registry.register(ToolSpec(
        name="grep",
        description="Search for a regex pattern in files. Returns matching lines with file paths.",
        parameters={
            "type": "object",
            "properties": {
                "pattern": {"type": "string", "description": "Regex to search for"},
                "path": {"type": "string", "default": ".", "description": "Directory to search"},
                "include": {"type": "string", "default": "*", "description": "File glob filter (e.g. '*.py')"},
            },
            "required": ["pattern"],
        },
        handler=_grep,
    ))

    registry.register(ToolSpec(
        name="web_fetch",
        description="Fetch the text content of a URL.",
        parameters={
            "type": "object",
            "properties": {
                "url": {"type": "string", "description": "URL to fetch"},
                "timeout": {"type": "integer", "default": 30, "description": "Timeout in seconds"},
            },
            "required": ["url"],
        },
        handler=_web_fetch,
    ))

    return registry
