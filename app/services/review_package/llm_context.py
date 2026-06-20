import json
from pathlib import Path


def write_llm_context(
    review_dir: Path,
    generation_id: int,
    metadata: dict,
    input_files: list,
    output_file: str,
):
    payload = {
        "generation_id": generation_id,
        "output_file": output_file,
        "workflow_name": metadata.get(
            "workflow_name"
        ),
        "workflow_type": metadata.get(
            "workflow_type"
        ),
        "all_prompts": metadata.get(
            "all_prompts"
        ),
        "duration_seconds": metadata.get(
            "duration_seconds"
        ),
        "fps": metadata.get(
            "fps"
        ),
        "input_files": input_files,
    }

    context_file = (
        review_dir
        / "llm_context.json"
    )

    context_file.write_text(
        json.dumps(
            payload,
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )