from pathlib import Path

from app.cli.ui.banner import print_header, print_kv, print_line
from app.cli.ui.prompts import confirm_prompt
from app.schemas.types.metadata import ExtractedSchema


def review_summary(
    output_file: str | Path,
    metadata: ExtractedSchema,
    shot: dict,
) -> bool:

    print_header("Review Package Summary")

    print_kv("Output File", Path(output_file).name)
    print_kv("Workflow Name", metadata.get("workflow_name"))
    print_kv("Workflow Type", metadata.get("workflow_type"))
    print_kv("Duration", metadata.get("duration_seconds"))

    print_kv(
        "Resolution",
        f"{metadata.get('output_width')}x{metadata.get('output_height')}",
    )

    print_kv("Input Count", len(metadata.get("input_assets", [])))

    print_line()

    print_kv("Shot", f"{shot['shot_id']} | {shot['shot_name']}")

    print_kv(
        "Path",
        f"{shot['project_name']}/{shot['scene_name']}/{shot['clip_name']}",
    )

    print_line()

    return confirm_prompt("Continue?")
