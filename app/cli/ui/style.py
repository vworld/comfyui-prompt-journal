from prompt_toolkit.styles import Style

# Single shared style so every screen in the CLI looks consistent.
# Class names are referenced via HTML tags in banner.py and prompts.py,
# e.g. <header>...</header>, and via style="class:label" kwargs on
# prompt_toolkit widgets.
CLI_STYLE = Style.from_dict(
    {
        "header": "bold",
        "rule": "#666666",
        "label": "bold cyan",
        "value": "",
        "error": "bold fg:red",
        "success": "bold fg:green",
        "hint": "fg:#888888 italic",
        "marker": "bold fg:cyan",
        "prompt": "bold",
    }
)
