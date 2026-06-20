from pathlib import Path
import shutil

from app.config.config import CONFIG


def archive_media_file(
    source_file: str | Path,
    archive_file_name: str,
) -> Path:
    media_dir = (
        CONFIG["asset_archive_dir"]
        / "media"
    )

    media_dir.mkdir(
        parents=True,
        exist_ok=True
    )

    destination = (
        media_dir
        / archive_file_name
    )

    shutil.copy2(
        source_file,
        destination
    )

    return destination