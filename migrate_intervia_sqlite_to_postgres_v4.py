"""Copy INTERVIA's SQLite data into an existing, empty PostgreSQL schema.

Safe behavior:
- Never writes to or deletes from the SQLite source/backup.
- Requires the expected five PostgreSQL tables to exist and be empty.
- Verifies target columns and reconciles nullability with the actual SQLite schema.
- Copies rows and schema nullability adjustments in one PostgreSQL transaction.
- Verifies counts before and after commit, and resets generated-ID sequences.
"""
from __future__ import annotations

import getpass
import json
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

import psycopg
from psycopg.types.json import Json

ROOT = Path.cwd()
SQLITE_PATH = (ROOT / "backend" / "interview.db").resolve()
BACKUP_PATH = (ROOT / "backend" / "interview.db.pre-postgres.backup").resolve()

TABLE_COLUMNS = {
    "candidates": ["id", "name", "skill", "candidate_type"],
    "interview_sessions": [
        "id", "candidate_id", "skill", "interview_type", "total_questions", "status",
        "created_at", "question_started_at", "question_time_limit_seconds",
        "current_question_index", "suspicious_submission_count", "question_plan",
    ],
    "interviews": [
        "id", "candidate_id", "question", "answer", "score", "feedback", "session_id",
        "answered_at", "suspicious", "suspicious_reason",
    ],
    "resumes": ["id", "candidate_id", "filename", "extracted_text", "skills", "projects", "experience"],
    "users": ["id", "email", "password_hash", "name"],
}
DATETIME_COLUMNS = {
    "interview_sessions": {"created_at", "question_started_at"},
    "interviews": {"answered_at"},
}


def normalise_value(table: str, column: str, value):
    if value is None:
        return None
    if column in DATETIME_COLUMNS.get(table, set()):
        raw = str(value).strip()
        if not raw:
            return None
        try:
            dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        except ValueError as exc:
            raise ValueError(f"Cannot parse {table}.{column} datetime value: {raw!r}") from exc
        # SQLAlchemy's current models use timezone-naive DateTime columns.
        # If source data contains an offset, convert it to UTC and remove tzinfo.
        if dt.tzinfo is not None:
            dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
        return dt
    if table == "interviews" and column == "suspicious":
        return bool(value)
    if table == "interview_sessions" and column == "question_plan":
        if isinstance(value, (dict, list, int, float, bool)):
            return Json(value)
        raw = str(value).strip()
        if not raw:
            return None
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise ValueError("Found invalid JSON in interview_sessions.question_plan; migration stopped") from exc
        return Json(parsed)
    return value


