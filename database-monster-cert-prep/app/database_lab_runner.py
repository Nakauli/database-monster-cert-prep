"""SQLite lab setup and execution helpers."""

from __future__ import annotations

import shutil
import sqlite3
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DB = ROOT / "data" / "sample_school_database.db"
SETUP_SQL = ROOT / "labs" / "setup_sample_database.sql"


def reset_database(database_path: Path = DEFAULT_DB) -> None:
    database_path.parent.mkdir(parents=True, exist_ok=True)
    if database_path.exists():
        database_path.unlink()
    with sqlite3.connect(database_path) as connection:
        connection.executescript(SETUP_SQL.read_text(encoding="utf-8"))
        connection.commit()


def copy_practice_database(destination: Path) -> Path:
    if not DEFAULT_DB.exists():
        reset_database()
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(DEFAULT_DB, destination)
    return destination


def _statements(script: str) -> list[str]:
    statements: list[str] = []
    buffer = ""
    for line in script.splitlines():
        buffer += line + "\n"
        if sqlite3.complete_statement(buffer):
            if buffer.strip():
                statements.append(buffer.strip())
            buffer = ""
    if buffer.strip():
        statements.append(buffer.strip())
    return statements


def run_sql_file(
    sql_path: Path,
    database_path: Path = DEFAULT_DB,
    stop_on_error: bool = True,
) -> list[dict[str, Any]]:
    if "mysql" in sql_path.name.lower():
        raise ValueError("This is a MySQL reference lab and cannot run in SQLite.")
    results: list[dict[str, Any]] = []
    with sqlite3.connect(database_path) as connection:
        connection.execute("PRAGMA foreign_keys = ON")
        for number, statement in enumerate(_statements(sql_path.read_text(encoding="utf-8")), start=1):
            compact = " ".join(
                line.strip() for line in statement.splitlines()
                if line.strip() and not line.lstrip().startswith("--")
            )
            if not compact:
                continue
            try:
                cursor = connection.execute(statement)
                rows = cursor.fetchall() if cursor.description else []
                columns = [item[0] for item in cursor.description] if cursor.description else []
                results.append(
                    {
                        "statement_number": number,
                        "statement": compact[:160],
                        "columns": columns,
                        "rows": rows,
                        "rowcount": cursor.rowcount,
                    }
                )
            except sqlite3.Error as error:
                results.append(
                    {
                        "statement_number": number,
                        "statement": compact[:160],
                        "error": str(error),
                    }
                )
                if stop_on_error:
                    raise
        if connection.in_transaction:
            connection.commit()
    return results

