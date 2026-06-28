from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.clip import Clip
from app.models.shot import Shot
from app.schemas.api.shot import (
    ShotCreate,
    ShotResponse,
)

router = APIRouter()


@router.get(
    "/{clip_id}/shots",
    response_model=list[ShotResponse],
    summary="Get Shots",
)
def list_shots(
    clip_id: int,
    db: Annotated[Session, Depends(get_db)],
):
    return db.query(Shot).filter(Shot.clip_id == clip_id).order_by(Shot.id).all()


@router.post(
    "/{clip_id}/shots",
    response_model=ShotResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Shot",
)
def create_shot(
    clip_id: int,
    payload: ShotCreate,
    db: Annotated[Session, Depends(get_db)],
):
    clip = db.get(Clip, clip_id)

    if not clip:
        raise HTTPException(404, "Clip not found")

    shot = Shot(
        clip_id=clip.id,
        scene_id=clip.scene_id,
        project_id=clip.scene.project_id,
        **payload.model_dump(),
    )

    db.add(shot)
    db.commit()
    db.refresh(shot)

    return shot
