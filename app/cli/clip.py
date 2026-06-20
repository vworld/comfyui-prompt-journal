from app.db.session import SessionLocal
from app.models.scene import Scene
from app.models.clip import Clip


def create_clip():

    session = SessionLocal()

    try:

        scenes = (
            session.query(Scene)
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

        name = input("Name: ").strip()

        number = input(
            "Clip Number: "
        ).strip()

        description = input(
            "Description: "
        ).strip()

        comments = input(
            "Comments: "
        ).strip()

        clip = Clip(
            scene_id=scene_id,
            number=int(number)
            if number else None,
            name=name,
            description=description or None,
            comments=comments or None
        )

        session.add(clip)
        session.commit()

        print(
            f"Created clip #{clip.id}"
        )

    finally:
        session.close()