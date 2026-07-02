from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.asset import Asset
from app.models.clip import Clip
from app.models.generation import Generation
from app.models.project import Project
from app.models.scene import Scene
from app.models.shot import Shot
from app.schemas.api.stats import CurrentStatsResponse, GenerationStats

router = APIRouter()


@router.get(
    path="/",
    response_model=CurrentStatsResponse,
    summary="Returns counts",
)
def get_current_stats(
    db: Annotated[
        Session,
        Depends(get_db),
    ],
):
    gen_total, gen_unreviewed, gen_reviewed, gen_unassigned = db.execute(
        select(
            func.count(Generation.id).label("total"),
            func.count(Generation.id)
            .filter(
                or_(
                    Generation.raw_review.is_(None),
                    Generation.raw_review == "",
                )
            )
            .label("unreviewed"),
            func.count(Generation.id)
            .filter(
                and_(
                    Generation.raw_review.is_not(None),
                    Generation.raw_review != "",
                )
            )
            .label("reviewed"),
            func.count(Generation.id)
            .filter(Generation.shot_id.is_(None))
            .label("unassigned"),
        )
    ).one()

    projects = db.scalar(select(func.count(Project.id)))
    scenes = db.scalar(select(func.count(Scene.id)))
    clips = db.scalar(select(func.count(Clip.id)))
    shots = db.scalar(select(func.count(Shot.id)))
    assets = db.scalar(select(func.count(Asset.id)))

    return CurrentStatsResponse(
        generation=GenerationStats(
            total=gen_total or 0,
            reviewed=gen_reviewed or 0,
            unreviewed=gen_unreviewed or 0,
            unassigned=gen_unassigned or 0,
        ),
        projects=projects or 0,
        scenes=scenes or 0,
        clips=clips or 0,
        shots=shots or 0,
        assets=assets or 0,
    )
