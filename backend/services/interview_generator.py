# ============================================================
# AI MOCK INTERVIEW — RESUME QUESTION GENERATOR
# ============================================================

import json
import os

from dotenv import load_dotenv
from openai import OpenAI

from services.resume_intelligence import extract_skills


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()


# ============================================================
# OPENAI CONFIGURATION
# ============================================================

OPENAI_API_KEY = os.getenv(
    "OPENAI_API_KEY"
)

OPENAI_MODEL = os.getenv(
    "OPENAI_INTERVIEW_MODEL",
    "gpt-4o-mini"
)


# ============================================================
# OPENAI CLIENT
# ============================================================

client = None

if OPENAI_API_KEY:

    client = OpenAI(
        api_key=OPENAI_API_KEY
    )

else:

    print(
        "WARNING: OPENAI_API_KEY was not found. "
        "Resume question generation will use fallback mode."
    )


# ============================================================
# CONFIGURATION
# ============================================================

MAX_RESUME_CHARS = 18000

QUESTION_COUNT = 5


# ============================================================
# FALLBACK QUESTION GENERATOR
# ============================================================

def generate_fallback_questions(
    resume_text: str,
    skill: str
):

    questions = []

    detected_skills = extract_skills(
        resume_text
    )

    # --------------------------------------------------------
    # Introduction
    # --------------------------------------------------------

    questions.append(
        "Tell me about yourself and walk me through "
        "the most important technical experience mentioned "
        "in your resume."
    )

    # --------------------------------------------------------
    # Primary skill
    # --------------------------------------------------------

    questions.append(
        f"You mentioned {skill} in your resume. "
        f"Describe a specific project or task where you "
        f"used {skill}, what you implemented, and what "
        f"technical challenges you faced."
    )

    # --------------------------------------------------------
    # Other skills
    # --------------------------------------------------------

    for detected_skill in detected_skills:

        if detected_skill.lower() == skill.lower():
            continue

        questions.append(
            f"Your resume mentions {detected_skill}. "
            f"Explain where you used {detected_skill}, "
            f"what you personally implemented, and why "
            f"you chose it."
        )

        if len(questions) >= 4:
            break

    # --------------------------------------------------------
    # Project
    # --------------------------------------------------------

    if "project" in resume_text.lower():

        questions.append(
            "Choose the most technically significant project "
            "from your resume. Explain its architecture, "
            "your specific contribution, the technologies "
            "you used, and the biggest technical challenge "
            "you solved."
        )

    # --------------------------------------------------------
    # Experience
    # --------------------------------------------------------

    if (
        "experience" in resume_text.lower()
        and len(questions) < QUESTION_COUNT
    ):

        questions.append(
            "Describe a difficult technical problem from "
            "your experience and explain how you analyzed "
            "and solved it."
        )

    # --------------------------------------------------------
    # Remove duplicates
    # --------------------------------------------------------

    unique_questions = []

    for question in questions:

        cleaned = question.strip()

        if (
            cleaned
            and cleaned not in unique_questions
        ):

            unique_questions.append(
                cleaned
            )

    return unique_questions[:QUESTION_COUNT]


# ============================================================
# AI RESUME QUESTION GENERATION
# ============================================================

def generate_resume_questions(
    resume_text: str,
    skill: str
):

    if not resume_text or not resume_text.strip():

        return []

    cleaned_resume = resume_text.strip()

    # --------------------------------------------------------
    # Limit resume size
    # --------------------------------------------------------

    if len(cleaned_resume) > MAX_RESUME_CHARS:

        cleaned_resume = (
            cleaned_resume[:MAX_RESUME_CHARS]
        )

    # --------------------------------------------------------
    # Detect skills
    # --------------------------------------------------------

    try:

        detected_skills = extract_skills(
            cleaned_resume
        )

    except Exception:

        detected_skills = []

    detected_skills_text = (
        ", ".join(detected_skills)
        if detected_skills
        else "Not available"
    )

    # ========================================================
    # IF OPENAI IS NOT AVAILABLE
    # ========================================================

    if client is None:

        print(
            "Using resume-aware fallback because "
            "OpenAI client is unavailable."
        )

        return generate_fallback_questions(
            cleaned_resume,
            skill
        )

    # ========================================================
    # AI INSTRUCTIONS
    # ========================================================

    instructions = """
You are an expert technical interviewer conducting a
realistic software-engineering interview.

Create personalized technical interview questions using
the candidate's actual resume.

STRICT REQUIREMENTS:

1. Questions MUST be based on information present in
   the resume.

2. The selected primary skill is the main technical focus.

3. Reference actual projects, technologies,
   responsibilities, or experience whenever possible.

4. NEVER invent a project, company, technology,
   responsibility, or experience.

5. Avoid generic textbook questions such as:
   "What is a variable in Python?"
   unless the resume specifically gives a reason
   for asking that question.

6. Prefer practical questions that test whether the
   candidate actually understands what they claim
   to have worked with.

7. Questions should progress from introductory to
   deeper technical questions.

8. At least two questions should directly reference
   concrete information from the resume whenever
   enough information exists.

9. Questions should be appropriate for a spoken
   technical interview.

10. Return exactly five questions.

11. Return ONLY valid JSON.
"""

    user_input = f"""
PRIMARY SKILL:
{skill}

DETECTED SKILLS:
{detected_skills_text}

CANDIDATE RESUME:
{cleaned_resume}
"""

    # ========================================================
    # OPENAI REQUEST
    # ========================================================

    try:

        response = client.responses.create(

            model=OPENAI_MODEL,

            instructions=instructions,

            input=user_input,

            store=False
        )

        # ----------------------------------------------------
        # Extract output
        # ----------------------------------------------------

        output_text = response.output_text

        if not output_text:

            raise ValueError(
                "OpenAI returned an empty response."
            )

        # ----------------------------------------------------
        # Parse JSON
        # ----------------------------------------------------

        data = json.loads(
            output_text
        )

        generated_questions = data.get(
            "questions",
            []
        )

        # ----------------------------------------------------
        # Validate
        # ----------------------------------------------------

        if not isinstance(
            generated_questions,
            list
        ):

            raise ValueError(
                "AI returned an invalid questions format."
            )

        cleaned_questions = []

        for question in generated_questions:

            if not isinstance(
                question,
                str
            ):

                continue

            cleaned = question.strip()

            if (
                cleaned
                and cleaned not in cleaned_questions
            ):

                cleaned_questions.append(
                    cleaned
                )

        if len(cleaned_questions) < QUESTION_COUNT:

            raise ValueError(
                "AI returned fewer than five questions."
            )

        return cleaned_questions[:QUESTION_COUNT]

    # ========================================================
    # FALLBACK
    # ========================================================

    except Exception as error:

        print(
            "WARNING: AI resume question generation failed:"
        )

        print(
            str(error)
        )

        print(
            "Using resume-aware fallback questions."
        )

        return generate_fallback_questions(
            cleaned_resume,
            skill
        )