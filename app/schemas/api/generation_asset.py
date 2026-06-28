from pydantic import BaseModel, ConfigDict, Field

from app.models.generation_asset import AssocType
from app.schemas.api.asset import AssetResponse


class GenerationAssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    assoc_type: AssocType = Field(
        ...,
        description="The type of association between the generation and the asset",
    )
    role: str = Field(
        ...,
        description="Role of the asset in the generation",
    )
    asset: AssetResponse = Field(
        ...,
        description="Asset associated with the generation",
    )
