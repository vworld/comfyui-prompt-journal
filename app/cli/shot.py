from app.db.session import SessionLocal

from app.models.project import Project
from app.models.scene import Scene
from app.models.clip import Clip
from app.models.shot import Shot


def create_shot():

    session = SessionLocal()

    try:

        projects = (
            session.query(Project)
            .order_by(Project.id)
            .all()
        )

        if not projects:
            print("No projects found")
            return

        print()
        print("Projects")
        print("--------")

        for project in projects:
            print(
                f"{project.id}. {project.name}"
            )

        project_id = int(
            input("Project ID: ")
        )

        scenes = (
            session.query(Scene)
            .filter(
                Scene.project_id == project_id
            )
            .order_by(Scene.id)
            .all()
        )

        if not scenes:
            print("No scenes found")
            return

        print()
        print("Scenes")
        print("------")

        for scene in scenes:
            print(
                f"{scene.id}. {scene.name}"
            )

        scene_id = int(
            input("Scene ID: ")
        )

        clips = (
            session.query(Clip)
            .filter(
                Clip.scene_id == scene_id
            )
            .order_by(Clip.id)
            .all()
        )

        if not clips:
            print("No clips found")
            return

        print()
        print("Clips")
        print("-----")

        for clip in clips:
            print(
                f"{clip.id}. {clip.name}"
            )

        clip_id = int(
            input("Clip ID: ")
        )

        name = input("Name: ").strip()

        number = input(
            "Shot Number: "
        ).strip()

        description = input(
            "Description: "
        ).strip()

        comments = input(
            "Comments: "
        ).strip()

        shot = Shot(
            project_id=project_id,
            scene_id=scene_id,
            clip_id=clip_id,
            number=int(number)
            if number else None,
            name=name,
            description=description or None,
            comments=comments or None
        )

        session.add(shot)
        session.commit()

        print(
            f"Created shot #{shot.id}"
        )

    finally:
        session.close()