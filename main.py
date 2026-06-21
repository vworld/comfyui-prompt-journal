# main.py

from app.cli.menu import start_cli
from app.cli.misc_utils.db import create_db, backup_db, schema_export
from app.cli.misc_utils.metadata_inspect import inspect_file_metadata

"""
Commands
 - db-create
 - db-backup
 - schema-export
 - metadata-inspect <file-path>
 - start
"""

import argparse


def main():
    parser = argparse.ArgumentParser(
        description="ConfyUI Prompt Journal\n\nArgument List."
    )
    subparsers = parser.add_subparsers(dest="command")

    subparsers.add_parser(
        "db-create",
        help="Create database",
        description="Create a new database from schema.sql",
    )
    subparsers.add_parser(
        "db-backup",
        help="Backup Database",
        description="Create a timestamped backup of the database",
    )
    subparsers.add_parser(
        "schema-export",
        help="export DDL from schema",
        description="Export the current database schema to schema.sql. Once exported, previous schema is backed up and this becomes the active one. Changing DB is not enough, models should be updated too.", )

    subparsers.add_parser(
        "start",
        help="show main menu",
        description="The main app that handles the reviews"
    )

    subparsers.add_parser("metadata-inspect")

    args = parser.parse_args()

    if args.command == "db-create":
        create_db()
    elif args.command == "db-backup":
        backup_db()
    elif args.command == "schema-export":
        schema_export()
    elif args.command == "metadata-inspect":
        inspect_file_metadata()
    else:
        start_cli()


if __name__ == "__main__":
    main()
