from prompt_toolkit import PromptSession
from prompt_toolkit import HTML
from prompt_toolkit.completion import Completer, Completion
from prompt_toolkit.shortcuts import CompleteStyle
from prompt_toolkit.key_binding import KeyBindings
from prompt_toolkit.keys import Keys

from app.services.search.shot_search import (
    search_shots,
    get_shot_by_id,
)

from app.cli.helpers.hierarchy_builder import hierarchy_builder

from app.cli.ui.style import CLI_STYLE
from app.cli.ui.banner import print_header, print_line, print_hint

# Sentinel returned by the prompt session when F2 is pressed, distinct from
# both a normal completion result (str) and Escape's None.
_CREATE_HIERARCHY = object()


class _ShotCompleter(Completer):
    """Fuzzy-filters shots live as the user types, by delegating the actual
    matching to search_shots() (token-based LIKE search across shot/clip/
    scene/project names) rather than reimplementing fuzzy matching here.

    Each completion's display text is a rich, multi-field row (matching the
    original picker's layout); the *inserted* text is the shot name plus a
    visible "#<id>" suffix, used to resolve the selection back to the full
    shot dict after the prompt returns.
    """

    def __init__(self):
        self.lookup: dict[str, dict] = {}
        self.last_results: list[dict] = []

    def get_completions(self, document, complete_event):
        query = document.text_before_cursor

        results = search_shots(query)

        self.last_results = results

        for shot in results:
            number = (
                shot["shot_number"]
                if shot["shot_number"] is not None
                else "-"
            )

            label = f"{shot['shot_name']}  #{shot['shot_id']}"

            self.lookup[label] = shot

            display = (
                f"{shot['shot_id']} | {number} | {shot['shot_name']}"
            )

            display_meta = (
                f"{shot['project_name']}/"
                f"{shot['scene_name']}/"
                f"{shot['clip_name']}"
            )

            yield Completion(
                text=label,
                start_position=-len(query),
                display=display,
                display_meta=display_meta,
            )


def _build_key_bindings():

    kb = KeyBindings()

    @kb.add("escape", eager=True)
    def _cancel(event):
        event.app.exit(result=None)

    @kb.add(Keys.F2, eager=True)
    def _create_hierarchy(event):
        event.app.exit(result=_CREATE_HIERARCHY)

    @kb.add("enter")
    def _smart_enter(event):
        # If exactly one shot matches and the user hasn't explicitly
        # highlighted a row yet, accept it directly rather than requiring
        # an extra Up/Down press first. With 0 or 2+ matches, fall through
        # to normal behaviour (accept whatever's highlighted, or submit the
        # raw typed text if nothing is).
        buffer = event.app.current_buffer

        state = buffer.complete_state

        if (
            state is not None
            and state.current_completion is None
            and len(state.completions) == 1
        ):
            buffer.apply_completion(state.completions[0])

        buffer.validate_and_handle()

    return kb


def pick_shot():

    print_header("Search Shot")

    print_hint(
        "Type to filter, \u2191/\u2193 to highlight, [Enter] select \u2022 "
        "[F2] create hierarchy \u2022 [Esc] cancel"
    )

    completer = _ShotCompleter()

    kb = _build_key_bindings()

    session = PromptSession(
        message=HTML("<prompt>Search:</prompt> "),
        style=CLI_STYLE,
        completer=completer,
        complete_while_typing=True,
        complete_style=CompleteStyle.MULTI_COLUMN,
        key_bindings=kb,
    )

    while True:

        result = session.prompt()

        if result is None:
            return None

        if result is _CREATE_HIERARCHY:

            try:
                shot_id = hierarchy_builder()

            except KeyboardInterrupt:
                return None

            if shot_id:
                return get_shot_by_id(shot_id)

            # "Return To Search" (shot_id is None) -> loop back to search
            continue

        shot = completer.lookup.get(result)

        if shot:
            return shot

        # Free text that didn't match any completion (e.g. typed then hit
        # Enter without selecting from the dropdown) -> keep searching with
        # that text rather than exiting with a nonsense result.
        continue
