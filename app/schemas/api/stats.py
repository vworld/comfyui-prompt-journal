from pydantic import BaseModel


class GenerationStats(BaseModel):
    total: int
    reviewed: int
    unreviewed: int
    unassigned: int


class CurrentStatsResponse(BaseModel):
    generation: GenerationStats
    projects: int
    scenes: int
    clips: int
    shots: int
    assets: int
