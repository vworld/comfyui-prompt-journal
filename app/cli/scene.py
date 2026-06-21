from app.db.session import SessionLocal
from app.models.project import Project
from app.models.scene import Scene

from app.cli.ui.banner import print_header, print_line, print_error, print_success
from app.cli.ui.prompts import text_prompt, int_prompt


def create_scene():

    session = SessionLocal()

    try:

        projects = (
            session.query(Project)
            .order_by(Project.id)
            .all()
        )

        if not projects:
            print_error("No projects found")
            return

        print_header("Projects")

        for project in projects:
            print_line(f"{project.id}. {project.name}")

        project_id = int_prompt("Project ID", required=True)

        name = text_prompt("Name", required=True)

        number = int_prompt("Scene Number", required=False)

        description = text_prompt("Description")

        comments = text_prompt("Comments")

        scene = Scene(
            project_id=project_id,
            number=number,
            name=name,
            description=description or None,
            comments=comments or None,
        )

        session.add(scene)
        session.commit()

        print_success(f"Created scene #{scene.id}")

    finally:
        session.close()
