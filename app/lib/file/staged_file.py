import time
from functools import cached_property
from os import stat_result
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.lib.file.archive import archive_media_file
from app.lib.file.file_metadata import FileMetadata
from app.lib.file.hash import sha256_file
from app.lib.file.paths import get_archive_file_name
from app.models.asset import Asset
from app.models.generation import Generation
from app.models.generation_asset import AssocType, GenerationAsset


class StagedFile:
    def __init__(
        self,
        db: Session,
        path: Path,
        file_last_modified: int,
        file_orig_name: str,
    ) -> None:
        self.db: Session = db
        self.path: Path = path
        self.file_last_modified: int = file_last_modified
        self.file_orig_name: str = file_orig_name
        self.asset: Asset | None = None
        self.generation: Generation | None = None
        self.archive_destination_path: Path | None = None

    def verify(self):
        """
        Verify that this staged file can be safely imported into the
        journal database.

        The method raises an exception if the uploaded file cannot be
        imported.

        Guarantees on successful return:

        - The output file is not already present in the archive (duplicate).
        - The uploaded file exists and is readable.
        - Exif metadata has been successfully extracted from the file.
        - The file contains a valid ComfyUI prompt graph.
        - The workflow graph has been successfully parsed and semantic
            metadata has been extracted.
        - All referenced input assets exist and are readable.
        - Exif metadata can be extracted from all referenced input assets.

        The following conditions are intentionally NOT required:

        - Input asset MIME types may be unknown.
        - Warnings produced during metadata extraction do not invalidate
            the import.

        After this method returns successfully, all metadata exposed by
        ``self.metadata`` and ``self.metadata.input_assets`` may be
        safely consumed by the import pipeline.

        """
        ## check duplicate
        existing = self.is_duplicate
        if existing:
            raise ValueError(
                "Output asset already exists in archive. "
                f"Id: {existing.id} {existing.file_name} "
                f"({time.ctime(existing.added_on)})",
            )
        self.metadata.verify()

    def get_generation(self) -> Generation:
        """
        Return the Generation instance for this staged file.

        The method is idempotent and always returns the same in-memory
        instance. The returned object is not persisted.

        The caller is responsible for adding it to a database session and
        managing the transaction.
        """
        if self.generation is None:
            metadata = self.metadata
            self.generation = Generation(
                workflow_name=metadata.workflow_name,
                workflow_id=metadata.workflow_id,
                workflow_type=metadata.workflow_type,
                generation_time_seconds=None,
                seed=metadata.seed,
                requested_width=metadata.requested_width,
                requested_height=metadata.requested_height,
                output_width=metadata.output_width,
                output_height=metadata.output_height,
                fps=metadata.fps,
                frame_count=metadata.frame_count,
                duration_seconds=metadata.duration_seconds,
                sampler=metadata.sampler,
                scheduler=metadata.scheduler,
                steps=metadata.steps,
                cfg=metadata.cfg,
                primary_model_name=metadata.primary_model_name,
                models_json=metadata.models,
                prompt=metadata.positive_prompt,
                negative_prompt=metadata.negative_prompt,
                all_prompts_json=metadata.all_prompts,
                input_files_count=len(metadata.input_assets),
                accepted=False,
            )
        return self.generation

    def get_asset(self) -> Asset:
        """
        Return the Asset instance for this staged file.

        The method is idempotent and always returns the same in-memory
        instance. The returned object is not persisted.

        The caller is responsible for adding it to a database session and
        managing the transaction.
        """
        if self.asset is None:
            metadata = self.metadata
            self.asset = Asset(
                file_name=self.file_orig_name,
                file_hash=self._hash,
                file_timestamp=self.file_last_modified,
                archive_file_name=None,
                mime_type=metadata.mime_type,
                file_size=self._file_stat.st_size,
                width=metadata.output_width,
                height=metadata.output_height,
                fps=metadata.fps,
                duration_seconds=metadata.duration_seconds,
                metadata_json=metadata.raw,
            )
        return self.asset

    def archive(self):
        if self.asset is None or self.asset.id is None:
            raise RuntimeError(
                "Output asset must be persisted to DB before calling archive()"
            )

        archive_file_name = get_archive_file_name(
            orig_file_name=self.file_orig_name,
            asset_id=self.asset.id,
        )
        self.archive_destination_path = archive_media_file(self.path, archive_file_name)
        return archive_file_name

    def link_to_generation(self) -> GenerationAsset:
        if self.asset is None or self.asset.id is None:
            raise RuntimeError(
                "Output asset must be persisted to DB before linking output file"
            )

        if self.generation is None or self.generation.id is None:
            raise RuntimeError(
                "Generation must be persisted before linking output file"
            )

        return GenerationAsset(
            generation_id=self.generation.id,
            asset_id=self.asset.id,
            role=self._output_file_role(),
            assoc_type=AssocType.OUTPUT,
        )

    def delete_file(self):
        """
        Delete the uploaded staging file.

        The staging file is expected to exist for the lifetime of this
        object. Missing files are treated as an unexpected state.
        """
        self.path.unlink()

    def rollback_archive(self):
        if self.archive_destination_path is not None:
            self.archive_destination_path.unlink(missing_ok=True)
            self.archive_destination_path = None

    @cached_property
    def is_duplicate(self) -> Asset | None:
        f_hash: str = self._hash
        existing = self.db.scalar(select(Asset).where(Asset.file_hash == f_hash))
        return existing

    @cached_property
    def metadata(self) -> FileMetadata:
        return FileMetadata(self.path)

    @cached_property
    def _hash(self) -> str:
        return sha256_file(self.path)

    @cached_property
    def _file_stat(self) -> stat_result:
        return self.path.stat()

    def _output_file_role(self) -> str:
        workflow_type = self.metadata.workflow_type
        if not workflow_type:
            return "output_asset"

        workflow_type = workflow_type.lower()

        if "video" in workflow_type:
            return "output_video"

        if "image" in workflow_type:
            return "output_image"

        return "output_asset"
