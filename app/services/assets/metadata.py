import json
from pathlib import Path
import mimetypes

from app.services.metadata.exif_source import inspect, extract_media_probe


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


    raw = inspect(path)

    result["metadata_json"] = json.dumps(raw, ensure_ascii=False)

    meta = raw.get("metadata", {})

    probe = extract_media_probe(meta)

    result["width"] = probe.get("width")
    result["height"] = probe.get("height")
    result["fps"] = probe.get("fps")
    result["duration_seconds"] = probe.get("duration_seconds")

    return result
