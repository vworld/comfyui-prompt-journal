from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent


def resolve_path(value: str) -> Path:
    path = Path(value)

    if path.is_absolute():
        return path

    return (BASE_DIR / path).resolve()


CONFIG = {
    "base_dir": BASE_DIR,
    "database_path": resolve_path(os.getenv("DATABASE_PATH")),
    "database_backup_dir": resolve_path(os.getenv("DATABASE_BACKUP_DIR")),
    "schema_history": resolve_path(os.getenv("SCHEMA_HISTORY")),
    "comfyui_input_dir": resolve_path(os.getenv("COMFYUI_INPUT_DIR")),
    "comfyui_output_dir": resolve_path(os.getenv("COMFYUI_OUTPUT_DIR")),
    "asset_archive_dir": resolve_path(os.getenv("ASSET_ARCHIVE_DIR")),
    "review_package_dir": resolve_path(os.getenv("REVIEW_PACKAGE_DIR")),
    "temp_dir": resolve_path(os.getenv("TEMP_DIR")),
}
