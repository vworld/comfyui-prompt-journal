from pathlib import Path

from app.services.review_package.validate import validate_review_package
from app.services.review_package.import_package import (
    import_review_package as import_review_package_service,
)

from app.cli.ui.banner import print_header, print_kv, print_line, print_error, print_success
from app.cli.ui.prompts import text_prompt, confirm_prompt


def import_review_package():

    print_header("Import Review Package")

    package_dir = text_prompt("Review Package Directory", required=True)

    package_dir = Path(package_dir)

    if not package_dir.exists():
        print_error(f"Directory not found: {package_dir}")
        return

    try:
        validated = validate_review_package(package_dir)

    except Exception as exc:
        print_line()
        print_error("Validation failed")
        print_line(str(exc))
        return

    manifest = validated["manifest"]
    generation_id = validated["generation_id"]
    llm_output = validated["llm_output"]

    print_header("Import Summary")

    print_kv("Generation ID", generation_id)
    print_kv("Shot ID", manifest["shot_id"])

    print_line()

    print_header("LLM Fields")

    print_kv("Intent Length", len(llm_output["cleaned_intent"]))
    print_kv("Review Length", len(llm_output["cleaned_review"]))

    print_line()

    if not confirm_prompt("Continue?"):
        print_line()
        print_line("Operation cancelled")
        return

    try:
        generation_id = import_review_package_service(package_dir)

    except Exception as exc:
        print_line()
        print_error(f"ERROR: {exc}")
        raise

    print_line()
    print_success("Review package imported")
    print_kv("Generation ID", generation_id)
    print_line()
