from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.project import Project
from app.models.scene import Scene
from app.schemas.api.scene import (
    SceneCreateRequest,
    SceneResponse,
)

router = APIRouter()


@router.get(
    "/{project_id}/scenes",
    response_model=list[SceneResponse],
    summary="List Scenes",
)
def list_scenes(
    project_id: int,
    db: Annotated[
        Session,
        Depends(get_db),
    ],  # noqa: F821
):
    return (
        db.query(Scene).filter(Scene.project_id == project_id).order_by(Scene.id).all()
    )


@router.post(
    "/{project_id}/scenes",
    response_model=SceneResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Scene",
)
def create_scene(
    project_id: int,
    payload: SceneCreateRequest,
    db: Annotated[Session, Depends(get_db)],
):
    if not db.get(Project, project_id):
        raise HTTPException(404, "Project not found")

    scene = Scene(
        project_id=project_id,
        **payload.model_dump(),
    )

    db.add(scene)
    db.commit()
    db.refresh(scene)

    return scene
