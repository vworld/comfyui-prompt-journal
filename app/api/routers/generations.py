from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.generation import Generation
from app.models.shot import Shot
from app.schemas.api.generation import (
    GenerationDetailResponse,
    GenerationManualReviewUpdateRequest,
    GenerationSummaryResponse,
    GenerationUpdateRequest,
)
from app.schemas.api.paginated_response import PaginatedResponse
from app.services.project.generation_service import (
    get_unreviewed_generation_ids,
    rebuild_generation_attempt_num,
)

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
    path="/unreviewed",
    response_model=list[int],
    summary="A list of generations which have not yet been reviewed",
)
def get_unreviewed_generations(
    db: Annotated[
        Session,
        Depends(get_db),
    ],
    orderBy: Literal[
        "added_on",
        "generation_time",
    ] = "added_on",
    orderDirection: Literal[
        "asc",
        "desc",
    ] = "desc",
    cursor_generation_id: int | None = None,
    limit: int = 10,
) -> list[int]:
    return get_unreviewed_generation_ids(
        db,
        orderBy=orderBy,
        orderDirection=orderDirection,
        limit=limit,
        cursor_generation_id=cursor_generation_id,
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


@router.post(
    path="/{id}/pull-intent-from-previous-attempt",
    response_model=GenerationSummaryResponse,
    summary="Pull Intent From Previous Attempt",
    description="Copies the raw intent from the previous attempt into the "
    "current attempt. The operation succeeds only if a previous attempt exists "
    "and it contains a raw intent.",
)
def pullIntentFromPreviousAttempt(
    id: int,
    db: Annotated[
        Session,
        Depends(get_db),
    ],
):
    generation = get_generation_by_id(id, db)
    if generation.shot_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Shot not yet assigned to generation",
        )

    if generation.attempt_num == -1:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Attempt Num is -1",
        )

    if generation.attempt_num == 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No previous attempts found",
        )

    prev_gen = (
        db.query(Generation)
        .where(Generation.shot_id == generation.shot_id)
        .where(Generation.attempt_num < generation.attempt_num)
        .order_by(Generation.attempt_num.desc())
        .first()
    )

    if prev_gen is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Previous attempt not found",
        )
    if prev_gen.raw_intent is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Previous attempt does not have a stored intent",
        )

    generation.raw_intent = prev_gen.raw_intent
    db.flush()
    db.commit()
    db.refresh(generation)

    return GenerationSummaryResponse.model_validate(generation)


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
    summary="Update generation fields",
)
def update_generation(
    id: int,
    payload: GenerationUpdateRequest,
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

    old_shot_id = generation.shot_id
    new_shot_id: int | None = old_shot_id

    if "shot_id" in updates and old_shot_id != updates["shot_id"]:
        new_shot_id = updates["shot_id"]
        if new_shot_id is None:
            generation.project_id = None
            generation.attempt_num = -1
        else:
            shot = db.get(Shot, new_shot_id)
            if shot is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Shot {new_shot_id} not found",
                )

            generation.project_id = shot.project_id

    for field, value in updates.items():
        setattr(generation, field, value)

    db.flush()

    if old_shot_id != new_shot_id:
        if new_shot_id is not None:
            rebuild_generation_attempt_num(
                db=db,
                shot_id=new_shot_id,
                auto_commit=False,
            )

        if old_shot_id is not None:
            rebuild_generation_attempt_num(
                db=db,
                shot_id=old_shot_id,
                auto_commit=False,
            )
    db.commit()
    db.refresh(generation)

    return generation
