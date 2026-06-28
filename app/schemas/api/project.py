from pydantic import BaseModel, ConfigDict


class ProjectCreateRequest(BaseModel):
    name: str
    project_type: str
    description: str | None = None


class ProjectUpdateRequest(BaseModel):
    name: str | None = None
    project_type: str | None = None
    description: str | None = None


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    project_type: str
    description: str | None
    added_on: int