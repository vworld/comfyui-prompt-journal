from pydantic import BaseModel, ConfigDict, Field


class PromptResponse(BaseModel):
    node_id: str
    title: str | None = None
    role: str
    text: str | None = None


class InputAssetResponse(BaseModel):
    key: int
    node_id: str
    class_type: str | None = None
    title: str | None = None
    role: str
    value: str | None = None
    mime_type: str | None = None


class WorkflowModelResponse(BaseModel):
    node_id: str
    class_type: str | None
    title: str | None = None
    role: str
    name: str | None = None
    strength_model: float | None = None
    strength_clip: float | None = None
    strength: float | None = None


class StagedGenerationResponseBase(BaseModel):
    workflow_name: str | None = None
    workflow_id: str | None = None
    workflow_type: str | None = None
    prompt: str | None = None
    negative_prompt: str | None = None
    mime_type: str | None
    all_prompts: list[PromptResponse] = Field(default_factory=list)
    requested_width: int | None = None
    requested_height: int | None = None
    output_width: int | None = None
    output_height: int | None = None
    fps: float | None = None
    frame_count: int | None = None
    duration_seconds: float | None = None
    seed: int | None = None
    sampler: str | None = None
    scheduler: str | None = None
    steps: int | None = None
    cfg: float | int | None = None
    input_assets: list[InputAssetResponse] = Field(default_factory=list)
    primary_model: WorkflowModelResponse | None = None
    models: list[WorkflowModelResponse] = Field(default_factory=list)


class StagedGenerationResponse(StagedGenerationResponseBase):
    upload_id: int


class StagedFilesResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int

    file_name: str
    file_path: str
    file_hash: str

    uploaded_on: int
