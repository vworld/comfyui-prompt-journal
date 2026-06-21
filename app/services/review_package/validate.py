import re
import json
from pathlib import Path

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models import Generation


REQUIRED_FILES = [
    "manifest.json",
    "llm_context.json",
    "review.md",
    "llm_output.json",
]


def validate_review_package(
    package_dir: str | Path,
) -> dict:

    package_dir = Path(package_dir)

    if not package_dir.exists():
        raise FileNotFoundError(
            package_dir
        )

    for file_name in REQUIRED_FILES:

        path = (
            package_dir
            / file_name
        )

        if not path.exists():
            raise ValueError(
                f"Missing file: "
                f"{file_name}"
            )

    manifest = json.loads(
        (
            package_dir
            / "manifest.json"
        ).read_text(
            encoding="utf-8"
        )
    )

    llm_context = json.loads(
        (
            package_dir
            / "llm_context.json"
        ).read_text(
            encoding="utf-8"
        )
    )

    llm_output = json.loads(
        (
            package_dir
            / "llm_output.json"
        ).read_text(
            encoding="utf-8"
        )
    )

    review_content = (
            package_dir
            / "review.md"
    ).read_text(
        encoding="utf-8"
    )

    match = re.search(
        r"Generation ID:\s*(\d+)",
        review_content,
    )
    if not match:
        raise ValueError(
            "Missing generation ID "
            "in review.md"
        )
    review_generation_id = int(
        match.group(1)
    )


    generation_id = manifest[
        "generation_id"
    ]

    if (
            review_generation_id
            != generation_id
    ):
        raise ValueError(
            "Generation ID mismatch "
            "between manifest "
            "and review.md"
        )

    if (
        llm_context[
            "generation_id"
        ]
        != generation_id
    ):
        raise ValueError(
            "Generation ID mismatch "
            "between manifest "
            "and llm_context"
        )

    if (
        llm_output[
            "generation_id"
        ]
        != generation_id
    ):
        raise ValueError(
            "Generation ID mismatch "
            "between manifest "
            "and llm_output"
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

    finally:
        db.close()

    return {
        "manifest": manifest,
        "llm_context": llm_context,
        "llm_output": llm_output,
        "generation_id":
            generation_id,
    }