from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy import Float
from sqlalchemy import Text
from sqlalchemy import Boolean
from sqlalchemy import text

from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from app.db.base import Base


class Generation(Base):
    __tablename__ = "generation"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    project_id: Mapped[int] = mapped_column(
        ForeignKey("project.id"),
        nullable=False
    )

    shot_id: Mapped[int | None] = mapped_column(
        ForeignKey("shot.id")
    )

    # Workflow

    workflow_name: Mapped[str | None] = mapped_column(
        Text
    )

    workflow_id: Mapped[str | None] = mapped_column(
        Text
    )

    workflow_type: Mapped[str | None] = mapped_column(
        Text
    )

    generation_time_seconds: Mapped[float | None] = mapped_column(
        Float
    )

    seed: Mapped[int | None] = mapped_column(
        Integer
    )

    # Extracted Generation Metadata

    requested_width: Mapped[int | None] = mapped_column(
        Integer
    )

    requested_height: Mapped[int | None] = mapped_column(
        Integer
    )

    output_width: Mapped[int | None] = mapped_column(
        Integer
    )

    output_height: Mapped[int | None] = mapped_column(
        Integer
    )

    fps: Mapped[int | None] = mapped_column(
        Integer
    )

    frame_count: Mapped[int | None] = mapped_column(
        Integer
    )

    duration_seconds: Mapped[float | None] = mapped_column(
        Float
    )

    sampler: Mapped[str | None] = mapped_column(
        Text
    )

    scheduler: Mapped[str | None] = mapped_column(
        Text
    )

    steps: Mapped[int | None] = mapped_column(
        Integer
    )

    cfg: Mapped[float | None] = mapped_column(
        Float
    )

    primary_model_name: Mapped[str | None] = mapped_column(
        Text
    )

    models_json: Mapped[str | None] = mapped_column(
        Text
    )

    prompt: Mapped[str | None] = mapped_column(
        Text
    )

    negative_prompt: Mapped[str | None] = mapped_column(
        Text
    )

    all_prompts_json: Mapped[str | None] = mapped_column(
        Text
    )

    input_files_count: Mapped[int | None] = mapped_column(
        Integer
    )

    # Human Review

    raw_intent: Mapped[str | None] = mapped_column(
        Text
    )

    raw_review: Mapped[str | None] = mapped_column(
        Text
    )

    cleaned_intent: Mapped[str | None] = mapped_column(
        Text
    )

    cleaned_review: Mapped[str | None] = mapped_column(
        Text
    )

    failure_description: Mapped[str | None] = mapped_column(
        Text
    )

    suspected_causes: Mapped[str | None] = mapped_column(
        Text
    )

    correction_strategy: Mapped[str | None] = mapped_column(
        Text
    )

    # Status

    accepted: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("0")
    )

    added_on: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default=text(
            "(CAST(strftime('%s','now') AS INTEGER))"
        )
    )

    project = relationship(
        "Project",
        back_populates="generations",
        lazy="selectin"
    )

    shot = relationship(
        "Shot",
        back_populates="generations",
        lazy="selectin"
    )

    generation_assets = relationship(
        "GenerationAsset",
        back_populates="generation",
        lazy="selectin",
        cascade="all, delete-orphan"
    )