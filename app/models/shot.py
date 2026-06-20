from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy import Text
from sqlalchemy import text

from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from app.db.base import Base


class Shot(Base):
    __tablename__ = "shot"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    project_id: Mapped[int] = mapped_column(
        ForeignKey("project.id"),
        nullable=False
    )

    scene_id: Mapped[int] = mapped_column(
        ForeignKey("scene.id"),
        nullable=False
    )

    clip_id: Mapped[int] = mapped_column(
        ForeignKey("clip.id"),
        nullable=False
    )

    number: Mapped[int | None] = mapped_column(
        Integer
    )

    name: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        Text
    )

    comments: Mapped[str | None] = mapped_column(
        Text
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
        back_populates="shots",
        lazy="selectin"
    )

    scene = relationship(
        "Scene",
        back_populates="shots",
        lazy="selectin"
    )

    clip = relationship(
        "Clip",
        back_populates="shots",
        lazy="selectin"
    )

    generations = relationship(
        "Generation",
        back_populates="shot",
        lazy="selectin"
    )