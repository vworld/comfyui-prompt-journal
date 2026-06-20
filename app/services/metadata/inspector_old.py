from __future__ import annotations

import json
import subprocess
from pathlib import Path
from typing import Any


class MetadataInspector:
    """
    Reads all metadata available in a media file.

    Current implementation uses exiftool as the source of truth.

    Goal:
        Return everything available without interpretation.

    No business logic.
    No extraction.
    No normalization.
    """

    @staticmethod
    def inspect(file_path: str | Path) -> dict[str, Any]:
        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(path)

        result = subprocess.run(
            [
                "exiftool",
                "-j",
                "-G1",
                "-struct",
                str(path),
            ],
            capture_output=True,
            text=True,
            check=True,
        )

        data = json.loads(result.stdout)

        metadata = data[0] if data else {}

        for key in ("Keys:Workflow", "Keys:Prompt", "PNG:Workflow", "PNG:Prompt"):
            value = metadata.get(key)

            if not isinstance(value, str):
                continue

            try:
                metadata[key] = json.loads(value)
            except json.JSONDecodeError:
                pass

        return {
            "file": str(path),
            "metadata": metadata,
        }

    @staticmethod
    def dump(
            file_path: str | Path,
            output_path: str | Path | None = None,
    ) -> dict[str, Any]:
        metadata = MetadataInspector.inspect(file_path)

        if output_path:
            output_path = Path(output_path)

            with open(output_path, "w", encoding="utf-8") as fp:
                json.dump(
                    metadata,
                    fp,
                    # indent=4,
                    ensure_ascii=False,
                    separators=(",", ":"),
                )

        return metadata
