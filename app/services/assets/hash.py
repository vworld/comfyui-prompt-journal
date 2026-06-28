import hashlib
from pathlib import Path


def sha256_file(file_path: str | Path) -> str:
    path = Path(file_path)

    hasher = hashlib.sha256()

    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            hasher.update(chunk)

    return hasher.hexdigest()