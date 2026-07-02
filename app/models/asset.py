from __future__ import annotations

from pathlib import Path

from sqlalchemy import JSON, BigInteger, Float, Integer, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.generation_asset import GenerationAsset  # noqa: TC001
from app.schemas.types.metadata import ExifDump  # noqa: TC001
from app.services.file.paths import media_archive_dir


class Asset(Base):
    __tablename__ = "asset"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        init=False,
    )

    file_name: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    file_hash: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        unique=True,
    )
    orig_file_path: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    archive_file_name: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    file_timestamp: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
    )

    mime_type: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    file_size: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    width: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    height: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    fps: Mapped[float | int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    duration_seconds: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    metadata_json: Mapped[ExifDump] = mapped_column(
        JSON,
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        default=None,
    )

    added_on: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default=text("(CAST(strftime('%s','now') AS INTEGER))"),
        init=False,
    )

    generation_assets: Mapped[list[GenerationAsset]] = relationship(
        "GenerationAsset",
        back_populates="asset",
        lazy="selectin",
        cascade="all, delete-orphan",
        init=False,
    )

    @property
    def archive_file_path(self) -> Path:
        if not self.archive_file_name:
            raise ValueError("archive_file_name is not set")
        return media_archive_dir() / self.archive_file_name