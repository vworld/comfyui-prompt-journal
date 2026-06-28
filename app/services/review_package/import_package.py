import shutil
from pathlib import Path

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models import (
    Generation,
    Shot,
)
from app.services.review_package.archive import (
    archive_review_package,
)
from app.services.review_package.review_parser import (
    parse_review_file,
)
from app.services.review_package.validate import (
    validate_review_package,
)


def import_review_package(
    package_dir: str | Path,
) -> int:

    package_dir = Path(
        package_dir
    )

    validated = (
        validate_review_package(
            package_dir
        )
    )

    manifest = validated[
        "manifest"
    ]

    llm_output = validated[
        "llm_output"
    ]

    generation_id = validated[
        "generation_id"
    ]

    review_data = (
        parse_review_file(
            package_dir
            / "review.md"
        )
    )

    db = SessionLocal()

    try:

        generation = db.scalar(
            select(Generation)
            .where(
                Generation.id
                == generation_id
            )
        )

        if not generation:
            raise ValueError(
                f"Generation not found: "
                f"{generation_id}"
            )

        #
        # Optional shot update
        #

        new_shot_id = manifest[
            "shot_id"
        ]

        if (
            generation.shot_id
            != new_shot_id
        ):

            shot = db.scalar(
                select(Shot)
                .where(
                    Shot.id
                    == new_shot_id
                )
            )

            if not shot:
                raise ValueError(
                    f"Shot not found: "
                    f"{new_shot_id}"
                )

            generation.shot_id = (
                shot.id
            )

            generation.project_id = (
                shot.project_id
            )

        #
        # Raw Review
        #

        generation.raw_intent = (
            review_data[
                "raw_intent"
            ]
        )

        generation.raw_review = (
            review_data[
                "raw_review"
            ]
        )

        #
        # LLM Review
        #

        generation.cleaned_intent = (
            llm_output[
                "cleaned_intent"
            ]
        )

        generation.cleaned_review = (
            llm_output[
                "cleaned_review"
            ]
        )

        generation.failure_description = (
            llm_output[
                "failure_description"
            ]
        )

        generation.suspected_causes = (
            llm_output[
                "suspected_causes"
            ]
        )

        generation.correction_strategy = (
            llm_output[
                "correction_strategy"
            ]
        )

        db.commit()

        archive_review_package(
            package_dir,
            generation_id,
        )

        shutil.rmtree(
            package_dir
        )

        return generation_id

    except Exception:

        db.rollback()
        raise

    finally:
        db.close()