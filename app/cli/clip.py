from app.db.session import SessionLocal
from app.models.scene import Scene
from app.models.clip import Clip

from app.cli.ui.banner import print_header, print_line, print_error, print_success
from app.cli.ui.prompts import text_prompt, int_prompt


def create_clip():

    session = SessionLocal()

    try:

        scenes = (
            session.query(Scene)
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

        name = text_prompt("Name", required=True)

        number = int_prompt("Clip Number", required=False)

        description = text_prompt("Description")

        comments = text_prompt("Comments")

        clip = Clip(
            scene_id=scene_id,
            number=number,
            name=name,
            description=description or None,
            comments=comments or None,
        )

        session.add(clip)
        session.commit()

        print_success(f"Created clip #{clip.id}")

    finally:
        session.close()
