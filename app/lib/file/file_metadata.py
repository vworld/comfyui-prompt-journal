from functools import cached_property
from pathlib import Path
from typing import Any

from app.lib.file.input_file import InputFile
from app.lib.file.mime_type import get_mime_type
from app.lib.metadata.exif_source import inspect_file, parse_exif_dump
from app.lib.metadata.semantic import SemanticExtractor
from app.schemas.types.metadata import (
    ExifDump,
    ExtractedSchema,
    ExtractedSchemaDebug,
    FrameCountInfo,
    InputAssetInfo,
    ModelUsedInfo,
    ParseResult,
    PromptUsed,
    RequestedDimensions,
    SamplingParams,
    Warnings,
    WorkflowType,
    WorkflowTypeInfo,
)


class FileMetadata:
    def __init__(self, path: Path | str) -> None:
        self.path = Path(path)
        if not self.path.is_file():
            raise ValueError(
                "Instantiating FileMetadata with a non-file: "
                f"is not allowed: {self.path}"
            )

    def verify(self):
        _ = self.raw
        _ = self.parsed

        semantic = self._semantic_metadata
        if semantic is None:
            raise ValueError("File does not contain a valid ComfyUI prompt graph")

        for input_file in self.input_assets:
            input_file.verify()

    @cached_property
    def raw(self) -> ExifDump:
        return inspect_file(self.path)

    @cached_property
    def parsed(self) -> ParseResult:
        return parse_exif_dump(self.raw)

    @cached_property
    def _semantic_metadata(self) -> SemanticExtractor | None:
        prompt: dict[str, Any] | None = self.parsed.get("prompt")
        if prompt is not None:
            return SemanticExtractor(
                prompt,
                self.parsed["workflow"],
                self.parsed["media_probe"],
            )
        return None

    #### properties

    @cached_property
    def mime_type(self) -> str | None:
        return get_mime_type(self.raw["metadata"], self.path)

    @cached_property
    def workflow_id(self) -> str | None:
        _, workflow_id, _ = self._workflow
        return workflow_id

    @cached_property
    def workflow_name(self) -> str | None:
        name, _, _ = self._workflow
        return name

    @cached_property
    def workflow_type(self) -> WorkflowType:
        semantic = self._semantic_metadata
        if semantic is None:
            return "unknown"

        w_type: WorkflowTypeInfo = semantic.infer_workflow_type(self._input_assets)
        return w_type["workflow_type"]

    @cached_property
    def all_prompts(self) -> None | list[PromptUsed]:
        semantic = self._semantic_metadata
        if semantic is None:
            return None
        return semantic.all_prompts()

    @cached_property
    def positive_prompt(self) -> str | None:
        positive, _ = self._primary_prompts
        return positive

    @cached_property
    def negative_prompt(self) -> str | None:
        _, negative = self._primary_prompts
        return negative

    @cached_property
    def input_assets(self) -> list[InputFile]:
        return [
            InputFile(asset, index) for index, asset in enumerate(self._input_assets)
        ]

    @cached_property
    def seed(self) -> int | None:
        return self._sampling["seed"]

    @cached_property
    def sampler(self) -> str | None:
        return self._sampling["sampler"]

    @cached_property
    def scheduler(self) -> str | None:
        return self._sampling["scheduler"]

    @cached_property
    def steps(self) -> int | None:
        return self._sampling["steps"]

    @cached_property
    def cfg(self) -> float | int | None:
        return self._sampling["cfg"]

    @cached_property
    def requested_width(self) -> int | None:
        return self._requested_dimensions["requested_width"]

    @cached_property
    def requested_height(self) -> int | None:
        return self._requested_dimensions["requested_height"]

    @cached_property
    def frame_count(self) -> int | None:
        return self._frame_count["frame_count"]

    @cached_property
    def output_width(self) -> int | None:
        return self.parsed["media_probe"].get("width")

    @cached_property
    def output_height(self) -> int | None:
        return self.parsed["media_probe"].get("height")

    @cached_property
    def fps(self) -> float | int | None:
        return self.parsed["media_probe"].get("fps")

    @cached_property
    def duration_seconds(self) -> float | None:
        return self.parsed["media_probe"].get("duration_seconds")

    @cached_property
    def models(self) -> list[ModelUsedInfo]:
        semantic = self._semantic_metadata
        if semantic is None:
            return []

        return semantic.models()

    @property
    def primary_model_name(self) -> str | None:
        model = self.primary_model
        return model.get("name") if model else None

    @cached_property
    def primary_model(self) -> ModelUsedInfo | None:
        semantic = self._semantic_metadata
        if semantic is None:
            return None

        return semantic.primary_model(
            self.models,
            self._primary_sampler_id,
        )

    #######################################################################
    #### utils

    @property
    def is_output(self) -> bool:
        return self.parsed.get("prompt") is not None

    def get_warnings(self) -> Warnings:
        warnings = list(self.parsed.get("warnings") or [])
        if self._semantic_metadata:
            warnings.extend(self._semantic_metadata.warnings)
        return warnings

    def to_schema(self) -> ExtractedSchema:
        return {
            "workflow_name": self.workflow_name,
            "workflow_id": self.workflow_id,
            "workflow_type": self.workflow_type,
            "prompt": self.positive_prompt,
            "negative_prompt": self.negative_prompt,
            "all_prompts": self.all_prompts or [],
            "mime_type": self.mime_type,
            "requested_width": self.requested_width,
            "requested_height": self.requested_height,
            "output_width": self.output_width,
            "output_height": self.output_height,
            "fps": self.fps,
            "frame_count": self.frame_count,
            "duration_seconds": self.duration_seconds,
            "seed": self.seed,
            "sampler": self.sampler,
            "scheduler": self.scheduler,
            "steps": self.steps,
            "cfg": self.cfg,
            "input_assets": self.input_assets,
            "primary_model": self.primary_model,
            "models": self.models,
            "_raw": self.raw.get("metadata"),
        }

    def to_schema_debug(self) -> ExtractedSchemaDebug:
        semantic = self._semantic_metadata

        workflow_name_source: str | None = None
        output_media_type: str | None = None
        output_nodes: list[tuple[str, str]] = []
        live_node_count = 0
        total_node_count = 0
        schema: ExtractedSchema = self.to_schema()
        w_type: WorkflowTypeInfo | None = None

        if semantic is not None:
            _, _, workflow_name_source = self._workflow

            output_media_type = semantic.output_media_type
            output_nodes = semantic.output_nodes
            live_node_count = len(semantic.live_ids)
            total_node_count = len(semantic.ev.nodes)
            w_type = semantic.infer_workflow_type(self._input_assets)

        return {
            **schema,
            "_debug": {
                "source_file": self.parsed["source_file"],
                "output_media_type": output_media_type,
                "output_nodes": output_nodes,
                "primary_sampler_node": self._primary_sampler_id,
                "workflow_type_basis": w_type["basis"] if w_type is not None else None,
                "workflow_name_source": workflow_name_source,
                "requested_dims_source": self._requested_dimensions["source"],
                "frame_count_source": self._frame_count["source"],
                "has_audio_track_in_output_file": (
                    self.parsed["media_probe"].get("has_audio")
                ),
                "live_node_count": live_node_count,
                "total_node_count": total_node_count,
                "warnings": self.get_warnings(),
            },
        }

    #######################################################################
    #### private helpers

    @cached_property
    def _workflow(self) -> tuple[str | None, str | None, str | None]:
        if self._semantic_metadata is None:
            return None, None, None

        return self._semantic_metadata.workflow_name_and_id()

    @cached_property
    def _primary_prompts(self) -> tuple[str | None, str | None]:
        semantic = self._semantic_metadata
        all_prompts = self.all_prompts
        if semantic is None or all_prompts is None:
            return None, None
        return semantic.positive_negative(all_prompts)

    @cached_property
    def _input_assets(self) -> list[InputAssetInfo]:
        semantic = self._semantic_metadata
        if semantic is None:
            return []
        return semantic.input_assets()

    @cached_property
    def _primary_sampler_id(self) -> str | None:
        semantic = self._semantic_metadata
        if semantic is None:
            return None

        return semantic.primary_sampler_id()

    @cached_property
    def _sampling(self) -> SamplingParams:
        semantic = self._semantic_metadata
        if semantic is None:
            return {
                "seed": None,
                "sampler": None,
                "scheduler": None,
                "steps": None,
                "cfg": None,
            }

        return semantic.sampling_params(
            self._primary_sampler_id,
        )

    @cached_property
    def _requested_dimensions(self) -> RequestedDimensions:
        semantic = self._semantic_metadata
        if semantic is None:
            return {
                "requested_width": None,
                "requested_height": None,
                "source": "unknown",
            }

        return semantic.requested_dimensions(
            self._primary_sampler_id,
        )

    @cached_property
    def _frame_count(self) -> FrameCountInfo:
        semantic = self._semantic_metadata
        if semantic is None:
            return {
                "frame_count": None,
                "source": None,
            }

        return semantic.frame_count()
