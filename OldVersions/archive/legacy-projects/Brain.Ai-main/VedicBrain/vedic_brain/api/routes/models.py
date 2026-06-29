"""VedicBrain.AI — /v1/models endpoint."""
from __future__ import annotations

import time
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from vedic_brain.api.auth import AuthenticatedUser, get_current_user
from vedic_brain.config import settings

router = APIRouter()

AVAILABLE_MODELS = [
    {"id": settings.active_model_name, "owned_by": "kaelus-online", "object": "model"},
    {"id": "vedic-brain-1", "owned_by": "kaelus-online", "object": "model"},
    {"id": "vedic-brain-1-fast", "owned_by": "kaelus-online", "object": "model"},
]


@router.get("/v1/models")
async def list_models(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> dict:
    return {
        "object": "list",
        "data": [
            {**m, "created": int(time.time()), "permission": [], "root": m["id"]}
            for m in AVAILABLE_MODELS
        ],
    }


@router.get("/v1/models/{model_id}")
async def get_model(
    model_id: str,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> dict:
    for m in AVAILABLE_MODELS:
        if m["id"] == model_id:
            return {**m, "created": int(time.time()), "permission": [], "root": model_id}
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail=f"Model not found: {model_id}")
