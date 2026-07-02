from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.project import Project
from app.schemas.api.project import (
    ProjectCreateRequest,
    ProjectNameValidationResponse,
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
