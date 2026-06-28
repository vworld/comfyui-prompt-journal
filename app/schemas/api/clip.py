from pydantic import BaseModel, ConfigDict

from app.schemas.api.scene import SceneHierarchicalResponse


class ClipCreateRequest(BaseModel):
    number: int | None = None
    name: str
    description: str | None = None
    comments: str | None = None


class ClipUpdateRequest(BaseModel):
    number: int | None = None
    name: str | None = None
    description: str | None = None
    comments: str | None = None


class ClipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    scene_id: int
    number: int | None
    name: str
    description: str | None
    comments: str | None
    added_on: int
    
class ClipHierarchicalResponse(ClipResponse):
    scene: SceneHierarchicalResponse