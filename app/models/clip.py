from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, Text, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.scene import Scene
    from app.models.shot import Shot


class Clip(Base):
    __tablename__ = "clip"

    __table_args__ = (
        UniqueConstraint(
            "scene_id",
            "name",
            name="uq_clip_scene_id_name",
        ),
        UniqueConstraint(
            "scene_id",
            "number",
            name="uq_clip_scene_id_number",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, init=False)

    scene_id: Mapped[int] = mapped_column(
        ForeignKey("scene.id", ondelete="CASCADE"), nullable=False
    )

    number: Mapped[int | None] = mapped_column(Integer)

    name: Mapped[str] = mapped_column(
        Text(collation="NOCASE"),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(Text)

    comments: Mapped[str | None] = mapped_column(Text)

    added_on: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default=text("(CAST(strftime('%s','now') AS INTEGER))"),
        init=False,
    )

    scene: Mapped[Scene] = relationship(
        "Scene",
        back_populates="clips",
        lazy="selectin",
        init=False,
    )

    shots: Mapped[list[Shot]] = relationship(
        "Shot",
        back_populates="clip",
        lazy="selectin",
        init=False,
    )
