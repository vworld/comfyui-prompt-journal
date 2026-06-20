from pathlib import Path

from app.services.metadata.schema_extract import (
    extract_schema,
)

from app.services.review_package.create import (
    create_review_package as create_review_package_service
)

from app.cli.helpers.shot_picker import (
    pick_shot,
)

from app.cli.helpers.review_summary import (
    review_summary,
)


def create_review_package():
    print()
    print(
        "Create Review Package"
    )

    print(
        "---------------------"
    )

    print()

    output_file = input(
        "Output File: "
    ).strip()

    if not output_file:
        print(
            "Output file is required"
        )
        return

    output_file = Path(
        output_file
    )

    if not output_file.exists():
        print(
            f"File not found: "
            f"{output_file}"
        )

        return

    try:

        metadata = extract_schema(
            str(output_file)
        )

    except Exception as exc:

        print()
        print(
            "Metadata extraction "
            "failed"
        )

        print(exc)

        return

    print()
    print(
        "Metadata extracted"
    )

    print(
        f"Workflow: "
        f"{metadata.get('workflow_name')}"
    )

    print(
        f"Type: "
        f"{metadata.get('workflow_type')}"
    )

    print()

    shot = pick_shot()

    if not shot:
        print()
        print(
            "Operation cancelled"
        )

        return

    confirmed = review_summary(
        output_file=output_file,
        metadata=metadata,
        shot=shot,
    )

    if not confirmed:
        print()
        print(
            "Operation cancelled"
        )

        return

    try:

        generation_id = (
            create_review_package_service(
                output_file=output_file,
                shot_id=shot[
                    "shot_id"
                ],
            )
        )

    except Exception as exc:

        print()
        print(
            f"ERROR: {exc}"
        )

        raise

    print()
    print(
        "Review package created"
    )

    print(
        f"Generation ID: "
        f"{generation_id}"
    )

    print()
