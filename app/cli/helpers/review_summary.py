from pathlib import Path


def review_summary(
    output_file: str | Path,
    metadata: dict,
    shot: dict,
) -> bool:

    print()
    print(
        "Review Package Summary"
    )

    print(
        "----------------------"
    )

    print()

    print(
        f"Output File: "
        f"{Path(output_file).name}"
    )

    print(
        f"Workflow Name: "
        f"{metadata.get('workflow_name')}"
    )

    print(
        f"Workflow Type: "
        f"{metadata.get('workflow_type')}"
    )

    print(
        f"Duration: "
        f"{metadata.get('duration_seconds')}"
    )

    print(
        f"Resolution: "
        f"{metadata.get('output_width')}x"
        f"{metadata.get('output_height')}"
    )

    print(
        f"Input Count: "
        f"{len(metadata.get('input_assets', []))}"
    )

    print()

    print(
        f"Shot: "
        f"{shot['shot_id']} | "
        f"{shot['shot_name']}"
    )

    print(
        f"Path: "
        f"{shot['project_name']}/"
        f"{shot['scene_name']}/"
        f"{shot['clip_name']}"
    )

    print()

    answer = input(
        "Continue? [y/N]: "
    ).strip().lower()

    return answer == "y"