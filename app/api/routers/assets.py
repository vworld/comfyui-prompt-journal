import shutil
from pathlib import Path
from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from fastapi.responses import (
    FileResponse,
)
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models import Asset
from app.schemas.api.asset import AssetResponse, RecreateAssetFromArchiveResponse
from app.services.file.paths import media_archive_dir

router = APIRouter()

# TODO Add thumbnail creation


@router.get(
    "/{asset_id}",
    response_model=AssetResponse,
    summary="Get Asset row by ID",
)
def get_asset(
    asset_id: int,
    db: Annotated[
        Session,
        Depends(get_db),
    ],
):

    asset = db.get(
        Asset,
        asset_id,
    )

    if not asset:
        raise HTTPException(
            status_code=404,
            detail="Asset not found",
        )

    return asset


@router.get(
    "/{asset_id}/file",
    response_class=FileResponse,
    summary="Download asset file",
    description=(
        "Returns the archived asset as binary file data. "
        "The Content-Type header is determined dynamically "
        "from the asset MIME type."
    ),
)
def get_asset_file(
    asset_id: int,
    db: Annotated[
        Session,
        Depends(get_db),
    ],
) -> FileResponse:

    asset = db.get(
        Asset,
        asset_id,
    )

    if not asset or not asset.archive_file_name:
        raise HTTPException(
            status_code=404,
            detail="Asset not found",
        )

    path = media_archive_dir() / asset.archive_file_name

    if not path.is_file():
        raise HTTPException(
            status_code=404,
            detail=("Asset file does not exist"),
        )

    return FileResponse(
        path=path,
        filename=asset.file_name,
        media_type=asset.mime_type,
    )


@router.get(
    "/{asset_id}/recreate-from-archive",
    response_model=RecreateAssetFromArchiveResponse,
    summary="Recreate asset",
    description="Copies asset file from archive to the original path.",
)
def recreate_file_from_archive(
    asset_id: int,
    db: Annotated[Session, Depends(get_db)],
):
    asset = db.get(Asset, asset_id)

    if not asset:
        raise HTTPException(
            status_code=404,
            detail="Asset not found",
        )

    if not asset.archive_file_name:
        raise HTTPException(
            status_code=400,
            detail="Asset has no archive file",
        )

    if not asset.orig_file_path:
        raise HTTPException(
            status_code=400,
            detail="Asset has no original file path",
        )

    archive_path = asset.archive_file_path

    if not archive_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Archive file does not exist",
        )

    orig_path = Path(asset.orig_file_path)

    copied = False
    if not orig_path.exists():
        orig_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(archive_path, orig_path)
        copied = True

    return RecreateAssetFromArchiveResponse(
        asset_id=asset.id,
        recreated_path=asset.orig_file_path,
        copied=copied,
    )
