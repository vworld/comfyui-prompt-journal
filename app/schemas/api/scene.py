from pydantic import BaseModel, ConfigDict

from app.schemas.api.project import ProjectResponse


class SceneCreateRequest(BaseModel):
    number: int | None = None
    name: str
    description: str | None = None
    comments: str | None = None


class SceneUpdateRequest(BaseModel):
    number: int | None = None
    name: str | None = None
    description: str | None = None
    comments: str | None = None


class SceneResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    number: int | None
    name: str
    description: str | None
    comments: str | None
    added_on: int
    
class SceneHierarchicalResponse(SceneResponse):
    project: ProjectResponse