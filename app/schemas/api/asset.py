from pydantic import BaseModel, ConfigDict, Field


class AssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(
        ...,
        description="Unique identifier for the asset",
    )

    file_name: str = Field(
        ...,
        description="Name of the file",
    )
    # file_hash: str = Field(
    #     ...,
    #     description="Hash of the file",
    # )
    # archive_file_name: str | None = Field(
    #     None,
    #     description="Name of the archive file",
    # )
    file_timestamp: int = Field(
        ...,
        description="Last Modified Timestamp of the file",
    )
    mime_type: str | None = Field(
        None,
        description="MIME type of the file",
    )
    file_size: int | None = Field(
        None,
        description="Size of the file in bytes",
    )
    width: int | None = Field(
        None,
        description="Width of the asset",
    )
    height: int | None = Field(
        None,
        description="Height of the asset",
    )
    fps: int | float | None = Field(
        None,
        description="Frames per second",
    )
    duration_seconds: float | None = Field(
        None,
        description="Duration in seconds",
    )
    # metadata_json: ExifDump = Field(
    #     ...,
    #     description="JSON metadata of the asset",
    # )
    description: str | None = Field(
        None,
        description="Auto generated description of the asset (experimental)",
    )
    added_on: int = Field(
        description="Timestamp when the asset was added",
    )
