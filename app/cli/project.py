from app.db.session import SessionLocal
from app.models.project import Project


def create_project():

    print()
    print("Create Project")
    print("--------------")

    name = input("Name: ").strip()

    if not name:
        print("Project name is required")
        return

    project_type = input(
        "Project Type: "
    ).strip()

    description = input(
        "Description: "
    ).strip()

    session = SessionLocal()

    try:

        project = Project(
            name=name,
            project_type=project_type,
            description=description or None
        )

        session.add(project)
        session.commit()

        print(
            f"Created project #{project.id}"
        )

    finally:
        session.close()