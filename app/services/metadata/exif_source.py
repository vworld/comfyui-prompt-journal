"""
exif_source.py

Parses the exiftool-JSON dumps you're actually working with -- shape:

    {"file": "<path>", "metadata": {<namespaced exiftool fields>}}

Namespacing varies by container:
- PNG:        PNG:ImageWidth, PNG:ImageHeight, PNG:Prompt, PNG:Workflow
- QuickTime:  QuickTime:Duration (container-level)
- Track1:     the first track -- for our samples this is always video
                (ImageWidth/ImageHeight/VideoFrameRate/TrackDuration)
- Track2:     a second track -- audio, when present (AudioFormat/
                AudioChannels/AudioSampleRate)
- Keys:       QuickTime "Keys" atom -- where ComfyUI's video-export nodes
                stash Prompt/Workflow (mirrors PNG's text chunks)

This module's only job: produce a (prompt_dict, workflow_dict, media_probe)
triple. No graph interpretation here.
"""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path
from typing import TYPE_CHECKING, Any, cast

if TYPE_CHECKING:
    from app.schemas.types.metadata import ExifDump, MediaProbe, ParseResult


def load_exiftool_dump(path_or_dict: Path | ExifDump) -> ExifDump:
    if isinstance(path_or_dict, dict):
        return path_or_dict
    with open(path_or_dict, encoding="utf-8") as f:
        return json.load(f)


def _coerce_dict(blob: Any) -> dict[str, Any] | None:
    if blob is None:
        return None
    if isinstance(blob, dict):
        return cast("dict[str, Any]", blob)
    if isinstance(blob, str):
        try:
            parsed = json.loads(blob)
            return cast("dict[str, Any]", parsed) if isinstance(parsed, dict) else None
        except json.JSONDecodeError:
            return None
    return None


def _parse_duration(val: Any) -> float | None:
    """exiftool durations show up as '5.06 s' (str) or already-numeric."""
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, str):
        m = re.match(r"[\d.]+", val.strip())
        if m:
            return float(m.group())
    return None


def extract_prompt_workflow(
    meta: dict[str, Any],
) -> tuple[dict[str, Any] | None, dict[str, Any] | None, list[str]]:
    """Finds the prompt/workflow blobs regardless of which namespace they
    landed in (PNG:* for images, Keys:* for QuickTime-based video/audio)."""
    warnings: list[str] = []
    prompt = workflow = None

    for key in ("PNG:Prompt", "Keys:Prompt", "XMP:Prompt"):
        if key in meta:
            prompt = _coerce_dict(meta[key])
            if prompt is None:
                warnings.append(f"Found '{key}' but couldn't parse it as JSON/dict")
            break

    for key in ("PNG:Workflow", "Keys:Workflow", "XMP:Workflow"):
        if key in meta:
            workflow = _coerce_dict(meta[key])
            if workflow is None:
                warnings.append(f"Found '{key}' but couldn't parse it as JSON/dict")
            break

    if prompt is None:
        warnings.append(
            "No Prompt field found under any known namespace (PNG:/Keys:/XMP:)"
        )

    return prompt, workflow, warnings


def extract_media_probe(meta: dict[str, Any]) -> MediaProbe:
    """Pulls ACTUAL (ground-truth) file properties -- as opposed to what the
    workflow graph requested. Tries image-style fields first, then
    QuickTime/video-style fields."""
    probe: MediaProbe = {
        "width": None,
        "height": None,
        "fps": None,
        "duration_seconds": None,
        "has_audio": False,
        "audio_format": None,
        "audio_channels": None,
        "audio_sample_rate": None,
        "file_type": meta.get("File:FileType"),
        "mime_type": meta.get("File:MIMEType"),
    }

    # Image-style (PNG/WEBP/etc.)
    if meta.get("PNG:ImageWidth") is not None:
        probe["width"] = meta.get("PNG:ImageWidth")
        probe["height"] = meta.get("PNG:ImageHeight")
        return probe
    if meta.get("File:ImageWidth") is not None and "QuickTime:Duration" not in meta:
        probe["width"] = meta.get("File:ImageWidth")
        probe["height"] = meta.get("File:ImageHeight")
        return probe

    # Video/audio-style (QuickTime / Track1 = video, Track2 = audio)
    probe["width"] = meta.get("Track1:ImageWidth")
    probe["height"] = meta.get("Track1:ImageHeight")
    probe["fps"] = meta.get("Track1:VideoFrameRate")
    probe["duration_seconds"] = _parse_duration(
        meta.get("QuickTime:Duration") or meta.get("Track1:TrackDuration")
    )

    if meta.get("Track2:AudioFormat") is not None:
        probe["has_audio"] = True
        probe["audio_format"] = meta.get("Track2:AudioFormat")
        probe["audio_channels"] = meta.get("Track2:AudioChannels")
        probe["audio_sample_rate"] = meta.get("Track2:AudioSampleRate")

    return probe


def parse_exif_dump(exif_dump: ExifDump) -> ParseResult:
    """Top-level convenience: returns {'source_file', 'prompt', 'workflow',
    'media_probe', 'warnings'}."""
    # dump = load_exiftool_dump(path_or_dict)
    meta = exif_dump["metadata"]
    source_file = exif_dump["file"]

    prompt, workflow, warnings = extract_prompt_workflow(meta)
    probe = extract_media_probe(meta)

    return {
        "source_file": source_file,
        "prompt": prompt,
        "workflow": workflow,
        "media_probe": probe,
        "warnings": warnings,
    }


def inspect_file(file_path: str | Path) -> ExifDump:
    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(path)

    result: subprocess.CompletedProcess[str] = subprocess.run(
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

    metadata: dict[str, Any] = data[0] if data else {}

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
