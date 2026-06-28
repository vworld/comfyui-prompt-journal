from app.cli.ui.banner import print_error, print_header, print_line, print_success
from app.cli.ui.prompts import int_prompt, text_prompt
from app.db.session import SessionLocal
from app.models.clip import Clip
from app.models.project import Project
from app.models.scene import Scene
from app.models.shot import Shot


def create_shot():

    session = SessionLocal()

    try:

        projects = session.query(Project).order_by(Project.id).all()

        if not projects:
            print_error("No projects found")
            return

        print_header("Projects")

        for project in projects:
            print_line(f"{project.id}. {project.name}")

        project_id = int_prompt("Project ID", required=True)

        scenes = (
            session.query(Scene)
            .filter(Scene.project_id == project_id)
            .order_by(Scene.id)
            .all()
        )

        if not scenes:
            print_error("No scenes found")
            return

        print_header("Scenes")

        for scene in scenes:
            print_line(f"{scene.id}. {scene.name}")

        scene_id = int_prompt("Scene ID", required=True)

        clips = (
            session.query(Clip)
            .filter(Clip.scene_id == scene_id)
            .order_by(Clip.id)
            .all()
        )

        if not clips:
            print_error("No clips found")
            return

        print_header("Clips")

        for clip in clips:
            print_line(f"{clip.id}. {clip.name}")

        clip_id = int_prompt("Clip ID", required=True)

        name = text_prompt("Name", required=True)

        number = int_prompt("Shot Number", required=False)

        description = text_prompt("Description")

        comments = text_prompt("Comments")

        assert project_id is not None
        assert scene_id is not None
        assert clip_id is not None

        shot = Shot(
            project_id=project_id,
            scene_id=scene_id,
            clip_id=clip_id,
            number=number,
            name=name,
            description=description or None,
            comments=comments or None,
        )

        session.add(shot)
        session.commit()

        print_success(f"Created shot #{shot.id}")

        return shot.id

    finally:
        session.close()
