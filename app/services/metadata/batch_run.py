"""
batch_run.py

Convenience CLI: run schema extraction over one or many exiftool-JSON
metadata dumps and emit JSONL (one object per line) -- handy as the input
to a DB loader.

    python -m comfy_extractor.batch_run *.json > generations.jsonl
    python -m comfy_extractor.batch_run /path/to/metadata_dir > generations.jsonl
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from .schema_extract import extract_schema


def iter_targets(args: list[str]):
    for arg in args:
        p = Path(arg)
        if p.is_dir():
            yield from sorted(p.glob("*.json"))
        else:
            yield p


def main():
    if len(sys.argv) < 2:
        print("Usage: python -m comfy_extractor.batch_run <file_or_dir> [...]", file=sys.stderr)
        sys.exit(1)

    n_ok, n_err = 0, 0
    for path in iter_targets(sys.argv[1:]):
        try:
            obj = extract_schema(str(path))
            if "error" in obj:
                n_err += 1
                print(json.dumps({"_input_file": str(path), **obj}, ensure_ascii=False), file=sys.stderr)
            else:
                n_ok += 1
                print(json.dumps({"_input_file": str(path), **obj}, ensure_ascii=False))
        except Exception as e:
            n_err += 1
            print(json.dumps({"_input_file": str(path), "error": f"exception: {e}"}, ensure_ascii=False), file=sys.stderr)

    print(f"# processed {n_ok + n_err} files: {n_ok} ok, {n_err} failed", file=sys.stderr)


if __name__ == "__main__":
    main()
