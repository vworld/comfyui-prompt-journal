"""
raw_metadata.py

Format-agnostic extraction of ComfyUI's embedded metadata.

ComfyUI stamps two JSON blobs into its output files:
  - "prompt"   -> the API-format execution graph that actually ran (this is
                  the one that matters for "what config produced this file")
  - "workflow" -> the UI-format graph (node positions, groups, widgets_values).
                  Useful for human-readable extras (group/note titles) but
                  redundant with "prompt" for generation parameters.

Where these live depends on container:
  - PNG / WEBP / GIF (images)   -> tEXt/iTXt chunks (PNG) or EXIF UserComment (WEBP)
  - MP4 / WEBM / MOV / MKV / AVI (video, e.g. VHS_VideoCombine output) -> a
    container-level metadata tag, almost always "comment" via ffmpeg.
  - FLAC / MP3 / OGG (audio)    -> same idea, via ffprobe format tags.

This module's job is ONLY to get the raw string/dict blobs out of the file.
JSON parsing / graph interpretation happens in graph.py.
"""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path
from typing import Any

IMAGE_EXTS = {".png", ".webp", ".gif", ".jpg", ".jpeg"}
FFPROBE_EXTS = {
    ".mp4", ".mov", ".webm", ".mkv", ".avi", ".m4v",
    ".flac", ".mp3", ".ogg", ".wav", ".m4a",
}

# Tag keys ffmpeg/various muxers might have used to stash the metadata string.
CANDIDATE_TAG_KEYS = ["comment", "Comment", "COMMENT", "description", "Description", "DESCRIPTION"]


class RawMetadataResult:
    """Container for whatever raw key->string-or-dict blobs we pulled out of a file."""

    def __init__(self, source_file: str, file_format: str):
        self.source_file = source_file
        self.file_format = file_format
        self.location: str | None = None   # where we found it, e.g. "png_text_chunk:prompt"
        self.fields: dict[str, Any] = {}    # e.g. {"prompt": "<json str or dict>", "workflow": "..."}
        self.warnings: list[str] = []

    def to_dict(self) -> dict:
        return {
            "source_file": self.source_file,
            "file_format": self.file_format,
            "location": self.location,
            "fields": self.fields,
            "warnings": self.warnings,
        }


def extract_raw_metadata(filepath: str | Path) -> RawMetadataResult:
    filepath = Path(filepath)
    ext = filepath.suffix.lower()
    result = RawMetadataResult(str(filepath), ext.lstrip("."))

    if not filepath.exists():
        result.warnings.append(f"File not found: {filepath}")
        return result

    if ext in IMAGE_EXTS:
        _extract_from_image(filepath, ext, result)
    elif ext in FFPROBE_EXTS:
        _extract_from_ffprobe(filepath, result)
    else:
        result.warnings.append(f"Unrecognized extension '{ext}', trying ffprobe as a fallback")
        _extract_from_ffprobe(filepath, result)

    if not result.fields:
        result.warnings.append("No ComfyUI metadata fields found in this file")

    return result


def _extract_from_image(filepath: Path, ext: str, result: RawMetadataResult) -> None:
    from PIL import Image

    try:
        img = Image.open(filepath)
        img.load()  # ensure PNG text chunks / WEBP info are populated
    except Exception as e:
        result.warnings.append(f"PIL failed to open image: {e}")
        return

    info = dict(img.info or {})

    # --- PNG / GIF style: plain text chunks already decoded to str by PIL ---
    found_any = False
    for key in ("prompt", "workflow"):
        if key in info and info[key]:
            result.fields[key] = info[key]
            found_any = True
    # Some custom save nodes use other key names; capture anything else that
    # looks like it could be JSON, without overwriting prompt/workflow.
    for key, val in info.items():
        if key in ("prompt", "workflow"):
            continue
        if isinstance(val, str) and val.strip().startswith("{"):
            result.fields[f"extra:{key}"] = val
            found_any = True

    if found_any:
        result.location = f"{ext.lstrip('.')}_text_chunk"
        return

    # --- WEBP style: metadata often lives in EXIF UserComment ---
    exif_bytes = info.get("exif")
    if exif_bytes:
        text = _decode_exif_user_comment(img)
        if text:
            parsed = _try_json(text)
            if isinstance(parsed, dict) and ("prompt" in parsed or "workflow" in parsed):
                for k in ("prompt", "workflow"):
                    if k in parsed:
                        result.fields[k] = parsed[k]
                result.location = "webp_exif_usercomment"
                return
            elif isinstance(parsed, dict) and _looks_like_prompt_graph(parsed):
                result.fields["prompt"] = parsed
                result.location = "webp_exif_usercomment"
                return
            else:
                result.fields["extra:exif_usercomment"] = text
                result.location = "webp_exif_usercomment"
                return

    result.warnings.append("No prompt/workflow keys found in image info or EXIF")


