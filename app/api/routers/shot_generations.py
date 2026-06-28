from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.generation import Generation
from app.schemas.api.generation import GenerationDetailResponse
from app.schemas.api.shot import ShotGenerationCountResponse

router = APIRouter()


@router.get(
    path="/{shot_id}/generations",
    response_model=list[GenerationDetailResponse],
    summary="All Generations for the shot in desc order",
)
def get_generations_for_shot(
    shot_id: int,
    db: Annotated[
        Session,
        Depends(get_db),
    ],
):
    generations = db.scalars(
        select(Generation)
        .where(Generation.shot_id == shot_id)
        .order_by(Generation.id.desc())
    ).all()

    return [GenerationDetailResponse.model_validate(gen) for gen in generations]


@router.get(
    "/{shot_id}/generations/count",
    response_model=ShotGenerationCountResponse,
    summary="Get Generation Count",
    description="Number of generation attempts for the shot.",
)
def get_generation_count(
    shot_id: int,
    db: Annotated[
        Session,
        Depends(get_db),
    ],
):
    count = (
        db.query(func.count(Generation.id))
        .filter(Generation.shot_id == shot_id)
        .scalar()
    )

    return {"count": count or 0}
