"""VedicBrain.AI — API Key Management Routes."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from vedic_brain.api.auth import (
    APIKeyRecord, APIKeyStore, AuthenticatedUser,
    get_current_user, get_key_store, Tier,
)

router = APIRouter(prefix="/v1/keys", tags=["API Keys"])


class CreateKeyRequest(BaseModel):
    name: str
    tier: str = Tier.FREE


class KeyResponse(BaseModel):
    key_id: str
    name: str
    tier: str
    created_at: float
    last_used_at: float | None
    is_active: bool


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_key(
    req: CreateKeyRequest,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    store: Annotated[APIKeyStore, Depends(get_key_store)],
) -> dict:
    raw_key, record = store.create_key(
        name=req.name,
        user_id=user.user_id,
        tier=req.tier,
    )
    return {
        "key": raw_key,  # Only shown once at creation
        "key_id": record.key_id,
        "name": record.name,
        "tier": record.tier,
        "message": "Store this key securely — it will not be shown again.",
    }


@router.get("")
async def list_keys(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    store: Annotated[APIKeyStore, Depends(get_key_store)],
) -> dict:
    records = store.list_keys(user.user_id)
    return {
        "data": [
            KeyResponse(
                key_id=r.key_id,
                name=r.name,
                tier=r.tier,
                created_at=r.created_at,
                last_used_at=r.last_used_at,
                is_active=r.is_active,
            ).model_dump()
            for r in records
        ]
    }


@router.delete("/{key_id}")
async def revoke_key(
    key_id: str,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    store: Annotated[APIKeyStore, Depends(get_key_store)],
) -> dict:
    # Verify ownership
    records = store.list_keys(user.user_id)
    if not any(r.key_id == key_id for r in records):
        raise HTTPException(status_code=404, detail="Key not found")
    store.revoke(key_id)
    return {"message": "Key revoked", "key_id": key_id}
