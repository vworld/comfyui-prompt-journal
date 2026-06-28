from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.scene import Scene
from app.schemas.api.scene import (
    SceneResponse,
    SceneUpdateRequest,
)

router = APIRouter()


@router.get(
    "/{id}",
    response_model=SceneResponse,
    summary="Get Scene",
)
def get_scene(
    id: int,
    db: Annotated[Session, Depends(get_db)],
):
    scene = db.get(Scene, id)

    if not scene:
        raise HTTPException(404, "Scene not found")

    return scene


@router.patch(
    "/{id}",
    response_model=SceneResponse,
    summary="Update Scene",
)
def update_scene(
    id: int,
    payload: SceneUpdateRequest,
    db: Annotated[Session, Depends(get_db)],
):
    scene = db.get(Scene, id)

    if not scene:
        raise HTTPException(404, "Scene not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(scene, key, value)

    db.commit()
    db.refresh(scene)

    return scene


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Scene",
)
def delete_scene(
    id: int,
    db: Annotated[Session, Depends(get_db)],
):
    scene = db.get(Scene, id)

    if not scene:
        raise HTTPException(404, "Scene not found")

    db.delete(scene)
    db.commit()
