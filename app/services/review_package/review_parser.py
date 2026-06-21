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

    before_intent, after_intent = (
        content.split(
            intent_marker,
            maxsplit=1,
        )
    )

    intent_text, review_text = (
        after_intent.split(
            review_marker,
            maxsplit=1,
        )
    )

    intent_text = (
        intent_text.strip()
    )

    review_text = (
        review_text.strip()
    )

    return {
        "raw_intent": intent_text,
        "raw_review": review_text,
    }