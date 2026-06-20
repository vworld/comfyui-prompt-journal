import json
from pathlib import Path


def write_warnings(
    review_dir: Path,
    warnings: list | None = None,
):
    warnings = warnings or []

    path = (
        review_dir
        / "warnings.json"
    )

    path.write_text(
        json.dumps(
            warnings,
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )