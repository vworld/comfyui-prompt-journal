from sqlalchemy import Integer
from sqlalchemy import Text
from sqlalchemy import text

from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from app.db.base import Base


class Project(Base):
    __tablename__ = "project"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    name: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    project_type: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        Text
    )

    added_on: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default=text(
            "(CAST(strftime('%s','now') AS INTEGER))"
        )
    )

    scenes = relationship(
        "Scene",
        back_populates="project",
        lazy="selectin"
    )

    generations = relationship(
        "Generation",
        back_populates="project",
        lazy="selectin"
    )

    shots = relationship(
        "Shot",
        back_populates="project",
        lazy="selectin"
    )