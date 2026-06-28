from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.clip import Clip
    from app.models.generation import Generation
    from app.models.project import Project
    from app.models.scene import Scene


class Shot(Base):
    __tablename__ = "shot"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        init=False,
    )

    project_id: Mapped[int] = mapped_column(
        ForeignKey("project.id"),
        nullable=False,
    )

    scene_id: Mapped[int] = mapped_column(
        ForeignKey("scene.id"),
        nullable=False,
    )

    clip_id: Mapped[int] = mapped_column(
        ForeignKey("clip.id"),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    number: Mapped[int | None] = mapped_column(
        Integer,
        default=None,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        default=None,
    )

    comments: Mapped[str | None] = mapped_column(
        Text,
        default=None,
    )

    added_on: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default=text("(CAST(strftime('%s','now') AS INTEGER))"),
        init=False,
    )

    project: Mapped[Project] = relationship(
        "Project",
        back_populates="shots",
        lazy="selectin",
        init=False,
    )

    scene: Mapped[Scene] = relationship(
        "Scene",
        back_populates="shots",
        lazy="selectin",
        init=False,
    )

    clip: Mapped[Clip] = relationship(
        "Clip",
        back_populates="shots",
        lazy="selectin",
        init=False,
    )

    generations: Mapped[list[Generation]] = relationship(
        "Generation",
        back_populates="shot",
        lazy="selectin",
        init=False,
    )
