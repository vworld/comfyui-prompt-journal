import sqlite3
import subprocess
from datetime import datetime
from pathlib import Path
from shutil import which

from app.config.config import CONFIG

DB_PATH = Path(CONFIG["database_path"])
BACKUP_DIR = Path(CONFIG["database_backup_dir"])
SCHEMA_HISTORY_DIR = Path(CONFIG["schema_history"])
SCHEMA_FILE = CONFIG["base_dir"] / "app" / "db" / "schema.sql"


def create_db():
    return "Deprecated - use alembic migration"
    if not SCHEMA_FILE.exists():
        raise FileNotFoundError(SCHEMA_FILE)

    if DB_PATH.exists():
        print(f"Database already exists:\n{DB_PATH}")

        choice = input(
            "\nOptions:\n"
            "  1. Cancel\n"
            "  2. Backup and recreate\n"
            "  3. Recreate without backup\n"
            "\nChoice [1]: "
        ).strip()

        if choice in ("", "1"):
            print("Cancelled.")
            return

        if choice == "2":
            backup_path = backup_db()
            print(f"Backup created: {backup_path}")

        elif choice == "3":
            confirm = (
                input("DELETING existing database. Proceed? (y/N): ").strip().lower()
            )
            if confirm not in ("y", "yes"):
                return
        else:
            print("Invalid choice.")
            return

        DB_PATH.unlink()
        for suffix in ("-wal", "-shm"):
            path = Path(f"{DB_PATH}{suffix}")
            if path.exists():
                path.unlink()

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)

    try:
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        conn.execute("PRAGMA synchronous=NORMAL")

        with open(SCHEMA_FILE, encoding="utf-8") as f:
            conn.executescript(f.read())

        print(f"Database created: {DB_PATH}")

    finally:
        conn.close()


def backup_db() -> Path:
    if not DB_PATH.exists():
        raise FileNotFoundError(DB_PATH)

    BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    backup_path = BACKUP_DIR / f"{DB_PATH.stem}_{datetime.now():%Y%m%d_%H%M%S}.db"

    src = sqlite3.connect(DB_PATH)
    dst = sqlite3.connect(backup_path)

    try:
        src.backup(dst)
    finally:
        dst.close()
        src.close()

    return backup_path


def schema_export():
    """
    Export current database schema to schema.sql.

    Existing schema.sql is archived in schema_history first.
    """

    if not DB_PATH.exists():
        raise FileNotFoundError(f"Database not found: {DB_PATH}")

    SCHEMA_HISTORY_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    if SCHEMA_FILE.exists():
        history_file = SCHEMA_HISTORY_DIR / f"schema_{datetime.now():%Y%m%d_%H%M%S}.sql"

        SCHEMA_FILE.replace(history_file)

        print(f"Archived schema: {history_file}")

    if which("sqlite3") is None:
        raise RuntimeError("sqlite3 command not found in PATH")

    result = subprocess.run(
        ["sqlite3", str(DB_PATH), ".schema"],
        capture_output=True,
        text=True,
        check=True,
    )

    with open(SCHEMA_FILE, "w", encoding="utf-8") as f:
        f.write("-- AUTO-GENERATED FROM DATABASE\n")
        f.write(f"-- Generated: {datetime.now().isoformat()}\n\n")
        f.write(result.stdout)

    print(f"Schema exported to: {SCHEMA_FILE}")