def _decode_exif_user_comment(img) -> str | None:
    try:
        exif = img.getexif()
    except Exception:
        return None
    # UserComment tag id = 0x9286 (37510), lives in the Exif IFD
    try:
        exif_ifd = exif.get_ifd(0x8769)  # Exif IFD pointer
    except Exception:
        exif_ifd = {}
    raw = exif_ifd.get(0x9286) or exif.get(0x9286)
    if raw is None:
        return None
    if isinstance(raw, bytes):
        # EXIF UserComment is prefixed with an 8-byte character-code designation
        for prefix in (b"UNICODE\x00", b"ASCII\x00\x00\x00", b"\x00" * 8):
            if raw.startswith(prefix):
                raw = raw[len(prefix):]
                break
        try:
            return raw.decode("utf-16-le") if b"\x00" in raw[:4] else raw.decode("utf-8", errors="ignore")
        except Exception:
            return raw.decode("utf-8", errors="ignore")
    if isinstance(raw, str):
        return raw
    return None


def _extract_from_ffprobe(filepath: Path, result: RawMetadataResult) -> None:
    try:
        proc = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-show_entries", "format_tags",
                "-of", "json",
                str(filepath),
            ],
            capture_output=True, text=True, timeout=30,
        )
    except FileNotFoundError:
        result.warnings.append("ffprobe not installed/available on PATH")
        return
    except subprocess.TimeoutExpired:
        result.warnings.append("ffprobe timed out")
        return

    if proc.returncode != 0:
        result.warnings.append(f"ffprobe error: {proc.stderr.strip()[:300]}")
        return

    try:
        payload = json.loads(proc.stdout)
    except json.JSONDecodeError:
        result.warnings.append("ffprobe returned non-JSON output")
        return

    tags = (payload.get("format") or {}).get("tags") or {}
    if not tags:
        result.warnings.append("ffprobe found no format-level tags")
        return

    matched_key = None
    for key in CANDIDATE_TAG_KEYS:
        if key in tags and tags[key]:
            matched_key = key
            break

    if matched_key is None:
        # last resort: scan every tag value for something JSON-shaped
        for key, val in tags.items():
            if isinstance(val, str) and val.strip().startswith("{"):
                matched_key = key
                break

    if matched_key is None:
        result.warnings.append(f"No JSON-shaped tag found; available tags: {list(tags.keys())}")
        return

    raw_text = tags[matched_key]
    parsed = _try_json(raw_text)

    if isinstance(parsed, dict) and ("prompt" in parsed or "workflow" in parsed):
        for k in ("prompt", "workflow"):
            if k in parsed:
                result.fields[k] = parsed[k]
        result.location = f"ffprobe_tag:{matched_key}"
    elif isinstance(parsed, dict) and _looks_like_prompt_graph(parsed):
        result.fields["prompt"] = parsed
        result.location = f"ffprobe_tag:{matched_key}"
    elif parsed is not None:
        result.fields[f"extra:{matched_key}"] = parsed
        result.location = f"ffprobe_tag:{matched_key}"
    else:
        result.fields[f"extra:{matched_key}"] = raw_text
        result.location = f"ffprobe_tag:{matched_key}"
        result.warnings.append(f"Tag '{matched_key}' was not valid JSON; stored raw")

    # Also surface any other tags that look JSON-shaped (some custom nodes
    # write prompt/workflow into separate tags, e.g. "workflow" tag directly)
    for key, val in tags.items():
        if key == matched_key:
            continue
        if key.lower() in ("prompt", "workflow") and key not in result.fields:
            p = _try_json(val)
            result.fields[key.lower()] = p if p is not None else val


def _try_json(text: Any) -> Any:
    if isinstance(text, (dict, list)):
        return text
    if not isinstance(text, str):
        return None
    text = text.strip()
    if not text:
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Some tools double-escape; try unescaping once and retry.
        try:
            return json.loads(text.encode("utf-8").decode("unicode_escape"))
        except Exception:
            return None


def _looks_like_prompt_graph(d: dict) -> bool:
    """Heuristic: a 'prompt' API-format graph is keyed by node-id strings,
    each pointing to a dict with a 'class_type' key."""
    if not d:
        return False
    sample_keys = list(d.keys())[:5]
    hits = 0
    for k in sample_keys:
        v = d[k]
        if isinstance(v, dict) and "class_type" in v:
            hits += 1
    return hits > 0 and hits >= len(sample_keys) // 2
