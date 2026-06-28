import shutil
import time
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Asset
from app.models.staged_generation import (
    StagedGeneration,
)
from app.schemas.api.upload import (
    InputAssetResponse,
    PromptResponse,
    StagedGenerationResponse,
    StagedGenerationResponseBase,
    WorkflowModelResponse,
)
from app.services.assets.hash import (
    sha256_file,
)
from app.services.assets.utils import (
    get_upload_dir,
    resolve_input_asset_path,
)
from app.services.metadata.schema_extract import (
    extract_schema,
)


def create_staged_generation(
    db: Session,
    uploaded_file: UploadFile,
    file_last_modified: int,
    file_orig_name: str,
) -> StagedGenerationResponse:

    extension = Path(file_orig_name).suffix

    staged_name = f"{int(time.time() * 1000)}{extension}"

    staged_path = get_upload_dir() / staged_name

    with staged_path.open("wb") as f:
        shutil.copyfileobj(
            uploaded_file.file,
            f,
        )

    try:
        file_hash = sha256_file(staged_path)

        existing = db.scalar(select(Asset).where(Asset.file_hash == file_hash))

        if existing:
            raise ValueError(
                "Output asset already exists in archive. "
                f"Id: {existing.id} {existing.file_name} "
                f"({time.ctime(existing.added_on)})",
            )

        enriched_file = enrich_staged_file(staged_path)

        upload = StagedGeneration(
            file_name=file_orig_name,
            file_path=str(staged_path),
            file_hash=file_hash,
            file_last_modified=file_last_modified,
            uploaded_on=int(time.time()),
        )

        db.add(upload)
        db.commit()
        db.refresh(upload)

        return StagedGenerationResponse(
            upload_id=upload.id,
            **enriched_file.model_dump(),
        )

    except Exception:
        db.rollback()

        staged_path.unlink(missing_ok=True)

        raise


def enrich_staged_file(
    file_path: Path,
) -> StagedGenerationResponseBase:
    metadata = extract_schema(file_path)
    if "error" in metadata:
        raise ValueError(f"metadata not found. {metadata}")

    processed_assets: list[InputAssetResponse] = []

    for idx, asset in enumerate(metadata.get("input_assets", [])):
        #
        # Ignore nodes that do not
        # actually reference a file.
        #

        input_file_name = asset.get("value")

        if not input_file_name:
            continue

        # validate input file exists
        resolve_input_asset_path(input_file_name)

        processed_assets.append(
            InputAssetResponse(
                key=idx,
                node_id=asset["node_id"],
                class_type=asset["class_type"],
                title=asset["title"],
                role=asset["role"],
                value=asset["value"],
                mime_type=asset["mime_type"],
            ),
        )

    return StagedGenerationResponseBase(
        workflow_name=metadata["workflow_name"],
        workflow_id=metadata["workflow_id"],
        workflow_type=metadata["workflow_type"],
        prompt=metadata["prompt"],
        negative_prompt=metadata["negative_prompt"],
        mime_type=metadata["mime_type"],
        all_prompts=[PromptResponse(**prompt) for prompt in metadata["all_prompts"]],
        requested_width=metadata["requested_width"],
        requested_height=metadata["requested_height"],
        output_width=metadata["output_width"],
        output_height=metadata["output_height"],
        fps=(float(metadata["fps"]) if metadata["fps"] is not None else None),
        frame_count=metadata["frame_count"],
        duration_seconds=metadata["duration_seconds"],
        seed=metadata["seed"],
        sampler=metadata["sampler"],
        scheduler=metadata["scheduler"],
        steps=metadata["steps"],
        cfg=metadata["cfg"],
        input_assets=processed_assets,
        primary_model=(
            WorkflowModelResponse(**metadata["primary_model"])
            if metadata["primary_model"] is not None
            else None
        ),
        models=[WorkflowModelResponse(**model) for model in metadata["models"]],
    )


def get_staged_file_by_id(
    db: Session,
    upload_id: int,
) -> StagedGenerationResponse:
    upload = db.get(
        StagedGeneration,
        upload_id,
    )
    if upload is None:
        raise ValueError("Upload not found")

    file_path = Path(upload.file_path)
    return StagedGenerationResponse(
        upload_id=upload_id,
        **enrich_staged_file(file_path).model_dump(),
    )


def get_input_file_path_by_id(
    db: Session,
    upload_id: int,
    input_file_idx: int,
):
    """"""
    upload = db.get(
        StagedGeneration,
        upload_id,
    )

    if not upload:
        raise ValueError(
            "Upload not found",
        )

    # already guarantees file exists
    metadata = enrich_staged_file(Path(upload.file_path))
    asset = metadata.input_assets[input_file_idx]
    path = resolve_input_asset_path(asset.value)
    return path, upload
