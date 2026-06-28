import json
from functools import cached_property
from os import stat_result
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.models.generation_asset import AssocType, GenerationAsset
from app.schemas.types.metadata import ExifDump, InputAssetInfo, MediaProbe
from app.services.file.archive import archive_media_file
from app.services.file.hash import sha256_file
from app.services.file.mime_type import get_mime_type
from app.services.file.paths import comfyui_input_file_path, get_archive_file_name
from app.services.metadata.exif_source import extract_media_probe, inspect_file


class InputFile:
    def __init__(
        self,
        file_info: InputAssetInfo,
        key: int,
    ):
        self._file_info = file_info
        self.key = key
        self.node_id: str = file_info["node_id"]
        self.class_type: str | None = file_info["class_type"]
        self.title: str | None = file_info["title"]
        self.role: str = file_info["role"]
        self.value: str | None = file_info["value"]
        self.asset: Asset | None = None
        self.is_existing_asset: bool = False
        self.archive_destination_path: Path | None = None

    def verify(self):
        _ = self.raw_metadata

    def get_asset(self, db: Session) -> Asset:
        """
        Return the Asset instance corresponding to this input file.

        The method is idempotent and always returns the same in-memory
        Asset instance.

        If an Asset with the same file hash already exists in the
        database, that Asset is returned and marked as reused via
        ``self.is_existing_asset``.

        Otherwise, a new in-memory Asset instance is created and cached.

        The returned Asset is not automatically persisted. The caller is
        responsible for adding newly created Asset instances to a database
        session and managing the transaction.
        """
        if self.asset is not None:
            return self.asset

        f_hash: str = self.file_hash
        existing = db.scalar(select(Asset).where(Asset.file_hash == f_hash))

        if existing is not None:
            self.asset = existing
            self.is_existing_asset = True
            return existing

        self.asset = Asset(
            file_name=self.file_name,
            file_hash=self.file_hash,
            file_timestamp=self.file_timestamp,
            archive_file_name=None,
            mime_type=self.mime_type,
            file_size=self.file_size,
            width=self.width,
            height=self.height,
            fps=self.fps,
            duration_seconds=self.duration_seconds,
            metadata_json=self.raw_metadata,
        )
        self.is_existing_asset = False
        return self.asset

    def archive(self):
        if self.asset is None or self.asset.id is None:
            raise RuntimeError(
                "Input asset must be persisted to DB before "
                f"calling archive(): {self.file_name}"
            )

        if self.is_existing_asset:
            self.archive_destination_path = None
            return

        archive_file_name = get_archive_file_name(
            orig_file_name=self.file_name,
            asset_id=self.asset.id,
        )

        self.archive_destination_path = archive_media_file(
            self.file_path,
            archive_file_name,
        )
        return archive_file_name

    def link_to_generation(self, generation_id: int) -> GenerationAsset | None:
        if self.asset is None or self.asset.id is None:
            raise RuntimeError(
                "Input asset must be persisted to DB before "
                f"linking to generation: {self.file_name}"
            )
        return GenerationAsset(
            generation_id=generation_id,
            asset_id=self.asset.id,
            role=self.role,
            assoc_type=AssocType.INPUT,
        )

    def rollback_archive(self):
        if self.is_existing_asset:
            return

        if self.archive_destination_path is None:
            return

        self.archive_destination_path.unlink(missing_ok=True)
        self.archive_destination_path = None

    @cached_property
    def raw_metadata(self) -> ExifDump:
        return inspect_file(self.file_path)

    @property
    def file_name(self) -> str:
        if self.value is None:
            raise ValueError(f"file_name not found in file_info: {self._file_info}")
        return self.value

    @property
    def file_path(self) -> Path:
        path = comfyui_input_file_path(self.file_name)
        if not path.is_file():
            raise FileNotFoundError(f"Input File not found: {path}")
        return path

    @cached_property
    def file_hash(self) -> str:
        return sha256_file(self.file_path)

    @property
    def file_timestamp(self) -> int:
        return int(self._file_stat.st_mtime)

    @property
    def file_size(self) -> int:
        return self._file_stat.st_size

    @property
    def mime_type(self) -> str | None:
        return get_mime_type(self.raw_metadata["metadata"], self.file_path)

    @property
    def width(self) -> int | None:
        return self._media_probe["width"]

    @property
    def height(self) -> int | None:
        return self._media_probe["height"]

    @property
    def fps(self) -> float | int | None:
        return self._media_probe["fps"]

    @property
    def duration_seconds(self) -> float | None:
        return self._media_probe["duration_seconds"]

    @cached_property
    def metadata_json(self) -> str:
        return json.dumps(self.raw_metadata["metadata"])

    ##########################################
    @cached_property
    def _file_stat(self) -> stat_result:
        return self.file_path.stat()

    @cached_property
    def _media_probe(self) -> MediaProbe:
        return extract_media_probe(self.raw_metadata["metadata"])
