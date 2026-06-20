import importlib
import os
from pathlib import Path
import shutil
import tempfile

import pytest

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config.config import CONFIG
from app.db.base import Base
from app.db import session as db_session

from app.models import (
    Project,
    Scene,
    Clip,
    Shot,
)


@pytest.fixture(autouse=True)
def test_environment():
    tmp = Path(__file__).resolve().parent.parent / "tmp" / "tests"
    root = Path(tmp)

    db_path = (
            root
            / "test.sqlite"
    )

    review_package_dir = (
            root
            / "review_packages"
    )

    archive_dir = (
            root
            / "archive"
    )

    comfy_input_dir = (
            root
            / "comfy_input"
    )

    review_package_dir.mkdir(parents=True, exist_ok=True)
    archive_dir.mkdir(parents=True, exist_ok=True)
    comfy_input_dir.mkdir(parents=True, exist_ok=True)

    os.environ[
        "DATABASE_PATH"
    ] = str(db_path)

    os.environ[
        "REVIEW_PACKAGE_DIR"
    ] = str(review_package_dir)

    os.environ[
        "ASSET_ARCHIVE_DIR"
    ] = str(archive_dir)

    # os.environ[
    #     "COMFYUI_INPUT_DIR"
    # ] = str(comfy_input_dir)

    #
    # force reload
    #

    import app.config.config
    import app.db.session

    importlib.reload(
        app.config.config
    )

    importlib.reload(
        app.db.session
    )

    yield {
        "root": root,
        "db_path": db_path,
        "archive_dir": archive_dir,
        "review_package_dir":
            review_package_dir,
        "comfy_input_dir":
            comfy_input_dir,
    }


@pytest.fixture
def existing_shot(db):

    project = Project(
        name="Test Project",
        project_type="test",
    )

    db.add(project)
    db.flush()

    scene = Scene(
        project_id=project.id,
        name="Scene 1",
    )

    db.add(scene)
    db.flush()

    clip = Clip(
        scene_id=scene.id,
        name="Clip 1",
    )

    db.add(clip)
    db.flush()

    shot = Shot(
        project_id=project.id,
        scene_id=scene.id,
        clip_id=clip.id,
        name="Shot 1",
    )

    db.add(shot)
    db.commit()

    db.refresh(shot)

    db.close()

    return shot


@pytest.fixture
def db():
    session = db_session.SessionLocal()

    yield session

    session.close()


def count_rows(
        db,
        model,
):
    return db.query(model).count()


@pytest.fixture
def test_output_file():
    file = "/mnt/D/ai-stack/utils-and-scripts/ai-gen-prompt-data-collection/tmp/test-files/LTX_2.3_i2v_00003_.mp4"
    return file
