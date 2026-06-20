# Prompt Archive System - Review Package Workflow (Current Implementation Plan)

## Purpose

Create a review package from a generated media file.

The review package is later reviewed manually and analyzed by an LLM.

The generation and asset records are created before review begins.

The review phase updates existing database records rather than creating new ones.

---

## High Level Workflow

```text
Output File
    ↓
Extract Metadata
    ↓
Resolve Referenced Input Files
    ↓
Compute Hashes
    ↓
Duplicate Check
    ↓
Select/Create Shot
    ↓
Show Summary
    ↓
User Confirmation
    ↓
Create Generation Record
    ↓
Create Asset Records
    ↓
Archive New Assets
    ↓
Create GenerationAsset Records
    ↓
Create Review Package
    ↓
Manual Review
    ↓
LLM Analysis
    ↓
Import Review Package
    ↓
Update Existing Generation
    ↓
Archive Review Package
    ↓
Delete Review Package
```

---

## Create Review Package

### Input

User supplies:

```text
Output Media File
```

Example:

```text
Wan2.2_i2v_00001_.mp4
```

---

### Metadata Extraction

Use existing metadata extractor.

Input:

```text
Output media file
```

Output:

```json
{
  "workflow_name": "",
  "workflow_id": "",
  "workflow_type": "",
  "prompt": "",
  "negative_prompt": "",
  "all_prompts": [],
  "requested_width": 0,
  "requested_height": 0,
  "output_width": 0,
  "output_height": 0,
  "fps": 0,
  "frame_count": 0,
  "duration_seconds": 0,
  "seed": 0,
  "sampler": "",
  "scheduler": "",
  "steps": 0,
  "cfg": 0,
  "primary_model": {},
  "models": [],
  "input_assets": [],
  "_raw": {}
}
```

Required fields:

```text
workflow_id
prompt
all_prompts
```

Everything else can be null.

A successful extraction is one that has at least the required fields.

If extraction fails, inform user and abort.

---

### Input Asset Resolution

Resolve all referenced input assets.

Example:

```json
[
  {
    "role": "first_frame",
    "value": "river.png"
  }
]
```

becomes:

```text
/full/path/to/river.png
```

Missing input assets:

```text
Abort package creation
Inform user
```

---

### Hash Calculation

Compute SHA256 hashes for:

```text
Output file
Resolved input files
```

---

### Duplicate Detection

Check output file hash.

Query:

```text
asset.file_hash
```

Rules:

```text
Matching output hash
    → Abort package creation
```

Input asset hash duplication is allowed.

---

### Shot Selection

User searches existing shots.

Search fields:

```text
shot.name
shot.number

clip.name
scene.name
project.name
```

Display format:

```text
12 | S010 | River Establishing | Project/Scene/Clip
27 | S011 | River Fish Closeup | Project/Scene/Clip
```

Search should be incremental (no Enter required).

Suggested library:

```text
prompt-toolkit
```

---

### Hierarchy Creation

If no shot exists:

```text
Project
Scene
Clip
Shot
```

may be created without leaving the Create Review Package workflow.

Every generation belongs to a shot.

For experiments, users may create dedicated projects and shots as needed.

---

### Summary Screen

Display:

```text
Output File
Workflow Name
Workflow Type
Duration
Resolution
Input File Count
Selected Shot
```

Then ask:

```text
Continue? (Y/N)
```

---

### Database Creation

After confirmation:

```text
Create Generation record
Create Asset records
Archive New Assets
Create GenerationAsset records
```

At this stage:

```text
Generation exists
Assets exist
Assets archived
Review not yet completed
```

---

### Generation Creation

Populate:

```text
project_id
shot_id

workflow_name
workflow_id
workflow_type

seed

requested_width
requested_height

output_width
output_height

fps
frame_count
duration_seconds

sampler
scheduler

steps
cfg

primary_model_name

models_json

prompt
negative_prompt
all_prompts_json

input_files_count
```

Review fields remain empty.

---