def main() -> int:
    if not SQLITE_PATH.is_file():
        print(f"ERROR: SQLite database not found: {SQLITE_PATH}")
        return 2
    if not BACKUP_PATH.is_file():
        print(f"ERROR: SQLite safety backup not found: {BACKUP_PATH}")
        print("No changes made. Verify the backup before continuing.")
        return 2

    sqlite_uri = f"{SQLITE_PATH.as_uri()}?mode=ro"
    source_db = sqlite3.connect(sqlite_uri, uri=True)
    try:
        source_db.execute("BEGIN")
        present = {
            name: sql
            for name, sql in source_db.execute(
                "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
            ).fetchall()
        }
        if set(present) != set(TABLE_COLUMNS):
            print("ERROR: SQLite tables differ from the expected INTERVIA schema.")
            print(f"Expected: {sorted(TABLE_COLUMNS)}")
            print(f"Found:    {sorted(present)}")
            return 2

        source_rows: dict[str, list[tuple]] = {}
        source_counts: dict[str, int] = {}
        # Required/nullability state from the real SQLite schema. SQLite PRAGMA
        # table_info fields are: cid, name, type, notnull, default, pk.
        source_required: dict[str, dict[str, bool]] = {}
        for table, columns in TABLE_COLUMNS.items():
            source_info = source_db.execute(f'PRAGMA table_info("{table}")').fetchall()
            actual_columns = [r[1] for r in source_info]
            source_required[table] = {r[1]: bool(r[3] or r[5]) for r in source_info}
            if actual_columns != columns:
                print(f"ERROR: Unexpected SQLite column layout for {table}.")
                print(f"Expected: {columns}")
                print(f"Found:    {actual_columns}")
                return 2
            col_sql = ", ".join(f'"{c}"' for c in columns)
            rows = source_db.execute(f'SELECT {col_sql} FROM "{table}" ORDER BY id').fetchall()
            source_rows[table] = rows
            source_counts[table] = len(rows)

        print("INTERVIA SQLite -> PostgreSQL migration (schema/nullability-aware)")
        print(f"Source: {SQLITE_PATH}")
        print(f"Backup: {BACKUP_PATH}")
        print("Target: 127.0.0.1:5432 / intervia_db")
        print("SQLite source remains read-only.")
        print("\nSource row counts:")
        for table, count in source_counts.items():
            print(f"  {table}: {count}")

        password = getpass.getpass("PostgreSQL password for intervia_app: ")
        try:
            pg_db = psycopg.connect(
                host="127.0.0.1", port=5432, dbname="intervia_db",
                user="intervia_app", password=password,
            )
        except Exception as exc:
            print(f"ERROR: Could not connect to PostgreSQL: {exc}")
            return 3

        try:
            # Read-only preflight checks occur in psycopg's implicit transaction.
            with pg_db.cursor() as cur:
                cur.execute("""
                    SELECT table_name FROM information_schema.tables
                    WHERE table_schema='public' AND table_type='BASE TABLE'
                    ORDER BY table_name
                """)
                target_tables = {row[0] for row in cur.fetchall()}
                expected_tables = set(TABLE_COLUMNS)
                if not expected_tables.issubset(target_tables):
                    print("ERROR: One or more expected PostgreSQL tables are missing.")
                    print(f"Expected: {sorted(expected_tables)}")
                    print(f"Found:    {sorted(target_tables)}")
                    return 4

                # Capture target column nullability as well as names. The ORM-created
                # PostgreSQL schema can be stricter than the existing SQLite schema
                # (for example, old interview rows have answered_at=NULL).
                target_required: dict[str, dict[str, bool]] = {}
                for table, columns in TABLE_COLUMNS.items():
                    cur.execute("""
                        SELECT column_name, is_nullable FROM information_schema.columns
                        WHERE table_schema='public' AND table_name=%s
                        ORDER BY ordinal_position
                    """, (table,))
                    target_column_info = cur.fetchall()
                    target_columns = [row[0] for row in target_column_info]
                    target_required[table] = {row[0]: (row[1] == "NO") for row in target_column_info}
                    # PostgreSQL model-created tables can place columns in a
                    # different physical order than the migration's explicit
                    # INSERT column list. Compare names, not ordinal position.
                    if len(target_columns) != len(columns) or set(target_columns) != set(columns):
                        missing = sorted(set(columns) - set(target_columns))
                        extra = sorted(set(target_columns) - set(columns))
                        print(f"ERROR: PostgreSQL columns differ for {table}.")
                        print(f"Missing columns: {missing}")
                        print(f"Unexpected columns: {extra}")
                        print(f"Expected columns (order irrelevant): {columns}")
                        print(f"Found columns: {target_columns}")
                        print("No data inserted.")
                        return 4
                    cur.execute(f'SELECT COUNT(*) FROM public."{table}"')
                    count = cur.fetchone()[0]
                    if count != 0:
                        print(f"ERROR: PostgreSQL table {table} is not empty ({count} rows).")
                        print("Refusing to insert or overwrite data. No data inserted by this run.")
                        return 4

            # End the implicit read-only preflight transaction so the following
            # transaction is a top-level transaction (not a savepoint).
            pg_db.commit()

            try:
                # Align NOT NULL requirements with the existing SQLite schema
                # inside the same transaction as the data copy. This is necessary
                # because the original SQLite DB permits NULL in some columns,
                # while the model-created PostgreSQL tables may be stricter.
                nullability_changes = []
                for table, columns in TABLE_COLUMNS.items():
                    for column in columns:
                        source_is_required = source_required[table][column]
                        target_is_required = target_required[table][column]
                        if source_is_required != target_is_required:
                            nullability_changes.append((table, column, source_is_required, target_is_required))

                with pg_db.transaction():
                    with pg_db.cursor() as cur:
                        if nullability_changes:
                            print("\nAligning PostgreSQL column nullability with SQLite:")
                        for table, column, source_is_required, target_is_required in nullability_changes:
                            action = "SET NOT NULL" if source_is_required else "DROP NOT NULL"
                            print(f"  {table}.{column}: {action}")
                            cur.execute(
                                f'ALTER TABLE public."{table}" ALTER COLUMN "{column}" {action}'
                            )

                        for table, columns in TABLE_COLUMNS.items():
                            rows = source_rows[table]
                            if not rows:
                                continue
                            column_sql = ", ".join(f'"{c}"' for c in columns)
                            placeholders = ", ".join(["%s"] * len(columns))
                            insert_sql = f'INSERT INTO public."{table}" ({column_sql}) VALUES ({placeholders})'
                            values = [
                                tuple(normalise_value(table, col, val) for col, val in zip(columns, row))
                                for row in rows
                            ]
                            cur.executemany(insert_sql, values)

                        for table in TABLE_COLUMNS:
                            cur.execute(
                                "SELECT pg_get_serial_sequence(%s, 'id')",
                                (f"public.{table}",),
                            )
                            sequence = cur.fetchone()[0]
                            if sequence:
                                cur.execute(f'SELECT COALESCE(MAX(id), 0), COUNT(*) FROM public."{table}"')
                                maximum, count = cur.fetchone()
                                if count:
                                    cur.execute("SELECT setval(%s, %s, true)", (sequence, maximum))
                                else:
                                    cur.execute("SELECT setval(%s, 1, false)", (sequence,))

                        mismatches = []
                        for table, expected in source_counts.items():
                            cur.execute(f'SELECT COUNT(*) FROM public."{table}"')
                            actual = cur.fetchone()[0]
                            if actual != expected:
                                mismatches.append((table, expected, actual))
                        if mismatches:
                            raise RuntimeError(f"Row-count verification failed before commit: {mismatches}")

                # Transaction block above is top-level (preflight transaction committed),
                # so exiting it commits to PostgreSQL.
                print("\nSUCCESS: transaction committed.")
                print("PostgreSQL row counts after commit:")
                actual_counts = {}
                with pg_db.cursor() as cur:
                    for table in TABLE_COLUMNS:
                        cur.execute(f'SELECT COUNT(*) FROM public."{table}"')
                        actual_counts[table] = cur.fetchone()[0]
                        print(f"  {table}: {actual_counts[table]}")
                pg_db.commit()
                if actual_counts != source_counts:
                    print("ERROR: Post-commit counts do not match source counts.")
                    print("Do not switch DATABASE_URL; investigate before continuing.")
                    return 5
                print("\nVERIFIED: PostgreSQL counts match SQLite source counts.")
                print("The SQLite database and backup were not modified.")
                return 0
            except Exception as exc:
                pg_db.rollback()
                print(f"ERROR: PostgreSQL transaction failed and was rolled back: {exc}")
                return 5
        finally:
            pg_db.close()
    finally:
        source_db.rollback()
        source_db.close()


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\nCancelled by user; source SQLite database remains unchanged.")
        sys.exit(130)
