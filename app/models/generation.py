from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import JSON, Boolean, Float, ForeignKey, Integer, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.schemas.types.metadata import ModelUsedInfo, PromptUsed  # noqa: TC001

if TYPE_CHECKING:
    from app.models.generation_asset import GenerationAsset
    from app.models.project import Project
    from app.models.shot import Shot


class Generation(Base):
    __tablename__ = "generation"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        init=False,
    )

    project_id: Mapped[int | None] = mapped_column(
        ForeignKey("project.id"),
        nullable=True,
        init=False,
    )

    shot_id: Mapped[int | None] = mapped_column(
        ForeignKey("shot.id"),
        nullable=True,
        init=False,
    )

    attempt_num: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    # Workflow

    workflow_name: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    workflow_id: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    workflow_type: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    generation_time_seconds: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )
    seed: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    # Extracted Generation Metadata

    requested_width: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    requested_height: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    output_width: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    output_height: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    fps: Mapped[int | float | None] = mapped_column(
        Float,
        nullable=True,
    )
    frame_count: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    duration_seconds: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )
    sampler: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    scheduler: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    steps: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    cfg: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )
    primary_model_name: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    models_json: Mapped[list[ModelUsedInfo] | None] = mapped_column(
        JSON,
        nullable=True,
    )
    prompt: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    negative_prompt: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    all_prompts_json: Mapped[list[PromptUsed] | None] = mapped_column(
        JSON,
        nullable=True,
    )
    input_files_count: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    # Human Review

    raw_intent: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        default=None,
    )
    raw_review: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        default=None,
    )
    cleaned_intent: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        default=None,
    )
    cleaned_review: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        default=None,
    )
    failure_description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        default=None,
    )
    suspected_causes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        default=None,
    )
    correction_strategy: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        default=None,
    )

    # Status

    accepted: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("0"),
        default=False,
    )

    added_on: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default=text("(CAST(strftime('%s','now') AS INTEGER))"),
        init=False,
    )

    project: Mapped[Project] = relationship(
        "Project",
        back_populates="generations",
        lazy="selectin",
        init=False,
    )

    shot: Mapped[Shot] = relationship(
        "Shot",
        back_populates="generations",
        lazy="selectin",
        init=False,
    )

    generation_assets: Mapped[list[GenerationAsset]] = relationship(
        "GenerationAsset",
        back_populates="generation",
        lazy="selectin",
        cascade="all, delete-orphan",
        init=False,
    )
