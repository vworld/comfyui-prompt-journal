from html import escape

from prompt_toolkit import print_formatted_text
from prompt_toolkit import HTML

from app.cli.ui.style import CLI_STYLE


def _safe(value) -> str:
    """Escape a value for safe interpolation into an HTML() string.

    Without this, literal '<' / '>' in names, descriptions, paths, etc.
    get parsed as (invalid) style tags by prompt_toolkit and silently
    dropped instead of printed.
    """
    return escape(str(value))


def print_header(title: str) -> None:
    """Print a bold title followed by a rule sized to match it, e.g.

        Create Project
        --------------
    """
    print_formatted_text(
        HTML(f"\n<header>{_safe(title)}</header>"),
        style=CLI_STYLE,
    )

    print_formatted_text(
        HTML(f"<rule>{'-' * len(title)}</rule>\n"),
        style=CLI_STYLE,
    )


def print_kv(label: str, value) -> None:
    """Print a single 'Label: value' row with consistent styling."""

    print_formatted_text(
        HTML(f"<label>{_safe(label)}:</label> <value>{_safe(value)}</value>"),
        style=CLI_STYLE,
    )


def print_line(text: str = "") -> None:
    """Plain (unstyled) line, kept for blank-line / simple-message parity
    with the original print() calls."""

    if not text:
        print_formatted_text("")
        return

    print_formatted_text(HTML(_safe(text)), style=CLI_STYLE)


def print_error(text: str) -> None:
    print_formatted_text(
        HTML(f"<error>{_safe(text)}</error>"),
        style=CLI_STYLE,
    )


def print_success(text: str) -> None:
    print_formatted_text(
        HTML(f"<success>{_safe(text)}</success>"),
        style=CLI_STYLE,
    )


def print_hint(text: str) -> None:
    print_formatted_text(
        HTML(f"<hint>{_safe(text)}</hint>"),
        style=CLI_STYLE,
    )
