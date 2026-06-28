import traceback
from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.api.generation import GenerationDetailResponse
from app.services.file_service import FileService

router = APIRouter()


@router.post(
    "",
    response_model=GenerationDetailResponse,
    summary="Upload a ComfyUI output file",
    description="""
## Upload Files
Upload a ComfyUI output file. Once uploaded the system

- Extracts metadata.
- Validates referenced input files.
- Imports the output and input files in DB
- User can later add reviews, assign to a specific shot, etc
- On error it deletes the file and responds with the error message.

    """,
)
def upload_generated_file(
    file: Annotated[
        UploadFile,
        File(...),
    ],
    file_last_modified: Annotated[
        int,
        Form(
            description=(
                "Original file last modified timestamp in "
                "milliseconds since the Unix epoch"
            ),
        ),
    ],
    file_orig_name: Annotated[
        str,
        Form(),
    ],
    db: Annotated[
        Session,
        Depends(get_db),
    ],
) -> GenerationDetailResponse:

    try:
        service = FileService(db=db)
        generation = service.upload_file(
            file=file,
            file_last_modified=file_last_modified,
            file_orig_name=file_orig_name,
        )
        return GenerationDetailResponse.model_validate(generation)

    except Exception as e:
        print(e)
        traceback.print_exc()
        raise HTTPException(
            status_code=422,
            detail=f"{type(e).__name__}: {e!r}",
        ) from None
