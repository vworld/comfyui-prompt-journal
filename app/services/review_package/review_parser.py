from pathlib import Path


def parse_review_file(
    review_file: str | Path,
) -> dict:

    review_file = Path(review_file)

    content = review_file.read_text(
        encoding="utf-8"
    )

    intent_marker = "# Intent"
    review_marker = "# Manual Review"

    if intent_marker not in content:
        raise ValueError(
            "Missing # Intent heading"
        )

    if review_marker not in content:
        raise ValueError(
            "Missing # Manual Review heading"
        )

    before_review, review_text = (
        content.split(
            review_marker,
            maxsplit=1,
        )
    )

    intent_text = (
        before_review
        .replace(
            intent_marker,
            "",
            1,
        )
        .strip()
    )

    review_text = review_text.strip()

    return {
        "raw_intent": intent_text,
        "raw_review": review_text,
    }