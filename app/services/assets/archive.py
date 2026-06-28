import shutil
from pathlib import Path

from app.services.assets.utils import get_archive_media_path


def archive_media_file(
    source_file: str | Path,
    archive_file_name: str,
) -> Path:
    media_dir = get_archive_media_path()

    media_dir.mkdir(parents=True, exist_ok=True)

    destination = media_dir / archive_file_name

    shutil.copy2(source_file, destination)

    return destination
