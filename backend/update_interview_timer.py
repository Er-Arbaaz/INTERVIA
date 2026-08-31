import sqlite3


db = sqlite3.connect("interview.db")


# ============================================================
# UPDATE INTERVIEW SESSIONS TABLE
# ============================================================

session_columns = [
    row[1]
    for row in db.execute(
        "PRAGMA table_info(interview_sessions)"
    ).fetchall()
]


if "question_started_at" not in session_columns:

    db.execute(
        """
        ALTER TABLE interview_sessions
        ADD COLUMN question_started_at DATETIME
        """
    )


if "question_time_limit_seconds" not in session_columns:

    db.execute(
        """
        ALTER TABLE interview_sessions
        ADD COLUMN question_time_limit_seconds INTEGER
        NOT NULL DEFAULT 60
        """
    )


if "current_question_index" not in session_columns:

    db.execute(
        """
        ALTER TABLE interview_sessions
        ADD COLUMN current_question_index INTEGER
        NOT NULL DEFAULT 0
        """
    )


# ============================================================
# UPDATE INTERVIEWS TABLE
# ============================================================

interview_columns = [
    row[1]
    for row in db.execute(
        "PRAGMA table_info(interviews)"
    ).fetchall()
]


if "answered_at" not in interview_columns:

    db.execute(
        """
        ALTER TABLE interviews
        ADD COLUMN answered_at DATETIME
        """
    )


# ============================================================
# SAVE CHANGES
# ============================================================

db.commit()

db.close()


print("Interview timer database update completed successfully.")