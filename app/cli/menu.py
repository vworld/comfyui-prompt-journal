from app.cli.create_review_package import (
    create_review_package
)

from app.cli.import_review_package import (
    import_review_package
)

from app.cli.project import create_project
from app.cli.scene import create_scene
from app.cli.clip import create_clip
from app.cli.shot import create_shot

from app.cli.browse import browse_hierarchy

MENU_OPTIONS = {
    "1": (
        "Create Review Package",
        create_review_package
    ),

    "2": (
        "Import Review Package",
        import_review_package
    ),

    "3": (
        "Create Project",
        create_project
    ),

    "4": (
        "Create Scene",
        create_scene
    ),

    "5": (
        "Create Clip",
        create_clip
    ),

    "6": (
        "Create Shot",
        create_shot
    ),

    "7": (
        "Browse Hierarchy",
        browse_hierarchy
    ),
}


def show_menu():
    print()
    print("Prompt Archive System")
    print("---------------------")
    print()

    for key, (label, _) in MENU_OPTIONS.items():
        print(f"{key}. {label}")

    print("8. Settings")
    print("9. Exit")
    print()


def start_cli():
    while True:

        show_menu()

        choice = input(
            "Select option: "
        ).strip()

        if choice == "9":
            print("Goodbye")
            break

        if choice == "8":
            print("Not implemented")
            continue

        option = MENU_OPTIONS.get(choice)

        if not option:
            print("Invalid option")
            continue

        _, handler = option

        # try:
        handler()

    # except KeyboardInterrupt:
    #     print()

    # except Exception as exc:
    #     print(
    #         f"ERROR: {exc}"
    #     )
