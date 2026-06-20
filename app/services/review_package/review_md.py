from pathlib import Path


def write_review_template(
    review_dir: Path,
):
    review_file = (
        review_dir
        / "review.md"
    )

    review_file.write_text(
        (
            "# Intent\n\n"
            "# Manual Review\n"
        ),
        encoding="utf-8",
    )