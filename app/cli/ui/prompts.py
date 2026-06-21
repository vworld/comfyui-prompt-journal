from prompt_toolkit import PromptSession
from prompt_toolkit import HTML

from app.cli.ui.style import CLI_STYLE
from app.cli.ui.banner import print_error


def _make_message(label: str) -> HTML:
    return HTML(f"<prompt>{label}: </prompt>")


def _fresh_session(label: str) -> PromptSession:
    # A new PromptSession per attempt, so each retry starts from a clean
    # (empty) buffer rather than relying on a single session's validator
    # to recover in place after a rejected line.
    return PromptSession(
        message=_make_message(label),
        style=CLI_STYLE,
    )


def text_prompt(label: str, *, required: bool = False, default: str = "") -> str:
    """Prompt for a single line of text.

    Mirrors the old `input(label).strip()` calls, but applies the shared
    style and, when required=True, re-prompts on an empty value instead of
    silently accepting it.

    Ctrl-C / Ctrl-D propagate as KeyboardInterrupt / EOFError so callers can
    let them bubble up to cancel the current flow, same as before.
    """

    while True:
        session = _fresh_session(label)

        value = session.prompt(default=default).strip()

        if required and not value:
            print_error("This field is required")
            continue

        return value


def int_prompt(label: str, *, required: bool = True) -> int | None:
    """Prompt for an integer, re-prompting on non-numeric input instead of
    raising ValueError like the original `int(input(...))` calls did.

    Returns None if the field is optional and left blank.
    """

    while True:
        session = _fresh_session(label)

        raw = session.prompt().strip()

        if not raw:
            if required:
                print_error("This field is required")
                continue

            return None

        if not raw.lstrip("-").isdigit():
            print_error("Please enter a whole number")
            continue

        return int(raw)


def choice_prompt(label: str, valid_choices) -> str:
    """Prompt for a short menu key (e.g. "1", "2", ... or "q"), re-prompting
    until the answer is one of `valid_choices`. Returns the raw matched
    choice string (not coerced to int), since menu keys are dict keys
    elsewhere, not necessarily numeric.
    """

    valid_choices = set(valid_choices)

    while True:
        session = _fresh_session(label)

        answer = session.prompt().strip()

        if answer in valid_choices:
            return answer

        print_error("Invalid option")


def confirm_prompt(label: str, *, default: bool = False) -> bool:
    """Yes/No prompt that defaults to `default` on an empty (Enter) answer,
    matching the original `input("...[y/N]: ")` behaviour.
    """

    suffix = "[Y/n]" if default else "[y/N]"

    session = _fresh_session(f"{label} {suffix}: ")

    answer = session.prompt().strip().lower()

    if not answer:
        return default

    return answer == "y"
