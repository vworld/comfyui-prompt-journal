from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy import Text
from sqlalchemy import text

from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from app.db.base import Base


class Scene(Base):
    __tablename__ = "scene"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    project_id: Mapped[int] = mapped_column(
        ForeignKey("project.id", ondelete="CASCADE"),
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
        back_populates="scenes",
        lazy="selectin"
    )

    clips = relationship(
        "Clip",
        back_populates="scene",
        lazy="selectin"
    )

    shots = relationship(
        "Shot",
        back_populates="scene",
        lazy="selectin"
    )