from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.generation import Generation
from app.models.shot import Shot
from app.schemas.api.generation import (
    GenerationDetailResponse,
    GenerationEnrichedReviewUpdateRequest,
    GenerationManualReviewUpdateRequest,
    GenerationSummaryResponse,
)
from app.schemas.api.paginated_response import PaginatedResponse

router = APIRouter()


@router.get(
    path="",
    response_model=PaginatedResponse[GenerationSummaryResponse],
    summary="A list of all Generations",
)
def get_generations(
    db: Annotated[
        Session,
        Depends(get_db),
    ],
    offset: int = Query(
        0,
        ge=0,
        description="Number of rows to skip",
    ),
    limit: int = Query(
        50,
        ge=1,
        le=100,
        description="Maximum number of rows to return",
    ),
) -> PaginatedResponse[GenerationSummaryResponse]:
    total = db.scalar(select(func.count()).select_from(Generation))

    stmt = select(Generation).order_by(Generation.id.desc()).offset(offset).limit(limit)

    generations = db.scalars(stmt).all()

    items = [GenerationSummaryResponse.model_validate(gen) for gen in generations]

    return PaginatedResponse[GenerationSummaryResponse](
        total=total or 0,
        offset=offset,
        limit=limit,
        items=items,
    )


@router.get(
    path="/{id}",
    response_model=GenerationDetailResponse,
    summary="A generation with all its assets and project hierarchy",
)
def get_generation_by_id(
    id: int,
    db: Annotated[
        Session,
        Depends(get_db),
    ],
):
    generation = db.scalar(select(Generation).where(Generation.id == id))

    if generation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Generation {id} not found",
        )
    return GenerationDetailResponse.model_validate(generation)


@router.patch(
    "/{id}/manual-review",
    response_model=GenerationDetailResponse,
    summary="Update human review fields for a generation",
)
def add_manual_review(
    id: int,
    payload: GenerationManualReviewUpdateRequest,
    db: Annotated[
        Session,
        Depends(get_db),
    ],
):
    generation = update_generation_fields(
        db,
        id,
        payload,
    )

    return GenerationDetailResponse.model_validate(
        generation,
    )


@router.patch(
    "/{id}",
    response_model=GenerationDetailResponse,
    summary="Update cleaned enriched reviews",
)
def update_generation(
    id: int,
    payload: GenerationEnrichedReviewUpdateRequest,
    db: Annotated[
        Session,
        Depends(get_db),
    ],
):
    generation = update_generation_fields(
        db,
        id,
        payload,
    )

    return GenerationDetailResponse.model_validate(
        generation,
    )


def update_generation_fields(
    db: Session,
    generation_id: int,
    payload: BaseModel,
) -> Generation:
    generation = db.scalar(select(Generation).where(Generation.id == generation_id))

    if generation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Generation {generation_id} not found",
        )

    updates = payload.model_dump(exclude_unset=True)

    if "shot_id" in updates and generation.shot_id != updates["shot_id"]:
        shot = db.get(Shot, generation.shot_id)

        if shot is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Shot {generation.shot_id} not found",
            )

        generation.project_id = shot.project_id

    for field, value in updates.items():
        setattr(generation, field, value)

    db.commit()
    db.refresh(generation)

    return generation
