from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.clip import Clip
from app.models.shot import Shot
from app.schemas.api.scene import NextAvailableNumberResponse
from app.schemas.api.shot import (
    ShotCreate,
    ShotNameValidationResponse,
    ShotNumberValidationResponse,
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


@router.get(
    "/{clip_id}/shots/next-number",
    response_model=NextAvailableNumberResponse,
    summary="Get next suggested shot number within a clip.",
)
def next_shot_number(
    clip_id: int,
    db: Annotated[Session, Depends(get_db)],
):
    max_number = (
        db.query(func.max(Shot.number)).filter(Shot.clip_id == clip_id).scalar()
    )
    next_number = (max_number or 0) + 1

    return NextAvailableNumberResponse(
        next_number=next_number,
        max_number=max_number,
    )


@router.get(
    "/{clip_id}/shots/validate/shot-name",
    response_model=ShotNameValidationResponse,
    summary="Validate shot name uniqueness within a clip.",
)
def validate_shot_name(
    clip_id: int,
    db: Annotated[Session, Depends(get_db)],
    name: str,
):
    existing = db.query(Shot).filter(Shot.clip_id == clip_id, Shot.name == name).first()

    return ShotNameValidationResponse(
        is_unique=(existing is None),
        duplicate=ShotResponse.model_validate(existing) if existing else None,
    )


@router.get(
    "/{clip_id}/shots/validate/shot-number",
    response_model=ShotNumberValidationResponse,
    summary="Validate shot number uniqueness within a clip.",
)
def validate_shot_number(
    clip_id: int,
    db: Annotated[Session, Depends(get_db)],
    number: int,
):
    existing = (
        db.query(Shot).filter(Shot.clip_id == clip_id, Shot.number == number).first()
    )

    return ShotNumberValidationResponse(
        is_unique=(existing is None),
        duplicate=ShotResponse.model_validate(existing) if existing else None,
    )


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
