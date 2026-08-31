from sqlalchemy import Column, Integer, String, Text

from database.connection import Base


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)

    candidate_id = Column(Integer, nullable=False)

    filename = Column(String, nullable=False)

    extracted_text = Column(Text, nullable=False)

    skills = Column(Text, nullable=True)

    projects = Column(Text, nullable=True)

    experience = Column(Text, nullable=True)