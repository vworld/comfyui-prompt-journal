from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.clip import Clip
from app.schemas.api.clip import (
    ClipResponse,
    ClipUpdateRequest,
)

router = APIRouter()


@router.get(
    "/{id}",
    response_model=ClipResponse,
    summary="Get Clip by ID.",
)
def get_clip(
    id: int,
    db: Annotated[
        Session,
        Depends(get_db),
    ],
):
    clip = db.get(Clip, id)

    if not clip:
        raise HTTPException(404, "Clip not found")

    return clip


@router.patch(
    "/{id}",
    response_model=ClipResponse,
    summary="Update Clip.",
)
def update_clip(
    id: int,
    payload: ClipUpdateRequest,
    db: Annotated[
        Session,
        Depends(get_db),
    ],
):
    clip = db.get(Clip, id)

    if not clip:
        raise HTTPException(404, "Clip not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(clip, key, value)

    db.commit()
    db.refresh(clip)

    return clip


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Clip.",
)
def delete_clip(
    id: int,
    db: Annotated[Session, Depends(get_db)],
):
    clip = db.get(Clip, id)

    if not clip:
        raise HTTPException(404, "Clip not found")

    db.delete(clip)
    db.commit()
