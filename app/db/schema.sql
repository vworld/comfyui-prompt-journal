CREATE TABLE project (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    name TEXT NOT NULL,

    project_type TEXT NOT NULL,

    description TEXT,

    added_on INTEGER NOT NULL
        DEFAULT (CAST(strftime('%s','now') AS INTEGER))
);

CREATE TABLE scene (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    project_id INTEGER NOT NULL,

    number INTEGER,

    name TEXT NOT NULL,

    description TEXT,

    comments TEXT,

    added_on INTEGER NOT NULL
        DEFAULT (CAST(strftime('%s','now') AS INTEGER)),

    FOREIGN KEY (project_id)
        REFERENCES project(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_scene_project_id
    ON scene(project_id);


CREATE TABLE clip (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    scene_id INTEGER NOT NULL,

    number INTEGER,

    name TEXT NOT NULL,

    description TEXT,

    comments TEXT,

    added_on INTEGER NOT NULL
        DEFAULT (CAST(strftime('%s','now') AS INTEGER)),

    FOREIGN KEY (scene_id)
        REFERENCES scene(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_clip_scene_id
    ON clip(scene_id);


CREATE TABLE shot (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    project_id INTEGER NOT NULL,

    scene_id INTEGER NOT NULL,

    clip_id INTEGER NOT NULL,

    number INTEGER,

    name TEXT NOT NULL,

    description TEXT,

    comments TEXT,

    added_on INTEGER NOT NULL
        DEFAULT (CAST(strftime('%s','now') AS INTEGER)),

    FOREIGN KEY (project_id)
        REFERENCES project(id),

    FOREIGN KEY (scene_id)
        REFERENCES scene(id),

    FOREIGN KEY (clip_id)
        REFERENCES clip(id)
);

CREATE INDEX idx_shot_project_id
    ON shot(project_id);

CREATE INDEX idx_shot_scene_id
    ON shot(scene_id);

CREATE INDEX idx_shot_clip_id
    ON shot(clip_id);


CREATE TABLE generation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    shot_id INTEGER,

    -- Workflow
    workflow_name TEXT,
    workflow_id TEXT,
    workflow_type TEXT,
    generation_time_seconds REAL,
    seed INTEGER,

    -- Extracted Generation Metadata
    requested_width INTEGER,
    requested_height INTEGER,
    output_width INTEGER,
    output_height INTEGER,
    fps INTEGER,
    frame_count INTEGER,
    duration_seconds REAL,
    sampler TEXT,
    scheduler TEXT,
    steps INTEGER,
    cfg REAL,
    primary_model_name TEXT,
    models_json TEXT,

    prompt TEXT,
    negative_prompt TEXT,
    all_prompts_json TEXT,

    input_files_count INTEGER,

    -- Human Review
    raw_intent TEXT,
    raw_review TEXT,

    cleaned_intent TEXT,
    cleaned_review TEXT,

    failure_description TEXT,
    suspected_causes TEXT,
    correction_strategy TEXT,

    -- Status
    accepted INTEGER NOT NULL DEFAULT 0,

    added_on INTEGER NOT NULL
        DEFAULT (CAST(strftime('%s','now') AS INTEGER)),

    FOREIGN KEY (project_id)
        REFERENCES project(id),

    FOREIGN KEY (shot_id)
        REFERENCES shot(id)
);

CREATE INDEX idx_generation_project_id
    ON generation(project_id);

CREATE INDEX idx_generation_shot_id
    ON generation(shot_id);

CREATE INDEX idx_generation_accepted
    ON generation(accepted);


CREATE TABLE asset (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- File Identity
    file_name TEXT,
    file_path TEXT,
    file_hash TEXT NOT NULL UNIQUE,
    archive_file_name TEXT,

    -- File Timestamps
    file_timestamp INTEGER,

    -- Media Metadata
    mime_type TEXT,
    file_size INTEGER,
    width INTEGER,
    height INTEGER,
    fps INTEGER,
    duration_seconds REAL,

    -- Optional Vision Description
    description TEXT,

    -- Raw Asset Metadata
    metadata_json TEXT,

    added_on INTEGER NOT NULL
        DEFAULT (CAST(strftime('%s','now') AS INTEGER))
);

CREATE INDEX idx_asset_hash
    ON asset(file_hash);

CREATE INDEX idx_asset_file_timestamp
    ON asset(file_timestamp);


CREATE TABLE generation_asset (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,
    generation_id INTEGER NOT NULL,
    -- first_image, last_image, output_video, output_image, etc
    role TEXT NOT NULL,

    FOREIGN KEY (asset_id)
        REFERENCES asset(id)
        ON DELETE CASCADE,

    FOREIGN KEY (generation_id)
        REFERENCES generation(id)
        ON DELETE CASCADE,

    UNIQUE (generation_id, asset_id)
);

CREATE INDEX idx_generation_asset_generation_id
    ON generation_asset(generation_id);

CREATE INDEX idx_generation_asset_asset_id
    ON generation_asset(asset_id);

CREATE INDEX idx_generation_asset_role
    ON generation_asset(role);