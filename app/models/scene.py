from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.clip import Clip
    from app.models.project import Project
    from app.models.shot import Shot


class Scene(Base):
    __tablename__ = "scene"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        init=False,
    )

    project_id: Mapped[int] = mapped_column(
        ForeignKey("project.id", ondelete="CASCADE"), nullable=False
    )

    name: Mapped[str] = mapped_column(Text, nullable=False)

    number: Mapped[int | None] = mapped_column(
        Integer,
        default=False,
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
        back_populates="scenes",
        lazy="selectin",
        init=False,
    )

    clips: Mapped[list[Clip]] = relationship(
        "Clip",
        back_populates="scene",
        lazy="selectin",
        init=False,
    )

    shots: Mapped[list[Shot]] = relationship(
        "Shot",
        back_populates="scene",
        lazy="selectin",
        init=False,
    )
