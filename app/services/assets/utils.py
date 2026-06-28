from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config.config import CONFIG
from app.models.asset import Asset
from app.services.assets.hash import sha256_file


def find_asset_by_hash(
    db: Session,
    file_hash: str,
):
    return db.scalar(select(Asset).where(Asset.file_hash == file_hash))


def find_asset_by_source_path(
    db: Session,
    source_path: Path,
) -> Asset | None:
    file_hash = sha256_file(source_path)

    return find_asset_by_hash(
        db=db,
        file_hash=file_hash,
    )


def output_file_role(
    workflow_type: str | None,
) -> str:
    if not workflow_type:
        return "output_asset"

    workflow_type = workflow_type.lower()

    if "video" in workflow_type:
        return "output_video"

    if "image" in workflow_type:
        return "output_image"

    return "output_asset"


def resolve_input_asset_path(input_file_name: str | None) -> Path:
    """
    Computes the path and validates file exists

    Raises:
        ValueError: If file_name is not found in assetInfo obj' {input_asset}"
        FileNotFoundError: If a file at the resolved path does not exist

    """
    if input_file_name is None:
        raise ValueError(f"file_name not found in assetInfo obj' {input_file_name}")

    file_path = Path(CONFIG["comfyui_input_dir"]) / input_file_name
    if not file_path.exists():
        raise FileNotFoundError(f"Input File not found: {file_path}")
    return file_path


def get_archive_media_path():
    return CONFIG["asset_archive_dir"] / "media"


def get_upload_dir():
    UPLOAD_DIR = Path(CONFIG["upload_data_dir"])

    UPLOAD_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )
    return UPLOAD_DIR
