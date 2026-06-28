import json
import shutil
from pathlib import Path

from sqlalchemy import select

from app.config.config import CONFIG
from app.db.session import SessionLocal
from app.models import (
    Asset,
    Generation,
    GenerationAsset,
    Shot,
)
from app.services.assets.archive import archive_media_file
from app.services.assets.hash import sha256_file
from app.services.assets.metadata import extract_asset_metadata
from app.services.assets.utils import output_file_role, resolve_input_asset_path
from app.services.metadata.schema_extract import (
    extract_schema,
)
from app.services.review_package.llm_context import (
    write_llm_context,
)
from app.services.review_package.manifest import (
    write_manifest,
)
from app.services.review_package.review_md import (
    write_review_template,
)
from app.services.review_package.warnings import (
    write_warnings,
)


def create_review_package(
    output_file: str | Path,
    shot_id: int,
) -> int:
    output_file = Path(output_file)

    if not output_file.exists():
        raise FileNotFoundError(output_file)

    metadata = extract_schema(str(output_file))

    input_assets = metadata.get("input_assets", [])

    db = SessionLocal()

    created_generation_id = None

    created_asset_ids: list[int] = []

    created_archive_files: list[Path] = []

    review_dir: Path | None = None

    try:
        #
        # Validate Shot
        #

        shot = db.scalar(select(Shot).where(Shot.id == shot_id))

        if not shot:
            raise ValueError(f"Shot not found: {shot_id}")

        #
        # Resolve Input Assets
        #

        resolved_inputs = []

        for input_asset in input_assets:
            path = resolve_input_asset_path(input_asset["value"])

            if not path.exists():
                raise FileNotFoundError(f"Missing input asset: {path}")

            resolved_inputs.append(
                {
                    "role": input_asset.get("role"),
                    "path": path,
                }
            )

        #
        # Output Hash
        #

        output_hash = sha256_file(output_file)

        existing_output = db.scalar(select(Asset).where(Asset.file_hash == output_hash))

        if existing_output:
            raise ValueError(
                f"Output asset already exists in archive. Hash: {output_hash}"
            )

        #
        # Generation
        #

        generation = Generation(
            project_id=shot.project_id,
            shot_id=shot.id,
            workflow_name=metadata.get("workflow_name"),
            workflow_id=metadata.get("workflow_id"),
            workflow_type=metadata.get("workflow_type"),
            generation_time_seconds=None,
            seed=metadata.get("seed"),
            requested_width=metadata.get("requested_width"),
            requested_height=metadata.get("requested_height"),
            output_width=metadata.get("output_width"),
            output_height=metadata.get("output_height"),
            fps=metadata.get("fps"),
            frame_count=metadata.get("frame_count"),
            duration_seconds=metadata.get("duration_seconds"),
            sampler=metadata.get("sampler"),
            scheduler=metadata.get("scheduler"),
            steps=metadata.get("steps"),
            cfg=metadata.get("cfg"),
            primary_model_name=(metadata.get("primary_model", {}).get("name")),
            models_json=json.dumps(
                metadata.get("models", []),
                ensure_ascii=False,
            ),
            prompt=metadata.get("prompt"),
            negative_prompt=metadata.get("negative_prompt"),
            all_prompts_json=json.dumps(
                metadata.get("all_prompts", []),
                ensure_ascii=False,
            ),
            input_files_count=len(resolved_inputs),
        )

        db.add(generation)
        db.flush()

        created_generation_id = generation.id

        #
        # Output Asset
        #

        output_asset_meta = extract_asset_metadata(output_file)

        output_asset = Asset(
            **output_asset_meta,
            file_hash=output_hash,
        )

        db.add(output_asset)
        db.flush()

        archive_file_name = f"{output_asset.id}_{output_asset.file_name}"

        output_asset.archive_file_name = archive_file_name

        created_asset_ids.append(output_asset.id)

        db.flush()

        db.add(
            GenerationAsset(
                generation_id=generation.id,
                asset_id=output_asset.id,
                role=output_file_role(metadata.get("workflow_type")),
            )
        )

        #
        # Input Assets
        #

        input_files_manifest = []

        llm_input_files = []

        for resolved in resolved_inputs:
            role = resolved["role"]
            path = resolved["path"]

            file_hash = sha256_file(path)

            asset = db.scalar(select(Asset).where(Asset.file_hash == file_hash))

            if not asset:
                asset_meta = extract_asset_metadata(path)

                asset = Asset(
                    **asset_meta,
                    file_hash=file_hash,
                )

                db.add(asset)
                db.flush()

                asset.archive_file_name = f"{asset.id}_{asset.file_name}"

                created_asset_ids.append(asset.id)

                db.flush()

            db.add(
                GenerationAsset(
                    generation_id=generation.id,
                    asset_id=asset.id,
                    role=role,
                )
            )

            input_files_manifest.append(
                {
                    "file_name": asset.archive_file_name,
                    "hash": asset.file_hash,
                }
            )

            llm_input_files.append(
                {
                    "file_name": asset.archive_file_name,
                    "role": role,
                }
            )

        db.commit()

        #
        # Archive New Assets
        #

        archive_media_dir = Path(CONFIG["asset_archive_dir"]) / "media"

        archive_media_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        #
        # output asset
        #

        archived_output = archive_media_file(
            output_file,
            archive_file_name,
        )

        created_archive_files.append(archived_output)

        #
        # newly created inputs
        #

        for asset_id in created_asset_ids:
            if asset_id == output_asset.id:
                continue

            asset = db.get(
                Asset,
                asset_id,
            )
            assert asset is not None
            assert asset.file_path is not None
            assert asset.archive_file_name is not None

            source_path = Path(asset.file_path)

            archived = archive_media_file(
                source_path,
                asset.archive_file_name,
            )

            created_archive_files.append(archived)

        #
        # Review Package
        #

        review_dir = Path(CONFIG["review_package_dir"]) / (f"review_{generation.id}")

        review_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        generation_assets = (
            db.execute(
                select(Asset)
                .join(GenerationAsset)
                .where(GenerationAsset.generation_id == generation.id)
            )
            .scalars()
            .all()
        )

        for asset in generation_assets:
            assert asset.archive_file_name is not None

            source = archive_media_dir / asset.archive_file_name

            destination = review_dir / asset.archive_file_name

            shutil.copy2(
                source,
                destination,
            )

        write_manifest(
            review_dir=review_dir,
            generation_id=generation.id,
            shot_id=shot.id,
            output_file=archive_file_name,
            output_hash=output_hash,
            input_files=input_files_manifest,
        )

        write_llm_context(
            review_dir=review_dir,
            generation_id=generation.id,
            metadata=metadata,
            input_files=llm_input_files,
            output_file=archive_file_name,
        )

        write_review_template(review_dir, generation)

        write_warnings(
            review_dir,
            [],
        )

        return generation.id

    except Exception:
        #
        # review package cleanup
        #

        if review_dir and review_dir.exists():
            shutil.rmtree(
                review_dir,
                ignore_errors=True,
            )

        #
        # archive cleanup
        #

        for path in created_archive_files:
            try:
                path.unlink(missing_ok=True)
            except Exception:
                pass

        #
        # db cleanup
        #

        if created_generation_id:
            db.query(GenerationAsset).filter(
                GenerationAsset.generation_id == created_generation_id
            ).delete()

            db.query(Generation).filter(Generation.id == created_generation_id).delete()

            if created_asset_ids:
                db.query(Asset).filter(Asset.id.in_(created_asset_ids)).delete(
                    synchronize_session=False
                )

            db.commit()

        raise

    finally:
        db.close()
