from __future__ import annotations

from typing import TYPE_CHECKING, Any, Literal, NotRequired, TypeAlias, TypedDict

if TYPE_CHECKING:
    from app.services.file.input_file import InputFile

JSONDict: TypeAlias = dict[str, Any]
Warnings: TypeAlias = list[str]


class ExifDump(TypedDict):
    file: str
    metadata: dict[str, Any]


class MediaProbe(TypedDict):
    width: int | None
    height: int | None
    fps: float | int | None
    duration_seconds: float | None
    has_audio: bool
    audio_format: str | None
    audio_channels: int | None
    audio_sample_rate: int | None
    file_type: str | None
    mime_type: str | None


class ParseResult(TypedDict):
    source_file: str | None
    prompt: JSONDict | None
    workflow: JSONDict | None
    media_probe: MediaProbe
    warnings: Warnings


class SamplingParams(TypedDict):
    seed: int | None
    sampler: str | None
    scheduler: str | None
    steps: int | None
    cfg: float | int | None


class RequestedDimensions(TypedDict):
    requested_width: int | None
    requested_height: int | None
    source: str


class FrameCountInfo(TypedDict):
    frame_count: int | None
    source: str | None


class PromptUsed(TypedDict):
    node_id: str
    title: str | None
    role: str
    text: str | None


class InputAssetInfo(TypedDict):
    node_id: str
    class_type: str | None
    title: str | None
    role: str
    value: str | None


class InputAssetInfoWithMimeType(InputAssetInfo):
    mime_type: str | None


class ModelUsedInfo(TypedDict):
    node_id: str
    class_type: str | None
    title: str | None
    role: str
    name: str | None

    strength_model: NotRequired[float | int]
    strength_clip: NotRequired[float | int]
    strength: NotRequired[float | int]


class StrengthInfo(TypedDict, total=False):
    strength_model: float | int
    strength_clip: float | int
    strength: float | int


WorkflowType = Literal[
    "text-to-image",
    "multi-ref-image",
    "image-to-image",
    "video-to-video",
    "multi-ref-image-to-video",
    "image-and-audio-to-video",
    "image-to-video",
    "audio-to-video",
    "text-to-video",
    "text-to-audio",
    "conditioned-audio",
    "unknown",
]


OutputFileRole = Literal[
    "output_asset",
    "output_video",
    "output_image",
]

InputFileRole = Literal[
    "first_frame",
    "last_frame",
    "reference_image",
    "depth_map",
    "control_image",
    "mask",
    "audio",
    "video",
    "input_image",
    "other",
]


class WorkflowTypeBasis(TypedDict):
    output_media_type: str | None
    image_input_count: int
    has_audio_input: bool
    has_video_input: bool


class WorkflowTypeInfo(TypedDict):
    workflow_type: WorkflowType
    basis: WorkflowTypeBasis


## ----------------


class ExtractionDebug(TypedDict):
    source_file: str | None
    output_media_type: str | None
    output_nodes: list[tuple[str, str]] | None
    primary_sampler_node: str | None
    workflow_type_basis: WorkflowTypeBasis | None
    workflow_name_source: str | None
    requested_dims_source: str | None
    frame_count_source: str | None
    has_audio_track_in_output_file: bool | None
    live_node_count: int | None
    total_node_count: int | None
    warnings: Warnings
    media_probe: NotRequired[MediaProbe]


class ExtractedSchema(TypedDict):
    workflow_name: str | None
    workflow_id: str | None
    workflow_type: WorkflowType

    prompt: str | None
    negative_prompt: str | None
    all_prompts: list[PromptUsed]

    mime_type: str | None

    requested_width: int | None
    requested_height: int | None

    output_width: int | None
    output_height: int | None

    fps: float | int | None
    frame_count: int | None
    duration_seconds: float | None

    seed: int | None
    sampler: str | None
    scheduler: str | None
    steps: int | None
    cfg: float | int | None

    input_assets: list[InputFile]
    primary_model: ModelUsedInfo | None
    models: list[ModelUsedInfo]

    _raw: JSONDict | None


class ExtractedSchemaDebug(ExtractedSchema):
    _debug: ExtractionDebug


class ExtractionError(TypedDict):
    source_file: str | None
    error: str
    _debug: dict[str, Any]
    _raw: JSONDict | None
