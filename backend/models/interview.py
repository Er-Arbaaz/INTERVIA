from sqlalchemy import Column, Integer, Text, DateTime, Boolean
from datetime import datetime

from database.connection import Base


class Interview(Base):
    __tablename__ = "interviews"

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

    session_id = Column(
        Integer,
        nullable=True,
        index=True
    )

    question = Column(
        Text,
        nullable=False
    )

    answer = Column(
        Text,
        nullable=False
    )

    score = Column(
        Integer,
        nullable=False
    )

    feedback = Column(
        Text,
        nullable=False
    )

    # ========================================================
    # ANSWER TIMING
    # ========================================================

    answered_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    # ========================================================
    # INTERVIEW INTEGRITY
    # ========================================================

    suspicious = Column(
        Boolean,
        nullable=False,
        default=False
    )

    suspicious_reason = Column(
        Text,
        nullable=True
    )