import json
from pathlib import Path


def write_manifest(
    review_dir: Path,
    generation_id: int,
    shot_id: int,
    output_file: str,
    output_hash: str,
    input_files: list,
):
    payload = {
        "generation_id": generation_id,
        "shot_id": shot_id,
        "output_file": output_file,
        "output_hash": output_hash,
        "input_files": input_files,
    }

    manifest_file = (
        review_dir
        / "manifest.json"
    )

    manifest_file.write_text(
        json.dumps(
            payload,
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )