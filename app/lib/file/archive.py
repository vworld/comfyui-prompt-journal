import shutil
from pathlib import Path

from app.lib.file.paths import media_archive_dir


def archive_media_file(
    source_file: str | Path,
    archive_file_name: str,
) -> Path:

    archive_dir = media_archive_dir()

    archive_dir.mkdir(parents=True, exist_ok=True)

    destination = archive_dir / archive_file_name

    shutil.copy2(source_file, destination)

    return destination
