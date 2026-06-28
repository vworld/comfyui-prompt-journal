from typing import TypedDict

from pydantic import BaseModel, ConfigDict

from app.schemas.api.clip import ClipHierarchicalResponse


class ShotCreate(BaseModel):
    number: int | None = None
    name: str
    description: str | None = None
    comments: str | None = None


class ShotUpdate(BaseModel):
    number: int | None = None
    name: str | None = None
    description: str | None = None
    comments: str | None = None


class ShotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    scene_id: int
    clip_id: int
    number: int | None
    name: str
    description: str | None
    comments: str | None
    added_on: int


class ShotGenerationCountResponse(BaseModel):
    count: int


class ShotSearchResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    shot_id: int
    shot_number: int | None
    shot_name: str
    project_id: int
    project_name: str
    scene_id: int
    scene_name: str
    clip_id: int
    clip_name: str


class ShotSearchResultDict(TypedDict):
    shot_id: int
    shot_number: int | None
    shot_name: str
    project_id: int
    project_name: str
    scene_id: int
    scene_name: str
    clip_id: int
    clip_name: str


class ShotHierarchicalResponse(ShotResponse):
    clip: ClipHierarchicalResponse
