"""
VedicBrain.AI — Authentication & API Key Management
JWT-based auth + hashed API keys stored in SQLite.
"""
from __future__ import annotations

import hashlib
import secrets
import time
import uuid
from dataclasses import dataclass, field
from typing import Annotated, Any

import structlog
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from vedic_brain.config import settings

log = structlog.get_logger("vedic_brain.auth")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)


# ── Tiers ────────────────────────────────────────────────────────────────────

class Tier:
    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    ENTERPRISE = "enterprise"

TIER_RPM = {
    Tier.FREE: settings.rate_limit_free_rpm,
    Tier.STARTER: settings.rate_limit_starter_rpm,
    Tier.PRO: settings.rate_limit_pro_rpm,
    Tier.ENTERPRISE: settings.rate_limit_enterprise_rpm,
}


# ── In-memory Key Store (swap for DB in production) ──────────────────────────

@dataclass
class APIKeyRecord:
    key_id: str
    name: str
    hashed_key: str
    user_id: str
    tier: str
    created_at: float
    last_used_at: float | None = None
    is_active: bool = True
    metadata: dict[str, Any] = field(default_factory=dict)


class APIKeyStore:
    """
    In-memory API key store.
    Replace with SQLAlchemy async DB store for production clustering.
    """

    def __init__(self) -> None:
        self._keys: dict[str, APIKeyRecord] = {}         # key_id -> record
        self._hash_index: dict[str, str] = {}            # hash -> key_id
        self._admin_key: str | None = None

        # Create a default admin key on first startup
        admin_raw, admin_record = self._create_key_internal("admin", "admin", Tier.ENTERPRISE)
        self._admin_key = admin_raw
        log.info("admin_api_key_created", key_preview=admin_raw[:20] + "...")

    def create_key(self, name: str, user_id: str, tier: str = Tier.FREE) -> tuple[str, APIKeyRecord]:
        return self._create_key_internal(name, user_id, tier)

    def _create_key_internal(self, name: str, user_id: str, tier: str) -> tuple[str, APIKeyRecord]:
        raw = settings.api_key_prefix + secrets.token_urlsafe(32)
        hashed = self._hash(raw)
        record = APIKeyRecord(
            key_id=str(uuid.uuid4()),
            name=name,
            hashed_key=hashed,
            user_id=user_id,
            tier=tier,
            created_at=time.time(),
        )
        self._keys[record.key_id] = record
        self._hash_index[hashed] = record.key_id
        return raw, record

    def verify(self, raw_key: str) -> APIKeyRecord | None:
        hashed = self._hash(raw_key)
        key_id = self._hash_index.get(hashed)
        if not key_id:
            return None
        record = self._keys.get(key_id)
        if record and record.is_active:
            record.last_used_at = time.time()
            return record
        return None

    def revoke(self, key_id: str) -> bool:
        record = self._keys.get(key_id)
        if record:
            record.is_active = False
            return True
        return False

    def list_keys(self, user_id: str) -> list[APIKeyRecord]:
        return [r for r in self._keys.values() if r.user_id == user_id and r.is_active]

    @staticmethod
    def _hash(raw: str) -> str:
        return hashlib.sha256(raw.encode()).hexdigest()

    @property
    def admin_key(self) -> str | None:
        return self._admin_key


# Global store instance
_key_store = APIKeyStore()


def get_key_store() -> APIKeyStore:
    return _key_store


# ── JWT Utilities ─────────────────────────────────────────────────────────────

def create_access_token(data: dict[str, Any]) -> str:
    to_encode = data.copy()
    expire = time.time() + settings.jwt_access_token_expire_minutes * 60
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, Any] | None:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return None


# ── FastAPI Dependencies ──────────────────────────────────────────────────────

@dataclass
class AuthenticatedUser:
    user_id: str
    key_id: str
    tier: str
    name: str

    @property
    def rpm_limit(self) -> int:
        return TIER_RPM.get(self.tier, TIER_RPM[Tier.FREE])


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Security(bearer_scheme)],
    store: Annotated[APIKeyStore, Depends(get_key_store)],
) -> AuthenticatedUser:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    # Try API key first (starts with prefix)
    if token.startswith(settings.api_key_prefix):
        record = store.verify(token)
        if record:
            return AuthenticatedUser(
                user_id=record.user_id,
                key_id=record.key_id,
                tier=record.tier,
                name=record.name,
            )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")

    # Try JWT
    payload = decode_access_token(token)
    if payload:
        return AuthenticatedUser(
            user_id=payload.get("sub", ""),
            key_id=payload.get("key_id", ""),
            tier=payload.get("tier", Tier.FREE),
            name=payload.get("name", ""),
        )

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
