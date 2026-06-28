from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.clip import Clip
from app.models.scene import Scene
from app.schemas.api.clip import (
    ClipCreateRequest,
    ClipResponse,
)

router = APIRouter()


@router.get(
    "/{scene_id}/clips",
    response_model=list[ClipResponse],
    summary="Get all clips for a scene.",
)
def list_clips(
    scene_id: int,
    db: Annotated[
        Session,
        Depends(get_db),
    ],
):
    return db.query(Clip).filter(Clip.scene_id == scene_id).order_by(Clip.id).all()


@router.post(
    "/{scene_id}/clips",
    response_model=ClipResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new Clip.",
)
def create_clip(
    scene_id: int,
    payload: ClipCreateRequest,
    db: Annotated[
        Session,
        Depends(get_db),
    ],
):
    if not db.get(Scene, scene_id):
        raise HTTPException(404, "Scene not found")

    clip = Clip(
        scene_id=scene_id,
        **payload.model_dump(),
    )

    db.add(clip)
    db.commit()
    db.refresh(clip)

    return clip
