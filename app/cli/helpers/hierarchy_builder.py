from app.cli.project import (
    create_project,
)

from app.cli.scene import (
    create_scene,
)

from app.cli.clip import (
    create_clip,
)

from app.cli.shot import (
    create_shot,
)


def hierarchy_builder():
    while True:

        print()
        print(
            "No matching shots found"
        )

        print(
            "-----------------------"
        )

        print()

        print(
            "1. Create Project"
        )

        print(
            "2. Create Scene"
        )

        print(
            "3. Create Clip"
        )

        print(
            "4. Create Shot"
        )

        print(
            "5. Return To Search"
        )

        print(
            "6. Cancel"
        )

        print()

        choice = input(
            "Choice: "
        ).strip()

        if choice == "1":
            create_project()

        elif choice == "2":
            create_scene()

        elif choice == "3":
            create_clip()

        elif choice == "4":

            shot_id = (
                create_shot()
            )

            if shot_id:
                return shot_id

        elif choice == "5":
            return None

        elif choice == "6":
            raise KeyboardInterrupt()

        else:
            print(
                "Invalid option"
            )
