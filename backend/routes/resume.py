import os
import shutil
import json

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session

from database.connection import get_db
from models.resume import Resume
from services.resume_service import extract_resume_text
from services.resume_intelligence import analyze_resume


router = APIRouter(
    prefix="/resume",
    tags=["Resume"]
)


UPLOAD_DIR = "uploads"

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)


@router.post("/upload/{candidate_id}")
async def upload_resume(
    candidate_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    allowed_extensions = [".pdf", ".docx"]

    original_filename = file.filename or ""

    extension = os.path.splitext(
        original_filename
    )[1].lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are supported."
        )

    safe_filename = os.path.basename(
        original_filename
    )

    filename = (
        f"candidate_{candidate_id}_{safe_filename}"
    )

    file_path = os.path.join(
        UPLOAD_DIR,
        filename
    )

    try:

        # --------------------------------
        # 1. Save uploaded resume
        # --------------------------------

        with open(file_path, "wb") as buffer:

            shutil.copyfileobj(
                file.file,
                buffer
            )

        # --------------------------------
        # 2. Extract resume text
        # --------------------------------

        resume_text = extract_resume_text(
            file_path,
            safe_filename
        )

        if not resume_text.strip():

            raise HTTPException(
                status_code=400,
                detail="Could not extract text from the resume."
            )

        # --------------------------------
        # 3. Analyze resume
        # --------------------------------

        analysis = analyze_resume(
            resume_text
        )

        skills = analysis.get(
            "skills",
            []
        )

        projects = analysis.get(
            "projects",
            []
        )

        experience = analysis.get(
            "experience",
            ""
        )

        # --------------------------------
        # 4. Convert data for SQLite
        # --------------------------------

        skills_text = ", ".join(
            skills
        )

        projects_text = json.dumps(
            projects,
            ensure_ascii=False
        )

        # --------------------------------
        # 5. Check existing resume
        # --------------------------------

        existing_resume = (
            db.query(Resume)
            .filter(
                Resume.candidate_id == candidate_id
            )
            .first()
        )

        if existing_resume:

            existing_resume.filename = filename

            existing_resume.extracted_text = (
                resume_text
            )

            existing_resume.skills = (
                skills_text
            )

            existing_resume.projects = (
                projects_text
            )

            existing_resume.experience = (
                experience
            )

        else:

            new_resume = Resume(
                candidate_id=candidate_id,
                filename=filename,
                extracted_text=resume_text,
                skills=skills_text,
                projects=projects_text,
                experience=experience
            )

            db.add(
                new_resume
            )

        # --------------------------------
        # 6. Save database
        # --------------------------------

        db.commit()

        return {
            "message": "Resume uploaded and analyzed successfully",
            "candidate_id": candidate_id,
            "filename": filename,
            "analysis": {
                "skills": skills,
                "projects": projects,
                "experience": experience
            }
        }

    except HTTPException:

        raise

    except Exception as error:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Resume processing failed: {str(error)}"
        )


# ==================================================
# GET RESUME BY CANDIDATE ID
# ==================================================

@router.get("/candidate/{candidate_id}")
def get_candidate_resume(
    candidate_id: int,
    db: Session = Depends(get_db)
):

    resume = (
        db.query(Resume)
        .filter(
            Resume.candidate_id == candidate_id
        )
        .first()
    )

    if not resume:

        raise HTTPException(
            status_code=404,
            detail="Resume not found for this candidate."
        )

    # --------------------------------
    # Convert projects JSON string
    # back into Python list
    # --------------------------------

    try:

        projects = json.loads(
            resume.projects
        ) if resume.projects else []

    except json.JSONDecodeError:

        projects = []

    # --------------------------------
    # Convert skills string
    # back into Python list
    # --------------------------------

    skills = []

    if resume.skills:

        skills = [
            skill.strip()
            for skill in resume.skills.split(",")
            if skill.strip()
        ]

    return {
        "candidate_id": resume.candidate_id,
        "filename": resume.filename,
        "skills": skills,
        "projects": projects,
        "experience": resume.experience,
        "extracted_text": resume.extracted_text
    }

