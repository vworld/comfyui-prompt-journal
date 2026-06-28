from sqlalchemy import String, func, or_

from app.db.session import SessionLocal
from app.models import (
    Clip,
    Project,
    Scene,
    Shot,
)
from app.schemas.api.shot import ShotSearchResultDict


def search_shots(
    query: str,
    limit: int = 50,
) -> list[ShotSearchResultDict]:
    query = (query or "").strip()

    session = SessionLocal()

    try:

        stmt = (
            session.query(Shot)
            .join(
                Clip,
                Shot.clip_id == Clip.id,
            )
            .join(
                Scene,
                Shot.scene_id == Scene.id,
            )
            .join(
                Project,
                Shot.project_id == Project.id,
            )
        )

        if query:

            tokens = [token.strip() for token in query.split() if token.strip()]

            for token in tokens:
                token_like = f"%{token}%"

                stmt = stmt.filter(
                    or_(
                        func.cast(
                            Shot.number,
                            String,
                        ).like(token_like),
                        Shot.name.like(token_like),
                        Clip.name.like(token_like),
                        Scene.name.like(token_like),
                        Project.name.like(token_like),
                    ),
                )

        shots = stmt.order_by(Shot.id.desc()).limit(limit).all()

        results = []

        for shot in shots:
            results.append(_shot_to_dict(shot))

        return results

    finally:
        session.close()


def get_shot_by_id(
    shot_id: int,
) -> ShotSearchResultDict | None:
    """Resolve a single shot by primary key into the same dict shape
    returned by search_shots(). Used after creating a new shot via the
    hierarchy builder, where we already know the id and don't need to
    re-run a text search to find it.
    """

    session = SessionLocal()

    try:

        shot = session.query(Shot).filter(Shot.id == shot_id).first()

        if shot is None:
            return None

        return _shot_to_dict(shot)

    finally:
        session.close()


def _shot_to_dict(shot: Shot) -> ShotSearchResultDict:
    return {
        "shot_id": shot.id,
        "shot_number": shot.number,
        "shot_name": shot.name,
        "project_id": shot.project.id,
        "project_name": shot.project.name,
        "scene_id": shot.scene.id,
        "scene_name": shot.scene.name,
        "clip_id": shot.clip.id,
        "clip_name": shot.clip.name,
    }


