from sqlalchemy import Column, Integer, String

from database.connection import Base


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    skill = Column(String, nullable=False)
    candidate_type = Column(
        String,
        nullable=False,
        default="technical"
    )