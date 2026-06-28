"""
semantic_protocol.py

Protocol definition for SemanticExtractor containing all public method
signatures (no implementation), preserving type hints, and excluding
private methods.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Protocol

if TYPE_CHECKING:
    from app.schemas.types.metadata import (
        FrameCountInfo,
        InputAssetInfo,
        ModelUsedInfo,
        PromptUsed,
        RequestedDimensions,
        SamplingParams,
        WorkflowTypeInfo,
    )


class SemanticExtractorProtocol(Protocol):
    def workflow_name_and_id(self) -> tuple[str | None, str | None, str | None]: ...

    def primary_sampler_id(self) -> str | None: ...

    def sampling_params(
        self,
        sampler_id: str | None,
    ) -> SamplingParams: ...

    def requested_dimensions(
        self,
        sampler_id: str | None,
    ) -> RequestedDimensions: ...

    def frame_count(self) -> FrameCountInfo: ...

    def all_prompts(self) -> list[PromptUsed]: ...

    def positive_negative(
        self,
        prompts: list[PromptUsed],
    ) -> tuple[str | None, str | None]: ...

    def input_assets(self) -> list[InputAssetInfo]: ...

    def models(self) -> list[ModelUsedInfo]: ...

    def primary_model(
        self,
        models: list[ModelUsedInfo],
        sampler_id: str | None = None,
    ) -> ModelUsedInfo | None: ...

    def infer_workflow_type(self, assets: list[InputAssetInfo]) -> WorkflowTypeInfo: ...
