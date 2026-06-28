import json
from pathlib import Path

from sqlalchemy.orm import Session

from app.models import (
    Generation,
    GenerationAsset,
    Shot,
)
from app.models.staged_generation import (
    StagedGeneration,
)
from app.schemas.api.generation import GenerationCreateRequest
from app.services.assets.get_or_create import get_or_create_asset
from app.services.assets.utils import (
    find_asset_by_source_path,
    output_file_role,
    resolve_input_asset_path,
)
from app.services.metadata.schema_extract import (
    extract_schema,
)


def create_generation(
    db: Session,
    payload: GenerationCreateRequest,
) -> int:
    """
    Action:
     - get_uploaded_file
     - extract metadata
     - create assets
     - create generation row
     - link assets to generation
     - archive files
     - remove file from staging
     - delete upload rows


    Raises:
        ValueError: incorrect upload_id
        ValueError: incorrect shot_id
        ValueError: Duplicate output file hash
        FileNotFoundError: _description_

    Returns:
        int: _description_
    """
    upload = db.get(
        StagedGeneration,
        payload.upload_id,
    )

    if not upload:
        raise ValueError("Upload not found.")

    shot = db.get(
        Shot,
        payload.shot_id,
    )

    if not shot:
        raise ValueError("Shot not found.")

    output_path = Path(upload.file_path)

    duplicate_output_file = find_asset_by_source_path(db, output_path)

    if duplicate_output_file:
        raise ValueError("Output asset already exists in archive.")

    metadata = extract_schema(output_path)
    if "error" in metadata:
        raise ValueError(f"Error extracting metadata from file: {metadata}")

    primary_model = metadata.get("primary_model")

    generation = Generation(
        shot_id=shot.id,
        project_id=shot.project_id,
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
        primary_model_name=(
            primary_model.get("name") if primary_model is not None else None
        ),
        models_json=metadata.get("models"),
        prompt=metadata.get("prompt"),
        negative_prompt=metadata.get("negative_prompt"),
        all_prompts_json=metadata.get("all_prompts"),
        input_files_count=len(metadata["input_assets"]),
        raw_intent=(payload.raw_intent),
        raw_review=(payload.raw_review),
        cleaned_intent=(payload.cleaned_intent),
        cleaned_review=(payload.cleaned_review),
        failure_description=(payload.failure_description),
        suspected_causes=(payload.suspected_causes),
        correction_strategy=(payload.correction_strategy),
        accepted=(payload.accepted if payload.accepted is not None else False),
    )

    db.add(generation)

    try:
        db.flush()

        #
        # Output asset
        #

        output_role = output_file_role(metadata.get("workflow_type"))

        output_asset = get_or_create_asset(
            db,
            output_path,
            output_role,
        )

        db.add(
            GenerationAsset(
                generation_id=(generation.id),
                asset_id=(output_asset.id),
            )
        )

        #
        # Input assets
        #

        for input_asset in metadata.get("input_assets", []):
            if not input_asset.get("value"):
                continue

            input_path = resolve_input_asset_path(input_asset["value"])

            if not (input_path.exists()):
                raise FileNotFoundError(f"Missing input asset: {input_path}")

            asset = get_or_create_asset(
                db,
                input_path,
                input_asset["role"],
            )

            db.add(
                GenerationAsset(
                    generation_id=(generation.id),
                    asset_id=(asset.id),
                )
            )

        db.delete(upload)

        db.commit()

        output_path.unlink(missing_ok=True)

        return generation.id

    except Exception:
        db.rollback()

        raise
