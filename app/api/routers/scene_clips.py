from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.clip import Clip
from app.models.scene import Scene
from app.schemas.api.clip import (
    ClipCreateRequest,
    ClipNameValidationResponse,
    ClipNumberValidationResponse,
    ClipResponse,
)
from app.schemas.api.scene import NextAvailableNumberResponse

router = APIRouter()


@router.get(
    "/{scene_id}/clips/search",
    response_model=list[ClipResponse],
    summary="Find matching clips in scene",
)
def search_clips(
    db: Annotated[
        Session,
        Depends(get_db),
    ],
    scene_id: int,
    q: str,
    limit: int = 10,
):
    q = q.strip()
    query = db.query(Clip).filter(Clip.scene_id == scene_id)

    if q.isdigit():
        query = query.filter(
            or_(
                Clip.number == int(q),
                Clip.name.ilike(f"%{q}%"),
            )
        )
    else:
        query = query.filter(Clip.name.ilike(f"%{q}%"))

    return query.order_by(Clip.number).limit(limit).all()


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


@router.get(
    "/{scene_id}/clips/validate/clip-name",
    response_model=ClipNameValidationResponse,
    summary="Validate clip name uniqueness within a scene.",
)
def validate_clip_name(
    scene_id: int,
    db: Annotated[
        Session,
        Depends(get_db),
    ],
    name: str,
):
    existing = (
        db.query(Clip)
        .filter(Clip.scene_id == scene_id, Clip.name == name)
        .first()
    )

    return ClipNameValidationResponse(
        is_unique=(existing is None),
        duplicate=ClipResponse.model_validate(existing) if existing else None,
    )


@router.get(
    "/{scene_id}/clips/next-number",
    response_model=NextAvailableNumberResponse,
    summary="Get next suggested clip number within a scene.",
)
def next_clip_number(
    scene_id: int,
    db: Annotated[
        Session,
        Depends(get_db),
    ],
):
    max_number = (
        db.query(func.max(Clip.number)).filter(Clip.scene_id == scene_id).scalar()
    )
    next_number = (max_number or 0) + 1

    return NextAvailableNumberResponse(
        next_number=next_number,
        max_number=max_number,
    )


@router.get(
    "/{scene_id}/clips/validate/clip-number",
    response_model=ClipNumberValidationResponse,
    summary="Validate clip number uniqueness within a scene.",
)
def validate_clip_number(
    scene_id: int,
    db: Annotated[
        Session,
        Depends(get_db),
    ],
    number: int,
):
    existing = (
        db.query(Clip)
        .filter(Clip.scene_id == scene_id, Clip.number == number)
        .first()
    )

    return ClipNumberValidationResponse(
        is_unique=(existing is None),
        duplicate=ClipResponse.model_validate(existing) if existing else None,
    )


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
