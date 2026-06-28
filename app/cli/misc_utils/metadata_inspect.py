import json
import sys
from datetime import datetime
from pathlib import Path

from app.config.config import CONFIG
from app.services.metadata.schema_extract import extract_schema

SUPPORTED_EXTENSIONS = {
    ".png",
    ".webp",
    ".jpg",
    ".jpeg",
    ".mp4",
    ".mov",
    ".webm",
}


def get_output_dir(input_path: Path) -> Path:
    base_dir = Path(CONFIG["temp_dir"]) / "metadata"

    if input_path.is_dir():
        return base_dir / input_path.name

    return base_dir


def process_file(file_path: Path, output_dir: Path, print_json: bool = False):
    try:
        result = extract_schema(str(file_path))

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        output_file = output_dir / f"{file_path.stem}_{timestamp}.json"
        output_file.parent.mkdir(parents=True, exist_ok=True)

        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)

        if print_json:
            print(json.dumps(result, indent=2, ensure_ascii=False))

        return output_file

    except Exception as e:
        print(f"ERROR: {file_path.name}: {e}")
        return False


def process_directory(directory: Path):
    output_dir = get_output_dir(directory)

    files = [
        p
        for p in directory.iterdir()
        if p.is_file() and p.suffix.lower() in SUPPORTED_EXTENSIONS
    ]

    success = 0
    failed = 0

    for file_path in files:
        print(f"Processing: {file_path.name}")

        if process_file(file_path, output_dir):
            success += 1
        else:
            failed += 1

    print()
    print(f"Processed: {len(files)}")
    print(f"Success: {success}")
    print(f"Failed: {failed}")
    print(f"Output: {output_dir}")


def inspect_file_metadata(file_path: str):
    # print(sys.argv)
    # if len(sys.argv) != 2:
    #     print("Usage:")
    #     print("python -m app.cli.metadata <file_or_directory>")
    #     sys.exit(1)

    target = Path(file_path)

    if not target.exists():
        print(f"Path not found: {target}")
        sys.exit(1)

    if target.is_file():
        output_dir = get_output_dir(target)

        saved_to = process_file(
            file_path=target,
            output_dir=output_dir,
            print_json=True,
        )

        print()
        print(f"Saved to: {saved_to}")

    else:
        process_directory(target)
