from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.models.generation import Generation
from app.models.generation_asset import AssocType, GenerationAsset


def rebuild_generation_attempt_num(
    db: Session,
    shot_id: int,
    auto_commit: bool = False,
):
    generations = (
        db.query(Generation)
        .join(
            GenerationAsset,
            Generation.generation_assets,
        )
        .join(
            Asset,
            GenerationAsset.asset,
        )
        .filter(
            Generation.shot_id == shot_id,
            GenerationAsset.assoc_type == AssocType.OUTPUT,
        )
        .order_by(
            Asset.file_timestamp.asc(),
            Generation.id.asc(),
        )
        .all()
    )
    for attempt, generation in enumerate(generations, start=1):
        generation.attempt_num = attempt
    if auto_commit is True:
        db.commit()
