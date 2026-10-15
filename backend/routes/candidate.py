from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.connection import get_db
from models.candidate import Candidate
from schemas.candidate import Candidate as CandidateSchema

router = APIRouter()


@router.post("/candidate")
def create_candidate(
    candidate: CandidateSchema,
    db: Session = Depends(get_db)
):
    new_candidate = Candidate(
        name=candidate.name,
        skill=candidate.skill,
        candidate_type=candidate.candidate_type
    )

    db.add(new_candidate)
    db.commit()
    db.refresh(new_candidate)

    return {
        "message": "Candidate Registered Successfully",
        "id": new_candidate.id,
        "name": new_candidate.name,
        "skill": new_candidate.skill,
        "candidate_type": new_candidate.candidate_type
    }


@router.get("/candidates")
def get_candidates(
    db: Session = Depends(get_db)
):
    return db.query(Candidate).all()