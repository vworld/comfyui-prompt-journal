from typing import Literal

from fastapi import HTTPException, status
from sqlalchemy import and_, func, or_, select
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


# ORDER_COLUMNS = {
#     "id": Generation.id,
#     "added_on": Generation.added_on,
#     "generation_time": Asset.file_timestamp,
# }


# def get_unreviewed_generation_ids(
#     db: Session,
#     orderBy: Literal[
#         "id",
#         "added_on",
#         "generation_time",
#     ] = "added_on",
#     orderDirection: Literal[
#         "asc",
#         "desc",
#     ] = "desc",
#     limit: int = 10,
# ) -> list[int]:

#     stmt = select(Generation.id)
#     if orderBy == "generation_time":
#         stmt = (
#             stmt.join(Generation.generation_assets)
#             .join(GenerationAsset.asset)
#             .where(GenerationAsset.assoc_type == AssocType.OUTPUT)
#         )

#     order_column = ORDER_COLUMNS[orderBy]
#     stmt = (
#         stmt.where(Generation.raw_review.is_(None))
#         .order_by(
#             order_column.asc() if orderDirection == "asc" else order_column.desc()
#         )
#         .limit(limit)
#     )
#     return list(db.scalars(stmt).all())


ORDER_COLUMNS = {
    "added_on": Generation.added_on,
    "generation_time": Asset.file_timestamp,
}


def get_unreviewed_generation_ids(
    db: Session,
    orderBy: Literal[
        "added_on",
        "generation_time",
    ] = "added_on",
    orderDirection: Literal[
        "asc",
        "desc",
    ] = "desc",
    limit: int = 10,
    cursor_generation_id: int | None = None,
) -> list[int]:
    stmt = select(Generation.id)

    if orderBy == "generation_time":
        stmt = (
            stmt.join(Generation.generation_assets)
            .join(GenerationAsset.asset)
            .where(GenerationAsset.assoc_type == AssocType.OUTPUT)
        )

    order_column = ORDER_COLUMNS[orderBy]

    stmt = stmt.where(
        or_(
            Generation.raw_review.is_(None),
            func.trim(Generation.raw_review) == "",
        )
    )

    if cursor_generation_id is not None:
        cursor_stmt = select(order_column).where(Generation.id == cursor_generation_id)

        if orderBy == "generation_time":
            cursor_stmt = (
                cursor_stmt.join(Generation.generation_assets)
                .join(GenerationAsset.asset)
                .where(GenerationAsset.assoc_type == AssocType.OUTPUT)
            )

        cursor_value = db.scalar(cursor_stmt)

        if cursor_value is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Generation {cursor_generation_id} not found",
            )

        if orderDirection == "asc":
            stmt = stmt.where(
                or_(
                    order_column > cursor_value,
                    and_(
                        order_column == cursor_value,
                        Generation.id > cursor_generation_id,
                    ),
                )
            )
        else:
            stmt = stmt.where(
                or_(
                    order_column < cursor_value,
                    and_(
                        order_column == cursor_value,
                        Generation.id < cursor_generation_id,
                    ),
                )
            )

    stmt = stmt.order_by(
        order_column.asc() if orderDirection == "asc" else order_column.desc(),
        Generation.id.asc() if orderDirection == "asc" else Generation.id.desc(),
    ).limit(limit)

    return list(db.scalars(stmt).all())
