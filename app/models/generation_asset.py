from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy import Text
from sqlalchemy import UniqueConstraint

from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from app.db.base import Base


class GenerationAsset(Base):
    __tablename__ = "generation_asset"

    __table_args__ = (
        UniqueConstraint(
            "generation_id",
            "asset_id",
            name="uq_generation_asset"
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    generation_id: Mapped[int] = mapped_column(
        ForeignKey(
            "generation.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    asset_id: Mapped[int] = mapped_column(
        ForeignKey(
            "asset.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    role: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    generation = relationship(
        "Generation",
        back_populates="generation_assets",
        lazy="selectin"
    )

    asset = relationship(
        "Asset",
        back_populates="generation_assets",
        lazy="selectin"
    )