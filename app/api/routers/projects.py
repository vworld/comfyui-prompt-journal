from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.clip import Clip
from app.models.generation import Generation
from app.models.project import Project
from app.models.scene import Scene
from app.models.shot import Shot
from app.schemas.api.project import (
    PathItem,
    ProjectCreateRequest,
    ProjectNameValidationResponse,
    ProjectPathResponse,
    ProjectResponse,
    ProjectUpdateRequest,
)

router = APIRouter()


@router.get(
    "/validate/project-name",
    response_model=ProjectNameValidationResponse,
    summary="Validate project name uniqueness.",
)
def validate_project_name(
    db: Annotated[Session, Depends(get_db)],
    name: str,
):
    existing_project = db.query(Project).filter(Project.name == name).first()
    return ProjectNameValidationResponse(
        is_unique=(existing_project is None),
        duplicate=(
            ProjectResponse.model_validate(existing_project)
            if existing_project
            else None
        ),
    )


@router.get(
    "/find-path-to-project-id",
    response_model=ProjectPathResponse,
    summary="Find path to project ID from scene, clip, shot, or generation ID",
)
def find_path_to_project_id(
    db: Annotated[
        Session,
        Depends(get_db),
    ],
    scene_id: int | None = Query(None),
    clip_id: int | None = Query(None),
    shot_id: int | None = Query(None),
    generation_id: int | None = Query(None),
):
    param_count = sum(
        [
            scene_id is not None,
            clip_id is not None,
            shot_id is not None,
            generation_id is not None,
        ]
    )

    if param_count == 0:
        raise HTTPException(
            400, "Must provide one of scene_id, clip_id, shot_id, or generation_id"
        )

    if param_count > 1:
        raise HTTPException(
            400,
            "Must provide exactly one of scene_id, clip_id, shot_id, or generation_id",
        )

    if scene_id:
        scene = db.get(Scene, scene_id)
        if not scene:
            raise HTTPException(404, "Scene not found")

        return ProjectPathResponse(
            path=[
                PathItem(kind="project", id=scene.project_id),
                PathItem(kind="scene", id=scene.id),
            ]
        )

    if clip_id:

        stmt = (
            select(
                Clip.id,
                Scene.id.label("scene_id"),
                Scene.project_id,
            )
            .join(Clip.scene)
            .where(Clip.id == clip_id)
        )
        row = db.execute(stmt).one_or_none()
        if not row:
            raise HTTPException(404, "Path not found")

        return ProjectPathResponse(
            path=[
                PathItem(kind="project", id=row.project_id),
                PathItem(kind="scene", id=row.scene_id),
                PathItem(kind="clip", id=row.id),
            ]
        )

    if shot_id:
        stmt = (
            select(
                Shot.id,
                Clip.id.label("clip_id"),
                Scene.id.label("scene_id"),
                Scene.project_id,
            )
            .join(Shot.clip)
            .join(Clip.scene)
            .where(Shot.id == shot_id)
        )
        row = db.execute(stmt).one_or_none()
        if not row:
            raise HTTPException(404, "Path not found")

        return ProjectPathResponse(
            path=[
                PathItem(kind="project", id=row.project_id),
                PathItem(kind="scene", id=row.scene_id),
                PathItem(kind="clip", id=row.clip_id),
                PathItem(kind="shot", id=row.id),
            ]
        )

    if generation_id:
        stmt = (
            select(
                Generation.id,
                Shot.id.label("shot_id"),
                Clip.id.label("clip_id"),
                Scene.id.label("scene_id"),
                Scene.project_id,
            )
            .join(Generation.shot)
            .join(Shot.clip)
            .join(Clip.scene)
            .where(Generation.id == generation_id)
            .where(Generation.shot_id.is_not(None))
        )
        row = db.execute(stmt).one_or_none()
        if not row:
            raise HTTPException(404, "Path not found")
        return ProjectPathResponse(
            path=[
                PathItem(kind="project", id=row.project_id),
                PathItem(kind="scene", id=row.scene_id),
                PathItem(kind="clip", id=row.clip_id),
                PathItem(kind="shot", id=row.shot_id),
                PathItem(kind="generation", id=row.id),
            ]
        )


@router.get(
    "/search",
    response_model=list[ProjectResponse],
    summary="Search projects by name.",
)
def search_projects(
    db: Annotated[
        Session,
        Depends(get_db),
    ],
    q: str,
    limit: int = 10,
):
    search_pattern = f"%{q}%"
    return (
        db.query(Project)
        .filter(Project.name.ilike(search_pattern))
        .order_by(Project.id)
        .limit(limit)
        .all()
    )


@router.get(
    "",
    response_model=list[ProjectResponse],
    summary="List all projects.",
)
def list_projects(
    db: Annotated[Session, Depends(get_db)],
):
    return db.query(Project).order_by(Project.id).all()


@router.get(
    "/{id}",
    response_model=ProjectResponse,
    summary="Get Project",
)
def get_project(
    id: int,
    db: Annotated[Session, Depends(get_db)],
):
    project = db.get(Project, id)

    if not project:
        raise HTTPException(404, "Project not found")

    return project


@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Project",
)
def create_project(
    payload: ProjectCreateRequest,
    db: Annotated[Session, Depends(get_db)],
):
    project = Project(**payload.model_dump())

    db.add(project)
    db.commit()
    db.refresh(project)

    return project


@router.patch(
    "/{id}",
    response_model=ProjectResponse,
    summary="Update Project",
)
def update_project(
    id: int,
    payload: ProjectUpdateRequest,
    db: Annotated[Session, Depends(get_db)],
):

    project = db.get(Project, id)

    if not project:
        raise HTTPException(404, "Project not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, key, value)

    db.commit()
    db.refresh(project)

    return project


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Project",
)
def delete_project(
    id: int,
    db: Annotated[Session, Depends(get_db)],
):
    project = db.get(Project, id)

    if not project:
        raise HTTPException(404, "Project not found")

    db.delete(project)
    db.commit()
