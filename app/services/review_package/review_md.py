from pathlib import Path

from app.models import (
    Generation,
)


def write_review_template(
        review_dir: Path,
        generation: Generation,
):
    review_file = (
            review_dir
            / "review.md"
    )

    prompts = []

    if generation.prompt:
        prompts.append(
            (
                "Prompt",
                generation.prompt,
            )
        )

    if generation.negative_prompt:
        prompts.append(
            (
                "Negative Prompt",
                generation.negative_prompt,
            )
        )

    prompt_text = ""

    for role, text in prompts:
        prompt_text += (
            f"## {role}\n\n"
            f"{text}\n\n"
        )

    shot_id_string = f"{generation.shot.scene.number}.{generation.shot.clip.number}.{generation.shot.number}"
    hierarchy = f"{generation.shot.scene.name} → {generation.shot.clip.name} → {generation.shot.name}"

    review_file.write_text(
        f"""
# {generation.project.name}

## {shot_id_string} {generation.shot.name} - Generation ID: {generation.id}

**{hierarchy}**

Shot Description: {generation.shot.description}

---

# Workflow

{generation.workflow_name} | `{generation.workflow_type}` | `{generation.primary_model_name}` | `Seed: {generation.seed}`

`{generation.output_width}x{generation.output_height}` | `{generation.fps} FPS` | `{generation.duration_seconds} s`

`{generation.steps} steps` | `CFG {generation.cfg}` | `Sampler: {generation.sampler}` | `Scheduler: {generation.scheduler}`

---

# Prompts

{prompt_text}

---

# Intent


# Manual Review


""".strip(),
        encoding="utf-8",
    )