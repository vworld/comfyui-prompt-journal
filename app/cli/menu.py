from app.cli.browse import browse_hierarchy
from app.cli.clip import create_clip
from app.cli.create_review_package import create_review_package
from app.cli.import_review_package import import_review_package
from app.cli.project import create_project
from app.cli.scene import create_scene
from app.cli.shot import create_shot
from app.cli.ui.banner import print_header, print_line
from app.cli.ui.prompts import choice_prompt

MENU_OPTIONS = {
    "1": ("Create Review Package", create_review_package),
    "2": ("Import Review Package", import_review_package),
    "3": ("Create Project", create_project),
    "4": ("Create Scene", create_scene),
    "5": ("Create Clip", create_clip),
    "6": ("Create Shot", create_shot),
    "7": ("Browse Hierarchy", browse_hierarchy),
}


def show_menu():

    print_header("Prompt Archive System")

    for key, (label, _) in MENU_OPTIONS.items():
        print_line(f"{key}. {label}")

    print_line("8. Settings")
    print_line("9. Exit")
    print_line()


def start_cli():
    while True:

        show_menu()

        choice = choice_prompt(
            "Select option",
            valid_choices=[*MENU_OPTIONS.keys(), "8", "9"],
        )

        if choice == "9":
            print_line("Goodbye")
            break

        if choice == "8":
            print_line("Not implemented")
            continue

        _, handler = MENU_OPTIONS[choice]

        handler()
