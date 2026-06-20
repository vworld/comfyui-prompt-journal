from prompt_toolkit import Application
from prompt_toolkit.buffer import Buffer
from prompt_toolkit.key_binding import KeyBindings
from prompt_toolkit.layout import Layout
from prompt_toolkit.layout.containers import (
    HSplit,
    Window,
)
from prompt_toolkit.layout.controls import (
    FormattedTextControl,
    BufferControl,
)

from app.services.search.shot_search import (
    search_shots,
)

from app.cli.helpers.hierarchy_builder import (
    hierarchy_builder,
)


def pick_shot():
    query = ""
    selected_index = 0

    results = search_shots("")

    def refresh():

        nonlocal results
        nonlocal selected_index

        results = search_shots(
            search_buffer.text
        )

        if not results:
            selected_index = 0
            return

        selected_index = max(
            0,
            min(
                selected_index,
                len(results) - 1,
            )
        )

    def get_results_text():

        lines = []

        lines.append(
            "Search Shot"
        )

        lines.append(
            "-----------"
        )

        lines.append("")

        if not results:
            lines.append(
                "No matching shots"
            )

            lines.append("")

            lines.append(
                "[C] Create Hierarchy"
            )

            lines.append(
                "[ESC] Cancel"
            )

            return "\n".join(lines)

        for index, shot in enumerate(
                results
        ):
            marker = (
                ">"
                if index == selected_index
                else " "
            )

            number = (
                shot["shot_number"]
                if shot["shot_number"]
                   is not None
                else "-"
            )

            lines.append(
                f"{marker} "
                f"{shot['shot_id']} | "
                f"{number} | "
                f"{shot['shot_name']} | "
                f"{shot['project_name']}/"
                f"{shot['scene_name']}/"
                f"{shot['clip_name']}"
            )

        lines.append("")
        lines.append(
            "[ENTER] Select"
        )

        lines.append(
            "[C] Create Hierarchy"
        )

        lines.append(
            "[ESC] Cancel"
        )

        return "\n".join(lines)

    search_buffer = Buffer()

    def on_text_changed(_):

        refresh()

        app.invalidate()

    search_buffer.on_text_changed += (
        on_text_changed
    )

    result_window = Window(
        FormattedTextControl(
            lambda: get_results_text()
        ),
        always_hide_cursor=True,
    )

    kb = KeyBindings()

    @kb.add("down")
    def _(event):

        nonlocal selected_index

        if results:
            selected_index = min(
                selected_index + 1,
                len(results) - 1,
            )

            event.app.invalidate()

    @kb.add("up")
    def _(event):

        nonlocal selected_index

        if results:
            selected_index = max(
                selected_index - 1,
                0,
            )

            event.app.invalidate()

    @kb.add("enter")
    def _(event):

        if not results:
            return

        event.app.exit(
            result=results[
                selected_index
            ]
        )

    @kb.add("escape")
    def _(event):

        event.app.exit(
            result=None
        )

    @kb.add("c")
    def _(event):

        hierarchy_builder()

        refresh()

        event.app.invalidate()

    layout = Layout(
        HSplit(
            [
                Window(
                    height=1,
                    content=BufferControl(
                        buffer=search_buffer
                    ),
                ),

                result_window,
            ]
        )
    )

    app = Application(
        layout=layout,
        key_bindings=kb,
        full_screen=False,
    )

    return app.run()
