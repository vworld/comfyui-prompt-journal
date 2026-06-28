from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.lib.project.shot_search import search_shots
from app.models.shot import Shot
from app.schemas.api.shot import (
    ShotResponse,
    ShotSearchResult,
    ShotUpdate,
)

router = APIRouter()


@router.get(
    "/search",
    response_model=list[ShotSearchResult],
    summary="Fuzzy search to locate shots",
    description="Search includes the entire hierarchy.",
)
def search_hierarchy(
    q: str,
    limit: int = 20,
) -> list[ShotSearchResult]:

    results = search_shots(
        query=q,
        limit=limit,
    )

    return [ShotSearchResult.model_validate(res) for res in results]


@router.get(
    "/{id}",
    response_model=ShotResponse,
    summary="Get Shot",
)
def get_shot(
    id: int,
    db: Annotated[Session, Depends(get_db)],
):
    shot = db.get(Shot, id)

    if not shot:
        raise HTTPException(404, "Shot not found")

    return shot


@router.patch(
    "/{id}",
    response_model=ShotResponse,
    summary="Update Shot",
)
def update_shot(
    id: int,
    payload: ShotUpdate,
    db: Annotated[Session, Depends(get_db)],
):
    shot = db.get(Shot, id)

    if not shot:
        raise HTTPException(404, "Shot not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(shot, key, value)

    db.commit()
    db.refresh(shot)

    return shot


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Shot",
)
def delete_shot(
    id: int,
    db: Annotated[Session, Depends(get_db)],
):
    shot = db.get(Shot, id)

    if not shot:
        raise HTTPException(404, "Shot not found")

    db.delete(shot)
    db.commit()
