from pathlib import Path

from app.services.metadata.schema_extract import extract_schema
from app.services.review_package.create import (
    create_review_package as create_review_package_service,
)

from app.cli.helpers.shot_picker import pick_shot
from app.cli.helpers.review_summary import review_summary

from app.cli.ui.banner import print_header, print_kv, print_line, print_error, print_success
from app.cli.ui.prompts import text_prompt


def create_review_package():

    print_header("Create Review Package")

    output_file = text_prompt("Output File", required=True)

    output_file = Path(output_file)

    if not output_file.exists():
        print_error(f"File not found: {output_file}")
        return

    try:
        metadata = extract_schema(str(output_file))

    except Exception as exc:
        print_line()
        print_error("Metadata extraction failed")
        print_line(str(exc))
        return

    print_line()
    print_line("Metadata extracted")
    print_kv("Workflow", metadata.get("workflow_name"))
    print_kv("Type", metadata.get("workflow_type"))

    shot = pick_shot()

    if not shot:
        print_line()
        print_line("Operation cancelled")
        return

    confirmed = review_summary(
        output_file=output_file,
        metadata=metadata,
        shot=shot,
    )

    if not confirmed:
        print_line()
        print_line("Operation cancelled")
        return

    try:
        generation_id = create_review_package_service(
            output_file=output_file,
            shot_id=shot["shot_id"],
        )

    except Exception as exc:
        print_line()
        print_error(f"ERROR: {exc}")
        raise

    print_line()
    print_success("Review package created")
    print_kv("Generation ID", generation_id)
    print_line()
