from sqlalchemy import Integer
from sqlalchemy import Float
from sqlalchemy import Text
from sqlalchemy import text

from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from app.db.base import Base


class Asset(Base):
    __tablename__ = "asset"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    file_name: Mapped[str | None] = mapped_column(
        Text
    )

    file_path: Mapped[str | None] = mapped_column(
        Text
    )

    file_hash: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        unique=True
    )

    archive_file_name: Mapped[str | None] = mapped_column(
        Text
    )

    file_timestamp: Mapped[int | None] = mapped_column(
        Integer
    )

    mime_type: Mapped[str | None] = mapped_column(
        Text
    )

    file_size: Mapped[int | None] = mapped_column(
        Integer
    )

    width: Mapped[int | None] = mapped_column(
        Integer
    )

    height: Mapped[int | None] = mapped_column(
        Integer
    )

    fps: Mapped[int | None] = mapped_column(
        Integer
    )

    duration_seconds: Mapped[float | None] = mapped_column(
        Float
    )

    description: Mapped[str | None] = mapped_column(
        Text
    )

    metadata_json: Mapped[str | None] = mapped_column(
        Text
    )

    added_on: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default=text(
            "(CAST(strftime('%s','now') AS INTEGER))"
        )
    )

    generation_assets = relationship(
        "GenerationAsset",
        back_populates="asset",
        lazy="selectin",
        cascade="all, delete-orphan"
    )