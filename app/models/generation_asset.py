from __future__ import annotations

from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import (
    Enum,
    ForeignKey,
    Integer,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from .asset import Asset
    from .generation import Generation


class AssocType(StrEnum):
    INPUT = "input"
    OUTPUT = "output"


class GenerationAsset(Base):
    __tablename__ = "generation_asset"

    __table_args__ = (
        UniqueConstraint(
            "generation_id",
            "asset_id",
            "role",
            name="uq_generation_asset",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        init=False,
    )

    generation_id: Mapped[int] = mapped_column(
        ForeignKey(
            "generation.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    asset_id: Mapped[int] = mapped_column(
        ForeignKey(
            "asset.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    assoc_type: Mapped[AssocType] = mapped_column(
        Enum(AssocType),
        nullable=False,
    )

    role: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    generation: Mapped[Generation] = relationship(
        "Generation",
        back_populates="generation_assets",
        lazy="selectin",
        init=False,
    )

    asset: Mapped[Asset] = relationship(
        "Asset",
        back_populates="generation_assets",
        lazy="selectin",
        init=False,
    )
