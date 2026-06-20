"""
schema_extract.py

The actual entry point:

    from comfy_extractor.schema_extract import extract_schema

    obj = extract_schema("Wan2_2_i2v_00001__metadata.json")

Produces an object matching your target schema exactly:

    workflow_name, workflow_id, workflow_type, prompt, negative_prompt,
    all_prompts, requested_width, requested_height, output_width,
    output_height, fps, frame_count, duration_seconds, seed, sampler,
    scheduler, steps, cfg, input_assets, primary_model, models

Plus a "_debug" block (basis/source for the judgment-call fields, and any
warnings) -- strip it out downstream once you're happy with the heuristics,
it's there so the rules are auditable rather than a black box.
"""

from __future__ import annotations

from typing import Any
from pathlib import Path

from .exif_source import parse as parse_exif_dump, inspect
from .semantic import SemanticExtractor
from .fold import NodeRef, AmbiguousBranch


def _clean(value: Any) -> Any:
    """Recursively convert any NodeRef/AmbiguousBranch leftovers (e.g. from
    an unresolved switch) into plain dicts so the result is always
    JSON-safe."""
    if isinstance(value, (NodeRef, AmbiguousBranch)):
        return value.to_dict()
    if isinstance(value, dict):
        return {k: _clean(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_clean(v) for v in value]
    return value


def extract_schema(file_path: str | Path) -> dict:
    raw = inspect(file_path)
    parsed = parse_exif_dump(raw)
    warnings = list(parsed["warnings"])

    if parsed["prompt"] is None:
        return {
            "source_file": parsed["source_file"],
            "error": "no_prompt_graph_found",
            "_debug": {"warnings": warnings, "media_probe": parsed["media_probe"]},
            "_raw": raw.get("metadata"),
        }

    try:
        sx = SemanticExtractor(parsed["prompt"], parsed["workflow"], parsed["media_probe"])
    except Exception as e:
        return {
            "source_file": parsed["source_file"],
            "error": f"graph_parse_failed: {e}",
            "_debug": {"warnings": warnings},
            "_raw": raw.get("metadata"),
        }
    warnings += sx.warnings

    primary_sampler = sx.primary_sampler_id()
    sampling = sx.sampling_params(primary_sampler)
    dims = sx.requested_dimensions(primary_sampler)
    frames = sx.frame_count()
    prompts = sx.all_prompts()
    pos, neg = sx.positive_negative(prompts)
    assets = sx.input_assets()
    models = sx.models()
    primary_model = sx.primary_model(models, primary_sampler)
    wtype = sx.infer_workflow_type(assets)
    wname, wid, wname_source = sx.workflow_name_and_id()

    probe = parsed["media_probe"]

    result = {
        "workflow_name": wname,
        "workflow_id": wid,
        "workflow_type": wtype["workflow_type"],

        "prompt": pos,
        "negative_prompt": neg,
        "all_prompts": prompts,

        "requested_width": dims["requested_width"],
        "requested_height": dims["requested_height"],
        "output_width": probe.get("width"),
        "output_height": probe.get("height"),

        "fps": probe.get("fps"),
        "frame_count": frames["frame_count"],
        "duration_seconds": probe.get("duration_seconds"),

        "seed": sampling["seed"],
        "sampler": sampling["sampler"],
        "scheduler": sampling["scheduler"],
        "steps": sampling["steps"],
        "cfg": sampling["cfg"],

        "input_assets": assets,
        "primary_model": primary_model,
        "models": models,
    }

    result["_debug"] = {
        "source_file": parsed["source_file"],
        "output_media_type": sx.output_media_type,
        "output_nodes": sx.output_nodes,
        "primary_sampler_node": primary_sampler,
        "workflow_type_basis": wtype["basis"],
        "workflow_name_source": wname_source,
        "requested_dims_source": dims["source"],
        "frame_count_source": frames["source"],
        "has_audio_track_in_output_file": probe.get("has_audio"),
        "live_node_count": len(sx.live_ids),
        "total_node_count": len(sx.ev.nodes),
        "warnings": warnings,
    }

    cleaned = _clean(result)
    cleaned["_raw"] = raw.get("metadata")

    return cleaned


if __name__ == "__main__":
    import sys
    import json

    for path in sys.argv[1:]:
        print(f"\n===== {path} =====")
        print(json.dumps(extract_schema(path), indent=2, ensure_ascii=False, default=str))
