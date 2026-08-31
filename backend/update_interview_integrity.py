import sqlite3


db = sqlite3.connect("interview.db")


# ============================================================
# UPDATE INTERVIEW_SESSIONS TABLE
# ============================================================

session_columns = [
    row[1]
    for row in db.execute(
        "PRAGMA table_info(interview_sessions)"
    ).fetchall()
]


if "suspicious_submission_count" not in session_columns:

    db.execute(
        """
        ALTER TABLE interview_sessions
        ADD COLUMN suspicious_submission_count INTEGER
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


if "suspicious" not in interview_columns:

    db.execute(
        """
        ALTER TABLE interviews
        ADD COLUMN suspicious BOOLEAN
        NOT NULL DEFAULT 0
        """
    )


if "suspicious_reason" not in interview_columns:

    db.execute(
        """
        ALTER TABLE interviews
        ADD COLUMN suspicious_reason TEXT
        """
    )


# ============================================================
# SAVE CHANGES
# ============================================================

db.commit()

db.close()


print(
    "Interview integrity database update completed successfully."
)