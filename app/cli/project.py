from app.db.session import SessionLocal
from app.models.project import Project

from app.cli.ui.banner import print_header, print_error, print_success
from app.cli.ui.prompts import text_prompt


def create_project():

    print_header("Create Project")

    name = text_prompt("Name", required=True)

    project_type = text_prompt("Project Type")

    description = text_prompt("Description")

    session = SessionLocal()

    try:

        project = Project(
            name=name,
            project_type=project_type,
            description=description or None,
        )

        session.add(project)
        session.commit()

        print_success(f"Created project #{project.id}")

    finally:
        session.close()
