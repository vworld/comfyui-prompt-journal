from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.error_handlers import register_exception_handlers
from app.api.routers import (
    assets,
    clip_shots,
    clips,
    generations,
    project_scenes,
    projects,
    scene_clips,
    scenes,
    shot_generations,
    shots,
    upload,
)

app = FastAPI(
    title="ComfyUI Prompt Journal API",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="http://localhost:\\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

api_router = APIRouter(prefix="/api")

api_router.include_router(
    projects.router,
    prefix="/projects",
    tags=["Projects"],
)

api_router.include_router(
    project_scenes.router,
    prefix="/projects",
    tags=["Scenes"],
)

api_router.include_router(
    scenes.router,
    prefix="/scenes",
    tags=["Scenes"],
)

api_router.include_router(
    scene_clips.router,
    prefix="/scenes",
    tags=["Clips"],
)

api_router.include_router(
    clips.router,
    prefix="/clips",
    tags=["Clips"],
)

api_router.include_router(
    clip_shots.router,
    prefix="/clips",
    tags=["Shots"],
)

api_router.include_router(
    shots.router,
    prefix="/shots",
    tags=["Shots"],
)


api_router.include_router(
    upload.router,
    prefix="/uploads",
    tags=["Uploads"],
)

api_router.include_router(
    generations.router,
    prefix="/generations",
    tags=["Generations"],
)

api_router.include_router(
    shot_generations.router,
    prefix="/shots",
    tags=["Shots"],
)

api_router.include_router(
    assets.router,
    prefix="/assets",
    tags=["Assets"],
)


app.include_router(api_router)
