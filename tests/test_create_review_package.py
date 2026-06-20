import pytest

from app.config.config import CONFIG
from app.db.session import SessionLocal

from app.models import (
    Asset,
    Generation,
    GenerationAsset,
)

from app.services.review_package.create import (
    create_review_package,
)
from tests.conftest import count_rows

review_dir_base = CONFIG.get("review_package_dir")

def test_create_review_package_happy_path(
        test_output_file,
        existing_shot,
db):
    generation_id = create_review_package(
        output_file=test_output_file,
        shot_id=existing_shot.id,
    )

    db = SessionLocal()

    generation = db.get(
        Generation,
        generation_id,
    )

    assert generation is not None

    assets = (
        db.query(GenerationAsset)
        .filter(
            GenerationAsset.generation_id
            == generation_id
        )
        .all()
    )

    assert len(assets) > 0

    review_dir = (
            review_dir_base
            / f"review_{generation_id}"
    )

    assert review_dir.exists()

    assert (
            review_dir
            / "manifest.json"
    ).exists()

    assert (
            review_dir
            / "llm_context.json"
    ).exists()

    assert (
            review_dir
            / "review.md"
    ).exists()

    assert (
            review_dir
            / "warnings.json"
    ).exists()

    db.close()



def test_duplicate_output_file_rejected(
    test_output_file,
    existing_shot,
):

    create_review_package(
        output_file=test_output_file,
        shot_id=existing_shot.id,
    )

    with pytest.raises(
        ValueError,
        match="already exists",
    ):
        create_review_package(
            output_file=test_output_file,
            shot_id=existing_shot.id,
        )

def test_missing_input_asset_aborts_and_rolls_back(
        broken_output_file,
        existing_shot,
):
    before_generations = count_rows(
        Generation
    )

    before_assets = count_rows(
        Asset
    )

    with pytest.raises(
            FileNotFoundError
    ):
        create_review_package(
            output_file=broken_output_file,
            shot_id=existing_shot.id,
        )

    after_generations = count_rows(
        Generation
    )

    after_assets = count_rows(
        Asset
    )

    assert (
            before_generations
            == after_generations
    )

    assert (
            before_assets
            == after_assets
    )


# def test_assets_archived(
#         test_output_file,
#         existing_shot,
# ):
#     generation_id = create_review_package(
#         output_file=test_output_file,
#         shot_id=existing_shot.id,
#     )
#
#     db = SessionLocal()
#
#     generation_assets = (
#         db.query(Asset)
#         .join(GenerationAsset)
#         .filter(
#             GenerationAsset.generation_id
#             == generation_id
#         )
#         .all()
#     )
#
#     for asset in generation_assets:
#         archive_file = (
#                 ARCHIVE_MEDIA_DIR
#                 / asset.archive_file_name
#         )
#
#         assert archive_file.exists()
#
#     db.close()
#
#
#
# def test_review_package_contents_match_database(
#         test_output_file,
#         existing_shot,
# ):
#     generation_id = create_review_package(
#         output_file=test_output_file,
#         shot_id=existing_shot.id,
#     )
#
#     review_dir = (
#             REVIEW_PACKAGE_DIR
#             / f"review_{generation_id}"
#     )
#
#     manifest = json.loads(
#         (
#                 review_dir
#                 / "manifest.json"
#         ).read_text()
#     )
#
#     assert (
#             manifest["generation_id"]
#             == generation_id
#     )
#
#     db = SessionLocal()
#
#     generation = db.get(
#         Generation,
#         generation_id,
#     )
#
#     assert (
#             generation.shot_id
#             == manifest["shot_id"]
#     )
#
#     db.close()
