from sqlalchemy import or_
from sqlalchemy import func
from sqlalchemy import String

from app.db.session import SessionLocal

from app.models import (
    Shot,
    Clip,
    Scene,
    Project,
)


def search_shots(
        query: str,
        limit: int = 50,
) -> list[dict]:
    query = (
            query or ""
    ).strip()

    session = SessionLocal()

    try:

        stmt = (
            session.query(Shot)
            .join(
                Clip,
                Shot.clip_id == Clip.id
            )
            .join(
                Scene,
                Shot.scene_id == Scene.id
            )
            .join(
                Project,
                Shot.project_id == Project.id
            )
        )

        if query:

            tokens = [
                token.strip()
                for token in query.split()
                if token.strip()
            ]

            for token in tokens:
                token_like = (
                    f"%{token}%"
                )

                stmt = stmt.filter(
                    or_(
                        func.cast(
                            Shot.number,
                            String,
                        ).like(
                            token_like
                        ),

                        Shot.name.like(
                            token_like
                        ),

                        Clip.name.like(
                            token_like
                        ),

                        Scene.name.like(
                            token_like
                        ),

                        Project.name.like(
                            token_like
                        ),
                    )
                )

        shots = (
            stmt.order_by(
                Shot.id.desc()
            )
            .limit(limit)
            .all()
        )

        results = []

        for shot in shots:
            results.append(
                {
                    "shot_id":
                        shot.id,

                    "shot_number":
                        shot.number,

                    "shot_name":
                        shot.name,

                    "project_id":
                        shot.project.id,

                    "project_name":
                        shot.project.name,

                    "scene_id":
                        shot.scene.id,

                    "scene_name":
                        shot.scene.name,

                    "clip_id":
                        shot.clip.id,

                    "clip_name":
                        shot.clip.name,
                }
            )

        return results

    finally:
        session.close()
