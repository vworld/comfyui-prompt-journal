import json
from pathlib import Path
from datetime import datetime
import mimetypes

from app.services.metadata.exif_source import inspect


def extract_asset_metadata(file_path: str | Path) -> dict:
    path = Path(file_path)

    stat = path.stat()

    mime_type, _ = mimetypes.guess_type(path.name)

    result = {
        "file_name": path.name,
        "file_path": str(path.resolve()),
        "file_timestamp": int(stat.st_mtime),
        "file_size": stat.st_size,
        "mime_type": mime_type,
        "width": None,
        "height": None,
        "fps": None,
        "duration_seconds": None,
        "metadata_json": None,
    }

    try:
        raw = inspect(path)

        result["metadata_json"] = json.dumps(raw, ensuure_ascii=False)

        meta = raw.get("metadata", {})

        result["width"] = (
                meta.get("Track1:ImageWidth")
                or meta.get("PNG:ImageWidth")
                or meta.get("File:ImageWidth")
        )

        result["height"] = (
                meta.get("Track1:ImageHeight")
                or meta.get("PNG:ImageHeight")
                or meta.get("File:ImageHeight")
        )

        result["fps"] = meta.get(
            "Track1:VideoFrameRate"
        )

    except Exception:
        pass

    return result
