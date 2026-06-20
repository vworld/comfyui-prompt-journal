from pathlib import Path
import zipfile

from app.config.config import CONFIG


REVIEW_FILES = [
    "manifest.json",
    "review.md",
    "llm_context.json",
    "llm_output.json",
    "warnings.json",
]


def archive_review_package(
    package_dir: str | Path,
    generation_id: int,
) -> Path:

    package_dir = Path(
        package_dir
    )

    review_dir = (
        Path(
            CONFIG[
                "asset_archive_dir"
            ]
        )
        / "reviews"
    )

    review_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    zip_path = (
        review_dir
        / f"{generation_id}.zip"
    )

    with zipfile.ZipFile(
        zip_path,
        "w",
        zipfile.ZIP_DEFLATED,
    ) as archive:

        for file_name in REVIEW_FILES:

            source = (
                package_dir
                / file_name
            )

            if source.exists():

                archive.write(
                    source,
                    arcname=file_name,
                )

    return zip_path