### Asset Creation

For each input asset:

```text
Hash lookup

Exists
    → Reuse Asset

Missing
    → Create Asset
```

For newly created assets:

```text
Copy file into archive
Assign archive_file_name
```

For reused assets:

```text
Reuse existing archive_file_name
```

Output asset will always be unique or package creation would already have been aborted.

Create Asset record for:

```text
Output asset
All resolved input assets
```

Archive filename format:

```text
<asset_id>_<orig_file_name>.ext
```

Store:

```text
file_name
file_path
file_hash

archive_file_name

file_timestamp

mime_type
file_size

width
height

fps
duration_seconds

metadata_json
```

---

### Asset Reuse

If asset hash already exists:

```text
Do not create Asset
Reuse existing Asset
```

Still create:

```text
GenerationAsset
```

for the current generation.

---

### GenerationAsset Creation

One row per generation asset usage.

Examples:

```text
output_video
output_image

first_frame
last_frame

input_image
input_video
input_audio
```

Rules:

```text
One asset
One role
Per generation
```

Constraint:

```text
UNIQUE(generation_id, asset_id)
```

---

## Review Package Structure

```text
review_<generation_id>/

    manifest.json
    llm_context.json
    review.md

    output.mp4
    input.png

    warnings.json
```

All assets are copied into the review package from the archive.

Files inside the review package use:

```text
archive_file_name
```

---

### manifest.json

Purpose:

```text
Import orchestration
```

Contains:

```json
{
  "generation_id": 123,
  "shot_id": 4,
  "output_file": "output.mp4",
  "output_hash": "",
  "input_files": [
    {
      "file_name": "",
      "hash": ""
    }
  ],
  "created_on": 0
}
```

`shot_id` is mutable.

If changed before import:

```text
Validate
Confirm
Update Generation
```

---

### llm_context.json

Purpose:

```text
LLM analysis input
```

Contains:

```json
{
  "generation_id": 123,
  "output_file": "output.mp4",
  "workflow_name": "",
  "workflow_type": "",
  "all_prompts": [],
  "duration_seconds": 0,
  "fps": 0,
  "input_files": []
}
```

---

### review.md

Template:

```markdown
# Intent

# Manual Review
```

Rules:

```text
Headings must match exactly.

Everything between:

# Intent

and

# Manual Review

belongs to Intent.

Everything after:

# Manual Review

belongs to Review.
```

User edits manually.

---

### llm_output.json

Generated externally.

Must contain:

```json
{
  "generation_id": 123,
  "cleaned_intent": "",
  "cleaned_review": "",
  "failure_description": "",
  "suspected_causes": "",
  "correction_strategy": ""
}
```

---

### warnings.json

Purpose:

```text
Store warnings and non-fatal issues.
```

```json
[
  {
    "type": "",
    "severity": "info|warning|error",
    "message": ""
  }
]
```

---

## Import Review Package

Input:

```text
Review Package Directory
```

Required files:

```text
manifest.json
llm_context.json
review.md
llm_output.json

<all asset files>
```

---

### Validation

Validate:

```text
Generation exists

manifest.json generation_id matches database

llm_context.json generation_id matches database

llm_output.json generation_id matches database

Required files exist

JSON parses correctly
```

---

### Generation Update

Update:

```text
raw_intent
raw_review

cleaned_intent
cleaned_review

failure_description
suspected_causes
correction_strategy
```

If manifest shot_id differs from database:

```text
Locate new shot

If not found
    → Fail

Confirm update

Update:
    shot_id
    project_id
```

Project is always derived from the selected shot.

---

### Review Archive

Asset files are already archived during review package creation.

Import does not move media files.

Archive structure:

```text
media/
    archived asset files

reviews/
    <generation_id>.zip
```

Zip contains:

```text
manifest.json
review.md
llm_context.json
llm_output.json
warnings.json
```

---

## Cleanup

After successful import:

```text
Delete review package
```

If import fails:

```text
Keep review package
No deletion
```

---

