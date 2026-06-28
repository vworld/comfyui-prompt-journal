from pathlib import Path
from time import time_ns

from app.config.config import CONFIG


def comfyui_input_file_path(file_name: str) -> Path:
    return comfyui_input_files_dir_path() / file_name


def comfyui_input_files_dir_path() -> Path:
    return CONFIG["comfyui_input_dir"]


def comfyui_output_files_dir_path() -> Path:
    return CONFIG["comfyui_output_dir"]


def upload_file_path(file_orig_name: str) -> Path:
    suffix = Path(file_orig_name).suffix

    return upload_dir_path() / f"{time_ns()}{suffix}"


def upload_dir_path() -> Path:
    return CONFIG["upload_data_dir"]


def media_archive_dir() -> Path:
    return CONFIG["asset_archive_dir"] / "media"


def get_archive_file_name(orig_file_name: str, asset_id: int) -> str:
    return f"{asset_id}_{orig_file_name}"
