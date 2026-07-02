from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.project import Project
from app.models.scene import Scene
from app.schemas.api.scene import (
    NextAvailableNumberResponse,
    SceneCreateRequest,
    SceneNameValidationResponse,
    SceneNumberValidationResponse,
    SceneResponse,
)

router = APIRouter()


@router.get(
    "/{project_id}/scenes/search",
    response_model=list[SceneResponse],
    summary="Find matching scenes in project",
)
def searchScene(
    db: Annotated[
        Session,
        Depends(get_db),
    ],
    project_id: int,
    q: str,
    limit: int = 10,
):
    q = q.strip()

    query = db.query(Scene).filter(Scene.project_id == project_id)

    if q.isdigit():
        query = query.filter(
            or_(
                Scene.number == int(q),
                Scene.name.ilike(f"%{q}%"),
            )
        )
    else:
        query = query.filter(Scene.name.ilike(f"%{q}%"))

    return query.order_by(Scene.number).limit(limit).all()


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


@router.get(
    "/{project_id}/scenes/validate/scene-name",
    response_model=SceneNameValidationResponse,
    summary="Validate scene name uniqueness within a project.",
)
def validate_scene_name(
    project_id: int,
    db: Annotated[
        Session,
        Depends(get_db),
    ],
    name: str,
):
    existing = (
        db.query(Scene)
        .filter(Scene.project_id == project_id, Scene.name == name)
        .first()
    )

    return SceneNameValidationResponse(
        is_unique=(existing is None),
        duplicate=SceneResponse.model_validate(existing) if existing else None,
    )


@router.get(
    "/{project_id}/scenes/next-number",
    response_model=NextAvailableNumberResponse,
    summary="Get next suggested scene number within a project.",
)
def next_scene_number(
    project_id: int,
    db: Annotated[
        Session,
        Depends(get_db),
    ],
) -> NextAvailableNumberResponse:
    max_number = (
        db.query(func.max(Scene.number)).filter(Scene.project_id == project_id).scalar()
    )
    next_number = (max_number or 0) + 1

    return NextAvailableNumberResponse(
        next_number=next_number,
        max_number=max_number,
    )


@router.get(
    "/{project_id}/scenes/validate/scene-number",
    response_model=SceneNumberValidationResponse,
    summary="Validate scene number uniqueness within a project.",
)
def validate_scene_number(
    project_id: int,
    db: Annotated[
        Session,
        Depends(get_db),
    ],
    number: int,
):
    existing = (
        db.query(Scene)
        .filter(Scene.project_id == project_id, Scene.number == number)
        .first()
    )

    return SceneNumberValidationResponse(
        is_unique=(existing is None),
        duplicate=SceneResponse.model_validate(existing) if existing else None,
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
