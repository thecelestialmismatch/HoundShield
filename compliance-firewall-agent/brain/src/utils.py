from __future__ import annotations

import asyncio
import json
import random
import re
import time
from dataclasses import dataclass
from typing import Any, Awaitable, Callable, Literal, TypeVar
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

T = TypeVar("T")


def generate_id(prefix: str = "id") -> str:
    rand = "".join(random.choices("0123456789abcdefghijklmnopqrstuvwxyz", k=8))
    ts = _to_base36(int(time.time() * 1000))
    return f"{prefix}_{ts}{rand}"


def _to_base36(num: int) -> str:
    if num == 0:
        return "0"
    digits = "0123456789abcdefghijklmnopqrstuvwxyz"
    result = ""
    n = abs(num)
    while n:
        n, rem = divmod(n, 36)
        result = digits[rem] + result
    return result


def generate_session_id() -> str:
    return generate_id("sess")


def generate_call_id() -> str:
    return generate_id("call")


def truncate(text: str, max_len: int, suffix: str = "…") -> str:
    if len(text) <= max_len:
        return text
    return text[: max_len - len(suffix)] + suffix


def strip_markdown(md: str) -> str:
    text = re.sub(r"#{1,6}\s+", "", md)
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    text = re.sub(r"\*(.*?)\*", r"\1", text)
    text = re.sub(r"`{1,3}[^`]*`{1,3}", "", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"^[-*+]\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"^\d+\.\s+", "", text, flags=re.MULTILINE)
    return text.strip()


def count_words(text: str) -> int:
    return len([w for w in text.strip().split() if w])


def estimate_reading_time_min(text: str) -> int:
    return -(-count_words(text) // 200)


def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = text.strip()
    text = re.sub(r"\s+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text


def capitalize(text: str) -> str:
    if not text:
        return ""
    return text[0].upper() + text[1:]


def title_case(text: str) -> str:
    return " ".join(capitalize(w.lower()) for w in re.split(r"\s+", text) if w != "")


def format_number(n: float, decimals: int = 0) -> str:
    return f"{n:,.{decimals}f}"


def format_bytes(num_bytes: float) -> str:
    if num_bytes < 1024:
        return f"{int(num_bytes)} B"
    if num_bytes < 1024 * 1024:
        return f"{num_bytes / 1024:.1f} KB"
    return f"{num_bytes / (1024 * 1024):.2f} MB"


def format_duration_ms(ms: float) -> str:
    if ms < 1000:
        return f"{int(ms)}ms"
    if ms < 60_000:
        return f"{ms / 1000:.1f}s"
    minutes = int(ms // 60_000)
    seconds = round((ms % 60_000) / 1000)
    return f"{minutes}m {seconds}s"


def clamp(value: float, min_value: float, max_value: float) -> float:
    return min(max(value, min_value), max_value)


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def omit(obj: dict[str, Any], keys: list[str]) -> dict[str, Any]:
    return {k: v for k, v in obj.items() if k not in keys}


def pick(obj: dict[str, Any], keys: list[str]) -> dict[str, Any]:
    return {k: obj[k] for k in keys if k in obj}


def deep_clone(value: T) -> T:
    return json.loads(json.dumps(value))


def is_plain_object(value: Any) -> bool:
    return isinstance(value, dict)


def unique(arr: list[T]) -> list[T]:
    seen: list[T] = []
    for item in arr:
        if item not in seen:
            seen.append(item)
    return seen


def group_by(arr: list[T], key: Callable[[T], str]) -> dict[str, list[T]]:
    result: dict[str, list[T]] = {}
    for item in arr:
        k = key(item)
        result.setdefault(k, []).append(item)
    return result


def chunk(arr: list[T], size: int) -> list[list[T]]:
    return [arr[i : i + size] for i in range(0, len(arr), size)]


def sort_by(arr: list[T], key: Callable[[T], Any], direction: str = "asc") -> list[T]:
    sorted_arr = sorted(arr, key=key)
    return sorted_arr if direction == "asc" else list(reversed(sorted_arr))


async def sleep(ms: float) -> None:
    await asyncio.sleep(ms / 1000)


async def retry(fn: Callable[[], Awaitable[T]], max_attempts: int = 3, delay_ms: float = 500) -> T:
    last_error: BaseException | None = None
    for attempt in range(1, max_attempts + 1):
        try:
            return await fn()
        except BaseException as err:  # noqa: BLE001 - faithful port of catch-all
            last_error = err
            if attempt < max_attempts:
                await sleep(delay_ms * attempt)
    assert last_error is not None
    raise last_error


async def with_timeout(coro: Awaitable[T], ms: float) -> T:
    try:
        return await asyncio.wait_for(coro, timeout=ms / 1000)
    except asyncio.TimeoutError as exc:
        raise TimeoutError(f"Timed out after {ms}ms") from exc


@dataclass
class ReplLine:
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: int


def build_repl_prompt(lines: list[ReplLine]) -> str:
    parts = []
    for line in lines:
        prefix = "You" if line.role == "user" else "Brain AI" if line.role == "assistant" else "System"
        parts.append(f"**{prefix}:** {line.content}")
    return "\n\n".join(parts)


def parse_deep_link_query(url: str) -> str | None:
    try:
        parsed = urlparse(url)
        params = parse_qs(parsed.query)
        values = params.get("q")
        return values[0] if values else None
    except Exception:
        return None


def build_deep_link(base_url: str, prompt: str) -> str:
    parsed = urlparse(base_url)
    new_path = "/chat"
    query = urlencode({"q": prompt})
    return urlunparse((parsed.scheme, parsed.netloc, new_path, "", query, ""))


def mask_pii(text: str) -> str:
    text = re.sub(r"\b\d{3}-\d{2}-\d{4}\b", "***-**-****", text)
    text = re.sub(r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b", "**** **** **** ****", text)
    text = re.sub(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", "[EMAIL]", text)
    text = re.sub(r"\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b", "[PHONE]", text)
    return text


def is_cui_keyword(text: str) -> bool:
    lower = text.lower()
    keywords = [
        "controlled unclassified",
        "cui",
        "itar",
        "fouo",
        "official use only",
        "export controlled",
        "sensitive but unclassified",
        "sbu",
    ]
    return any(k in lower for k in keywords)
