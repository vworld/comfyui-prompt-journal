from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Integer, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.generation import Generation
    from app.models.scene import Scene
    from app.models.shot import Shot


class Project(Base):
    __tablename__ = "project"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        init=False,
    )

    name: Mapped[str] = mapped_column(Text, nullable=False)

    project_type: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        default=None,
    )

    added_on: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default=text("(CAST(strftime('%s','now') AS INTEGER))"),
        init=False,
    )

    scenes: Mapped[list[Scene]] = relationship(
        "Scene",
        back_populates="project",
        lazy="selectin",
        init=False,
    )

    generations: Mapped[list[Generation]] = relationship(
        "Generation",
        back_populates="project",
        lazy="selectin",
        init=False,
    )

    shots: Mapped[list[Shot]] = relationship(
        "Shot",
        back_populates="project",
        lazy="selectin",
        init=False,
    )
