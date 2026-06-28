import shutil

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.models.generation import Generation
from app.services.file.paths import upload_file_path
from app.services.file.staged_file import StagedFile


class FileService:
    def __init__(
        self,
        db: Session,
    ):
        self.db = db

    def upload_file(
        self,
        file: UploadFile,
        file_last_modified: int,
        file_orig_name: str,
    ) -> Generation:
        staging_path = upload_file_path(file_orig_name)

        # Save uploaded file to staging area.

        with staging_path.open("wb") as f:
            shutil.copyfileobj(
                file.file,
                f,
            )
        db = self.db

        # create class
        staged = StagedFile(
            db=db,
            path=staging_path,
            file_last_modified=file_last_modified,
            file_orig_name=file_orig_name,
        )

        try:
            staged.verify()

            input_files = staged.metadata.input_assets

            # Create ORM objects.
            generation = staged.get_generation()
            output_asset = staged.get_asset()

            db.add(generation)
            db.add(output_asset)

            # add input files to db, if not already an existing asset
            for input_file in input_files:
                asset = input_file.get_asset(db)

                if not input_file.is_existing_asset:
                    db.add(asset)

            # Persist ORM objects.
            db.flush()

            assert generation.id is not None

            # Archive media files
            output_asset.archive_file_name = staged.archive()

            # Create generation-asset relationships.
            db.add(staged.link_to_generation())

            for input_file in input_files:
                if not input_file.is_existing_asset:
                    input_file.get_asset(db).archive_file_name = input_file.archive()

                db.add(input_file.link_to_generation(generation.id))

            db.commit()

            staged.delete_file()

            return generation

        except Exception as e:
            print(e)
            db.rollback()
            staged.rollback_archive()
            for input_file in staged.metadata.input_assets:
                input_file.rollback_archive()
            staged.delete_file()
            raise
