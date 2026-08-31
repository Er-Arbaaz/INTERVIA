from sqlalchemy import Column, Integer, String, DateTime, JSON
from datetime import datetime

from database.connection import Base


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    candidate_id = Column(
        Integer,
        nullable=False,
        index=True
    )

    skill = Column(
        String,
        nullable=False
    )

    interview_type = Column(
        String,
        nullable=False
    )

    total_questions = Column(
        Integer,
        nullable=False,
        default=0
    )

    status = Column(
        String,
        nullable=False,
        default="started"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    # ========================================================
    # STORED INTERVIEW QUESTION PLAN
    # ========================================================

    question_plan = Column(
        JSON,
        nullable=True
    )

    # ========================================================
    # INTERVIEW TIMER
    # ========================================================

    question_started_at = Column(
        DateTime,
        nullable=True
    )

    question_time_limit_seconds = Column(
        Integer,
        nullable=False,
        default=60
    )

    current_question_index = Column(
        Integer,
        nullable=False,
        default=0
    )

    # ========================================================
    # INTERVIEW INTEGRITY
    # ========================================================

    suspicious_submission_count = Column(
        Integer,
        nullable=False,
        default=0
    )