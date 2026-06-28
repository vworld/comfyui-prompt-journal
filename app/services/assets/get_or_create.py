from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Asset
from app.services.assets.archive import archive_media_file
from app.services.assets.hash import sha256_file
from app.services.assets.metadata import extract_asset_metadata


def get_or_create_asset(
    db: Session,
    source_path: Path,
    role: str,
) -> Asset:

    file_hash = sha256_file(source_path)

    existing = db.scalar(select(Asset).where(Asset.file_hash == file_hash))

    if existing:
        return existing

    metadata = extract_asset_metadata(source_path)

    archive_name = archive_media_file(source_path)

    asset = Asset(
        file_name=source_path.name,
        file_path="",
        file_hash=file_hash,
        archive_file_name=archive_name,
        file_timestamp=0,
        mime_type=metadata.mime_type,
        file_size=metadata.file_size,
        width=metadata.width,
        height=metadata.height,
        fps=metadata.fps,
        duration_seconds=metadata.duration_seconds,
        description=None,
        metadata_json=""
    )

    db.add(asset)
    db.flush()

    return asset
