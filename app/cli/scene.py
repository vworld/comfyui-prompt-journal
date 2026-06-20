from app.db.session import SessionLocal
from app.models.project import Project
from app.models.scene import Scene


def create_scene():

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

        name = input("Name: ").strip()

        number = input(
            "Scene Number: "
        ).strip()

        description = input(
            "Description: "
        ).strip()

        comments = input(
            "Comments: "
        ).strip()

        scene = Scene(
            project_id=project_id,
            number=int(number)
            if number else None,
            name=name,
            description=description or None,
            comments=comments or None
        )

        session.add(scene)
        session.commit()

        print(
            f"Created scene #{scene.id}"
        )

    finally:
        session.close()