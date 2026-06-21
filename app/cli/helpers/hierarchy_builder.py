from app.cli.project import create_project
from app.cli.scene import create_scene
from app.cli.clip import create_clip
from app.cli.shot import create_shot

from app.cli.ui.banner import print_header, print_line
from app.cli.ui.prompts import choice_prompt

HIERARCHY_MENU_OPTIONS = {
    "1": ("Create Project", create_project),
    "2": ("Create Scene", create_scene),
    "3": ("Create Clip", create_clip),
    "4": ("Create Shot", create_shot),
}


def hierarchy_builder(banner_text: str = "Create Hierarchy"):
    while True:

        print_header(banner_text)

        for key, (label, _) in HIERARCHY_MENU_OPTIONS.items():
            print_line(f"{key}. {label}")

        print_line("5. Return To Search")
        print_line("6. Cancel")
        print_line()

        choice = choice_prompt(
            "Choice",
            valid_choices=[*HIERARCHY_MENU_OPTIONS.keys(), "5", "6"],
        )

        if choice == "5":
            return None

        if choice == "6":
            raise KeyboardInterrupt()

        if choice == "4":
            shot_id = create_shot()

            if shot_id:
                return shot_id

            continue

        _, handler = HIERARCHY_MENU_OPTIONS[choice]

        handler()
