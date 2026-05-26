"""
VedicBrain.AI — Session Store (memdir pattern)
Persistent, async session storage backed by SQLite or filesystem.
"""
from __future__ import annotations

import json
import os
import time
import uuid
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any


@dataclass
class SessionRecord:
    session_id: str
    api_key_id: str | None
    user_id: str | None
    messages: list[dict[str, Any]]
    system_prompt: str
    metadata: dict[str, Any]
    created_at: float
    updated_at: float
    turn_count: int
    input_tokens: int
    output_tokens: int
    model: str
    status: str = "active"   # active | archived | error

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "SessionRecord":
        return cls(**d)


class FilesystemSessionStore:
    """
    Lightweight JSON-backed session store.
    Suitable for single-node deployment. Swap for DB-backed store in prod cluster.
    """

    def __init__(self, base_dir: str = ".vedic_sessions") -> None:
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _path(self, session_id: str) -> Path:
        # Shard into subdirs to avoid FS limits
        shard = session_id[:2]
        d = self.base_dir / shard
        d.mkdir(exist_ok=True)
        return d / f"{session_id}.json"

    async def create(
        self,
        api_key_id: str | None = None,
        user_id: str | None = None,
        system_prompt: str = "",
        model: str = "",
        metadata: dict[str, Any] | None = None,
    ) -> SessionRecord:
        now = time.time()
        record = SessionRecord(
            session_id=str(uuid.uuid4()),
            api_key_id=api_key_id,
            user_id=user_id,
            messages=[],
            system_prompt=system_prompt,
            metadata=metadata or {},
            created_at=now,
            updated_at=now,
            turn_count=0,
            input_tokens=0,
            output_tokens=0,
            model=model,
        )
        await self._write(record)
        return record

    async def get(self, session_id: str) -> SessionRecord | None:
        path = self._path(session_id)
        if not path.exists():
            return None
        try:
            data = json.loads(path.read_text())
            return SessionRecord.from_dict(data)
        except Exception:
            return None

    async def update(self, record: SessionRecord) -> None:
        record.updated_at = time.time()
        await self._write(record)

    async def delete(self, session_id: str) -> bool:
        path = self._path(session_id)
        if path.exists():
            path.unlink()
            return True
        return False

    async def list_sessions(
        self,
        user_id: str | None = None,
        api_key_id: str | None = None,
        limit: int = 50,
    ) -> list[SessionRecord]:
        results: list[SessionRecord] = []
        for json_file in sorted(self.base_dir.rglob("*.json"), key=os.path.getmtime, reverse=True):
            if len(results) >= limit:
                break
            try:
                data = json.loads(json_file.read_text())
                rec = SessionRecord.from_dict(data)
                if user_id and rec.user_id != user_id:
                    continue
                if api_key_id and rec.api_key_id != api_key_id:
                    continue
                results.append(rec)
            except Exception:
                continue
        return results

    async def _write(self, record: SessionRecord) -> None:
        path = self._path(record.session_id)
        path.write_text(json.dumps(record.to_dict(), indent=2))

    async def append_message(
        self,
        session_id: str,
        role: str,
        content: Any,
        **kwargs: Any,
    ) -> SessionRecord | None:
        record = await self.get(session_id)
        if record is None:
            return None
        msg: dict[str, Any] = {"role": role, "content": content, "timestamp": time.time()}
        msg.update(kwargs)
        record.messages.append(msg)
        record.turn_count += 1
        await self.update(record)
        return record

    async def add_usage(
        self,
        session_id: str,
        input_tokens: int,
        output_tokens: int,
    ) -> None:
        record = await self.get(session_id)
        if record:
            record.input_tokens += input_tokens
            record.output_tokens += output_tokens
            await self.update(record)


# Global default store instance (replaced in tests / multi-node setup)
_default_store: FilesystemSessionStore | None = None


def get_session_store() -> FilesystemSessionStore:
    global _default_store
    if _default_store is None:
        from vedic_brain.config import settings
        _default_store = FilesystemSessionStore(settings.memdir_path)
    return _default_store
