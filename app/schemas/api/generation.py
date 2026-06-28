from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)

from app.schemas.api.generation_asset import GenerationAssetResponse
from app.schemas.api.shot import ShotHierarchicalResponse
from app.schemas.types.metadata import ModelUsedInfo, PromptUsed


class GenerationSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(
        description="Unique identifier for the generation",
    )

    project_id: int | None = Field(
        None,
        description="ID of the associated project",
    )
    shot_id: int | None = Field(
        None,
        description="ID of the associated shot",
    )

    # Workflow
    workflow_name: str | None = Field(
        None,
        description="Name of the workflow",
    )
    workflow_id: str | None = Field(
        None,
        description="ID of the workflow",
    )
    workflow_type: str | None = Field(
        None,
        description="Type of the workflow",
    )
    generation_time_seconds: float | None = Field(
        None,
        description="Time taken to generate in seconds",
    )
    seed: int | None = Field(
        None,
        description="Random seed used for generation",
    )

    # Extracted Generation Metadata
    requested_width: int | None = Field(
        None,
        description="Requested width of the output",
    )
    requested_height: int | None = Field(
        None,
        description="Requested height of the output",
    )
    output_width: int | None = Field(
        None,
        description="Actual width of the output",
    )
    output_height: int | None = Field(
        None,
        description="Actual height of the output",
    )
    fps: int | float | None = Field(
        None,
        description="Frames per second",
    )
    frame_count: int | None = Field(
        None,
        description="Number of frames",
    )
    duration_seconds: float | None = Field(
        None,
        description="Duration in seconds",
    )
    sampler: str | None = Field(
        None,
        description="Sampler used for generation",
    )
    scheduler: str | None = Field(
        None,
        description="Scheduler used for generation",
    )
    steps: int | None = Field(
        None,
        description="Number of steps",
    )
    cfg: float | None = Field(
        None,
        description="Classifier-free guidance scale",
    )
    primary_model_name: str | None = Field(
        None,
        description="Name of the primary model used",
    )
    models_json: list[ModelUsedInfo] | None = Field(
        None,
        description="JSON list of models used",
    )
    prompt: str | None = Field(
        None,
        description="Prompt used for generation",
    )
    negative_prompt: str | None = Field(
        None,
        description="Negative prompt used",
    )
    all_prompts_json: list[PromptUsed] | None = Field(
        None,
        description="JSON list of all prompts used",
    )
    input_files_count: int | None = Field(
        None,
        description="Number of input files",
    )

    # Human Review
    raw_intent: str | None = Field(
        None,
        description="Raw intent from human review",
    )
    raw_review: str | None = Field(
        None,
        description="Raw review from human review",
    )
    cleaned_intent: str | None = Field(
        None,
        description="Cleaned intent from human review",
    )
    cleaned_review: str | None = Field(
        None,
        description="Cleaned review from human review",
    )
    failure_description: str | None = Field(
        None,
        description="Description of failure",
    )
    suspected_causes: str | None = Field(
        None,
        description="Suspected causes of failure",
    )
    correction_strategy: str | None = Field(
        None,
        description="Correction strategy applied",
    )

    # Status
    accepted: bool = Field(
        False,
        description="Whether the generation was accepted",
    )

    added_on: int = Field(
        ...,
        description="Timestamp when the generation was added",
    )


class GenerationDetailResponse(GenerationSummaryResponse):
    model_config = ConfigDict(from_attributes=True)

    shot: ShotHierarchicalResponse | None = Field(
        None,
        description="Generation project hierarchy",
    )
    generation_assets: list[GenerationAssetResponse] = Field(
        description="All assets used in this generation",
    )


class GenerationManualReviewUpdateRequest(BaseModel):
    shot_id: int
    raw_intent: str | None = None
    raw_review: str | None = None
    accepted: bool | None = None


class GenerationEnrichedReviewUpdateRequest(GenerationManualReviewUpdateRequest):
    cleaned_intent: str | None = None
    cleaned_review: str | None = None

    failure_description: str | None = None
    suspected_causes: str | None = None
    correction_strategy: str | None = None


class CopyLLMContext:
    generation_id: int
    output_file_name: str
    workflow_name: str
    workflow_type: str
    all_prompts: list[PromptUsed]
    duration_seconds: int | None
    fps: float | int | None
    input_file_names: list[str]
    raw_intent: str
    raw_review: str
    