from pathlib import Path

from app.services.review_package.validate import (
    validate_review_package,
)

from app.services.review_package.import_package import (
    import_review_package as import_review_package_service,
)


def import_review_package():
    print()
    print(
        "Import Review Package"
    )

    print(
        "---------------------"
    )

    print()

    package_dir = input(
        "Review Package Directory: "
    ).strip()

    if not package_dir:
        print(
            "Package directory is required"
        )

        return

    package_dir = Path(
        package_dir
    )

    if not package_dir.exists():
        print(
            f"Directory not found: "
            f"{package_dir}"
        )

        return

    try:

        validated = (
            validate_review_package(
                package_dir
            )
        )

    except Exception as exc:

        print()
        print(
            "Validation failed"
        )

        print(exc)

        return

    manifest = validated[
        "manifest"
    ]

    generation_id = validated[
        "generation_id"
    ]

    llm_output = validated[
        "llm_output"
    ]

    print()
    print(
        "Import Summary"
    )

    print(
        "--------------"
    )

    print()

    print(
        f"Generation ID: "
        f"{generation_id}"
    )

    print(
        f"Shot ID: "
        f"{manifest['shot_id']}"
    )

    print()

    print(
        "LLM Fields"
    )

    print(
        "----------"
    )

    print(
        f"Intent Length: "
        f"{len(llm_output['cleaned_intent'])}"
    )

    print(
        f"Review Length: "
        f"{len(llm_output['cleaned_review'])}"
    )

    print()

    answer = input(
        "Continue? [y/N]: "
    ).strip().lower()

    if answer != "y":
        print()
        print(
            "Operation cancelled"
        )

        return

    try:

        generation_id = (
            import_review_package_service(
                package_dir
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
        "Review package imported"
    )

    print(
        f"Generation ID: "
        f"{generation_id}"
    )

    print()
