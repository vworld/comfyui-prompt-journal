import mimetypes
from pathlib import Path
from typing import Any


def get_mime_type(metadata: dict[str, Any], file_path: Path) -> str | None:

    mime: Any | None = metadata.get("File:MIMEType")
    if isinstance(mime, str):
        return mime

    mime_str, _ = mimetypes.guess_type(file_path.name)
    return mime_str
