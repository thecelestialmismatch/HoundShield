"""VedicBrain.AI — Rate Limiter (in-memory sliding window, Redis-ready)."""
from __future__ import annotations

import time
from collections import defaultdict, deque
from typing import Any

from fastapi import HTTPException, Request, status


class SlidingWindowRateLimiter:
    """
    Per-user sliding window rate limiter.
    Thread-safe enough for asyncio single-process. Swap for Redis in cluster.
    """

    def __init__(self) -> None:
        self._windows: dict[str, deque[float]] = defaultdict(deque)

    def check(self, user_id: str, rpm_limit: int) -> tuple[bool, dict[str, Any]]:
        """
        Returns (allowed, headers_dict).
        Raises nothing — caller decides whether to raise HTTP 429.
        """
        now = time.time()
        window = 60.0  # 1 minute sliding window
        cutoff = now - window

        dq = self._windows[user_id]
        # Remove expired entries
        while dq and dq[0] < cutoff:
            dq.popleft()

        current = len(dq)
        remaining = max(0, rpm_limit - current)
        reset_at = int((dq[0] + window) if dq else now + window)

        headers = {
            "X-RateLimit-Limit": str(rpm_limit),
            "X-RateLimit-Remaining": str(remaining),
            "X-RateLimit-Reset": str(reset_at),
        }

        if current >= rpm_limit:
            return False, headers

        dq.append(now)
        return True, headers

    def reset(self, user_id: str) -> None:
        self._windows.pop(user_id, None)


_limiter = SlidingWindowRateLimiter()


def get_limiter() -> SlidingWindowRateLimiter:
    return _limiter


async def enforce_rate_limit(user_id: str, rpm_limit: int) -> dict[str, Any]:
    """
    Enforce rate limit. Raises HTTP 429 if exceeded.
    Returns rate limit headers to attach to response.
    """
    allowed, headers = _limiter.check(user_id, rpm_limit)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please slow down.",
            headers={**headers, "Retry-After": headers["X-RateLimit-Reset"]},
        )
    return headers
