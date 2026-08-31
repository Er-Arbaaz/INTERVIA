from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from database.connection import get_db
from models.interview import Interview
from models.interview_session import InterviewSession
from models.resume import Resume

from services.ai_service import evaluate_answer, get_adaptive_difficulty
from services.interview_generator import generate_resume_questions


router = APIRouter()


# ============================================================
# CONFIGURATION
# ============================================================

QUESTION_TIME_LIMIT_SECONDS = 60
TOTAL_QUESTIONS = 20
TOTAL_INTERVIEW_TIME_SECONDS = 20 * 60

TECHNICAL_QUESTION_COUNT = 12
PROGRAMMING_QUESTION_COUNT = 4
APTITUDE_QUESTION_COUNT = 4

SUSPICIOUS_FAST_SUBMISSION_SECONDS = 5


# ============================================================
# QUESTION BANKS
# ============================================================

questions = {
    "Python": [
        "What is the difference between a list and a tuple in Python?",
        "Explain object-oriented programming in Python.",
        "What are decorators in Python?",
        "What is the difference between shallow copy and deep copy?",
    ],
    "Java": [
        "What is the difference between JDK, JRE and JVM?",
        "Explain inheritance in Java.",
        "What is method overloading and overriding?",
        "What is the difference between an interface and an abstract class?",
    ],
    "JavaScript": [
        "What is the difference between let, const and var?",
        "Explain closures in JavaScript.",
        "What is the difference between == and ===?",
        "Explain the JavaScript event loop.",
    ],
}


adaptive_questions = {
    "Python": {
        "easier": [
            "What is a variable in Python?",
            "What is the difference between a list and a tuple in Python?",
            "What is the purpose of indentation in Python?",
            "What is the difference between a for loop and a while loop in Python?",
            "What is a dictionary in Python and how is it different from a list?",
            "What is the purpose of the len() function in Python?",
            "What is the difference between == and is in Python?",
        ],
        "same": [
            "Explain object-oriented programming in Python.",
            "What are decorators in Python?",
            "What is the difference between shallow copy and deep copy?",
            "What is exception handling in Python and how does try-except work?",
            "Explain list comprehensions and give a practical use case.",
            "What are lambda functions in Python?",
            "Explain the difference between *args and **kwargs.",
        ],
        "harder": [
            "How does Python manage memory and what role does garbage collection play?",
            "Explain Python generators and the yield keyword. When would you use them?",
            "What are Python context managers and how would you create one?",
            "Explain the difference between multiprocessing, multithreading, and asyncio.",
            "How does Python's GIL affect CPU-bound and I/O-bound applications?",
            "Explain how dictionaries are implemented conceptually and why key lookup is usually fast.",
            "How would you design a scalable Python service that handles many concurrent requests?",
        ],
    },

    "Java": {
        "easier": [
            "What is the difference between a class and an object in Java?",
            "What is the difference between JDK, JRE and JVM?",
            "What is a constructor in Java?",
            "What is inheritance in Java?",
            "What are primitive data types in Java?",
            "What is the difference between == and equals() in Java?",
            "What is the purpose of the static keyword in Java?",
        ],
        "same": [
            "Explain inheritance in Java.",
            "What is method overloading and overriding?",
            "What is the difference between an interface and an abstract class?",
            "Explain exception handling in Java.",
            "What is encapsulation and why is it useful?",
            "Explain the difference between ArrayList and LinkedList.",
            "What are access modifiers in Java?",
        ],
        "harder": [
            "Explain the Java memory model and how garbage collection works.",
            "What is the difference between HashMap and ConcurrentHashMap, and when would you use each?",
            "Explain Java multithreading, synchronization, and race conditions.",
            "How does the Java Stream API work and when can it improve application design?",
            "Explain the difference between checked and unchecked exceptions and when to use each.",
            "How does Java handle object references and garbage collection?",
            "How would you design a thread-safe Java service handling concurrent requests?",
        ],
    },

    "JavaScript": {
        "easier": [
            "What is the difference between let, const and var?",
            "What is a function in JavaScript?",
            "What is the difference between null and undefined?",
            "What is an array in JavaScript?",
            "What is an object in JavaScript?",
            "What is the difference between == and ===?",
            "What is the purpose of the map() method?",
        ],
        "same": [
            "Explain closures in JavaScript.",
            "What is the difference between == and ===?",
            "Explain the JavaScript event loop.",
            "What is the difference between synchronous and asynchronous JavaScript?",
            "Explain promises in JavaScript.",
            "What are callbacks and why can excessive nesting be a problem?",
            "Explain destructuring assignment in JavaScript.",
        ],
        "harder": [
            "Explain the JavaScript event loop in detail, including microtasks and macrotasks.",
            "How do promises, async/await, and the event loop work together in JavaScript?",
            "Explain prototypal inheritance and how JavaScript resolves properties through the prototype chain.",
            "How would you optimize a JavaScript application with expensive rendering and asynchronous operations?",
            "Explain debouncing and throttling and give practical use cases.",
            "What are memory leaks in JavaScript and how can they be detected or prevented?",
            "How would you structure a large JavaScript application for maintainability and performance?",
        ],
    },
}


programming_questions = {
    "Python": [
        "Write or explain a Python approach to find the first non-repeating character in a string.",
        "How would you determine whether a string is a palindrome in Python? Explain the time complexity.",
        "Given a list of integers, how would you find the second-largest distinct value in Python?",
        "How would you remove duplicate values from a list while preserving the original order?",
    ],
    "Java": [
        "Write or explain a Java approach to find the first non-repeating character in a string.",
        "How would you determine whether a string is a palindrome in Java? Explain the time complexity.",
        "Given an integer array, how would you find the second-largest distinct value in Java?",
        "How would you remove duplicate values from an array or list while preserving the original order?",
    ],
    "JavaScript": [
        "Write or explain a JavaScript approach to find the first non-repeating character in a string.",
        "How would you determine whether a string is a palindrome in JavaScript? Explain the time complexity.",
        "Given an array of integers, how would you find the second-largest distinct value in JavaScript?",
        "How would you remove duplicate values from an array while preserving the original order?",
    ],
}


aptitude_questions = [
    "A product costs ₹800 and is sold at a 15% profit. What is its selling price?",
    "The ratio of two numbers is 3:5 and their sum is 64. What are the two numbers?",
    "A train travels 240 km in 4 hours. What is its average speed in km/h?",
    "Find the next number in the series: 2, 6, 12, 20, 30, ?",
    "If 5 workers complete a task in 12 days at the same rate, how many days would 10 workers take?",
    "A number is increased by 20% and then decreased by 20%. What is the net percentage change?",
    "If the probability of an event is 0.25, what is the probability that the event does not occur?",
    "A clock shows 3:00. What is the angle between the hour and minute hands?",
    "If A can complete a job in 10 days and B in 15 days, how long will they take together?",
    "Find the odd one out: 3, 5, 11, 14, 17, 23.",
    "A bag contains 5 red and 3 blue balls. What is the probability of drawing a blue ball?",
    "If 40% of a number is 72, what is the number?",
]


# ============================================================
# HELPERS
# ============================================================

def normalize_questions(items):
    result = []
    seen = set()

    for item in items or []:
        if not item:
            continue

        question = str(item).strip()

        if not question:
            continue

        key = question.lower()

        if key in seen:
            continue

        seen.add(key)
        result.append(question)

    return result


def get_answered_questions(
    db: Session,
    candidate_id: int,
    session_id: int
):
    rows = (
        db.query(Interview.question)
        .filter(
            Interview.session_id == session_id,
            Interview.candidate_id == candidate_id
        )
        .all()
    )

    return [
        row[0]
        for row in rows
        if row and row[0]
    ]


def get_next_adaptive_question(
    skill: str,
    difficulty: str,
    answered_questions: list[str]
):
    skill_bank = adaptive_questions.get(skill)

    if not skill_bank:
        return None

    answered = {
        str(question).strip().lower()
        for question in answered_questions
        if question
    }

    difficulty = (
        difficulty
        if difficulty in {"easier", "same", "harder"}
        else "same"
    )

    search_order = [
        difficulty,
        "same",
        "harder",
        "easier",
    ]

    used_levels = set()

    for level in search_order:
        if level in used_levels:
            continue

        used_levels.add(level)

        for question in skill_bank.get(level, []):
            if question.strip().lower() not in answered:
                return question

    return None


def get_programming_question(
    skill: str,
    question_number: int,
    answered_questions: list[str]
):
    bank = programming_questions.get(skill, [])

    answered = {
        str(question).strip().lower()
        for question in answered_questions
        if question
    }

    for question in bank:
        if question.strip().lower() not in answered:
            return question

    return None


def get_aptitude_question(
    question_number: int,
    answered_questions: list[str]
):
    answered = {
        str(question).strip().lower()
        for question in answered_questions
        if question
    }

    if not aptitude_questions:
        return None

    start_index = (
        question_number
        - (
            TECHNICAL_QUESTION_COUNT
            + PROGRAMMING_QUESTION_COUNT
        )
        - 1
    ) % len(aptitude_questions)

    for offset in range(len(aptitude_questions)):
        index = (
            start_index + offset
        ) % len(aptitude_questions)

        question = aptitude_questions[index]

        if question.strip().lower() not in answered:
            return question

    return None


# ============================================================
# RESUME QUESTION PLAN
# ============================================================

def build_resume_question_plan(
    resume_text: str,
    skill: str
):
    """
    Generates the complete resume-aware interview plan.

    IMPORTANT:
    This function should ONLY be called when starting
    a new resume-based interview.

    The returned plan is saved into InterviewSession.question_plan
    and reused for the remainder of the interview.
    """

    generated = generate_resume_questions(
        resume_text,
        skill
    ) or []

    cleaned = normalize_questions(generated)

    technical = cleaned[:TECHNICAL_QUESTION_COUNT]

    seen = {
        question.lower()
        for question in technical
    }

    # --------------------------------------------------------
    # Resume AI fallback
    # --------------------------------------------------------

    if len(technical) < TECHNICAL_QUESTION_COUNT:

        for difficulty in (
            "easier",
            "same",
            "harder"
        ):

            for question in adaptive_questions.get(
                skill,
                {}
            ).get(difficulty, []):

                key = question.lower()

                if key in seen:
                    continue

                seen.add(key)
                technical.append(question)

                if (
                    len(technical)
                    >= TECHNICAL_QUESTION_COUNT
                ):
                    break

            if (
                len(technical)
                >= TECHNICAL_QUESTION_COUNT
            ):
                break

    # --------------------------------------------------------
    # Programming
    # --------------------------------------------------------

    programming = programming_questions.get(
        skill,
        []
    )[:PROGRAMMING_QUESTION_COUNT]

    # --------------------------------------------------------
    # Aptitude
    # --------------------------------------------------------

    aptitude = aptitude_questions[
        :APTITUDE_QUESTION_COUNT
    ]

    # --------------------------------------------------------
    # Complete 20-question plan
    # --------------------------------------------------------

    plan = (
        technical[:TECHNICAL_QUESTION_COUNT]
        + programming
        + aptitude
    )

    return plan[:TOTAL_QUESTIONS]


def get_standard_question_at_position(
    skill: str,
    position: int,
    answered_questions: list[str],
    difficulty: str = "same"
):
    """
    position is zero-based.

    0-11  = technical
    12-15  = programming
    16-19  = aptitude
    """

    if position < TECHNICAL_QUESTION_COUNT:

        return get_next_adaptive_question(
            skill,
            difficulty,
            answered_questions
        )

    if position < (
        TECHNICAL_QUESTION_COUNT
        + PROGRAMMING_QUESTION_COUNT
    ):

        return get_programming_question(
            skill,
            position + 1,
            answered_questions
        )

    return get_aptitude_question(
        position + 1,
        answered_questions
    )


# ============================================================
# START INTERVIEW
# ============================================================

@router.get("/interview/start/{skill}")
def start_interview(
    skill: str,
    candidate_id: int | None = None,
    db: Session = Depends(get_db)
):
    matched_skill = None

    for available_skill in questions.keys():

        if available_skill.lower() == skill.lower():

            matched_skill = available_skill
            break

    if not matched_skill:

        raise HTTPException(
            status_code=400,
            detail={
                "message": "Skill not supported.",
                "available_skills": list(
                    questions.keys()
                )
            }
        )

    # ========================================================
    # LOAD RESUME
    # ========================================================

    resume = None

    if candidate_id is not None:

        resume = (
            db.query(Resume)
            .filter(
                Resume.candidate_id == candidate_id
            )
            .first()
        )

    # ========================================================
    # DEFAULT INTERVIEW CONFIGURATION
    # ========================================================

    interview_type = "standard"
    generated_questions = []

    # ========================================================
    # FIX A
    #
    # Generate resume questions ONLY ONCE
    # during interview startup.
    # ========================================================

    if resume and resume.extracted_text:

        try:

            generated_questions = (
                build_resume_question_plan(
                    resume.extracted_text,
                    matched_skill
                )
            )

        except Exception as exc:

            print(
                "WARNING: Resume question plan "
                f"generation failed: {exc}"
            )

            generated_questions = []

        if len(generated_questions) >= TOTAL_QUESTIONS:

            interview_type = "resume_based"

        else:

            generated_questions = []

    # ========================================================
    # STANDARD INTERVIEW
    # ========================================================

    if interview_type == "standard":

        first_question = (
            get_next_adaptive_question(
                matched_skill,
                "easier",
                []
            )
        )

        generated_questions = (
            [first_question]
            if first_question
            else [questions[matched_skill][0]]
        )

    # ========================================================
    # CREATE SESSION
    # ========================================================

    now = datetime.utcnow()

    session_id = None

    if candidate_id is not None:

        new_session = InterviewSession(

            candidate_id=candidate_id,

            skill=matched_skill,

            interview_type=interview_type,

            total_questions=TOTAL_QUESTIONS,

            status="started",

            created_at=now,

            question_started_at=now,

            question_time_limit_seconds=(
                QUESTION_TIME_LIMIT_SECONDS
            ),

            current_question_index=0,

            suspicious_submission_count=0,

            # =================================================
            # FIX A
            #
            # Save the generated resume plan into the session.
            #
            # For standard interviews this remains None because
            # standard interviews are adaptive.
            # =================================================

            question_plan=(
                generated_questions
                if interview_type == "resume_based"
                else None
            )
        )

        db.add(new_session)

        db.commit()

        db.refresh(new_session)

        session_id = new_session.id

    # ========================================================
    # RESPONSE
    # ========================================================

    return {

        "message": (
            "Resume-based interview started"
            if interview_type == "resume_based"
            else "Standard interview started"
        ),

        "skill": matched_skill,

        "candidate_id": candidate_id,

        "session_id": session_id,

        "interview_type": interview_type,

        "adaptive_enabled": (
            interview_type == "standard"
        ),

        "total_questions": TOTAL_QUESTIONS,

        "question_time_limit_seconds": (
            QUESTION_TIME_LIMIT_SECONDS
        ),

        "total_interview_time_seconds": (
            TOTAL_INTERVIEW_TIME_SECONDS
        ),

        "total_interview_time_minutes": (
            TOTAL_INTERVIEW_TIME_SECONDS // 60
        ),

        "technical_question_count": (
            TECHNICAL_QUESTION_COUNT
        ),

        "programming_question_count": (
            PROGRAMMING_QUESTION_COUNT
        ),

        "aptitude_question_count": (
            APTITUDE_QUESTION_COUNT
        ),

        "current_question_index": 0,

        "current_question_number": 1,

        "suspicious_submission_count": 0,

        "questions": generated_questions
    }


# ============================================================
# SUBMIT ANSWER
# ============================================================

@router.post("/interview/answer")
def submit_answer(
    question: str,
    answer: str,
    candidate_id: int,
    session_id: int,
    timed_out: bool = False,
    db: Session = Depends(get_db)
):
    if not question or not question.strip():

        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty."
        )

    cleaned_question = question.strip()

    # ========================================================
    # LOAD SESSION
    # ========================================================

    session = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.id == session_id,
            InterviewSession.candidate_id == candidate_id
        )
        .first()
    )

    if not session:

        raise HTTPException(
            status_code=404,
            detail="Interview session not found."
        )

    if session.status == "completed":

        raise HTTPException(
            status_code=400,
            detail=(
                "This interview session is already completed."
            )
        )

    if session.status == "timed_out":

        raise HTTPException(
            status_code=400,
            detail=(
                "This interview session has timed out."
            )
        )

    current_time = datetime.utcnow()

    # ========================================================
    # OVERALL INTERVIEW TIMER
    # ========================================================

    if session.created_at:

        overall_elapsed_seconds = (
            current_time
            - session.created_at
        ).total_seconds()

    else:

        overall_elapsed_seconds = 0

    if (
        overall_elapsed_seconds
        > TOTAL_INTERVIEW_TIME_SECONDS
    ):

        session.status = "timed_out"
        session.question_started_at = None

        db.commit()

        raise HTTPException(
            status_code=408,
            detail={
                "message": (
                    "The overall 20-minute interview "
                    "time has expired."
                ),
                "total_time_limit_seconds": (
                    TOTAL_INTERVIEW_TIME_SECONDS
                ),
                "elapsed_seconds": round(
                    overall_elapsed_seconds,
                    1
                ),
                "session_status": "timed_out"
            }
        )

    # ========================================================
    # ANSWER VALIDATION
    # ========================================================

    cleaned_answer = (
        answer or ""
    ).strip()

    question_was_timed_out = bool(
        timed_out
    )

    if question_was_timed_out:

        cleaned_answer = (
            "No answer provided. "
            "The 60-second question timer expired."
        )

    elif not cleaned_answer:

        raise HTTPException(
            status_code=400,
            detail="Answer cannot be empty."
        )

    elif len(cleaned_answer) < 5:

        raise HTTPException(
            status_code=400,
            detail=(
                "Answer is too short. "
                "Please provide a meaningful answer."
            )
        )

    # ========================================================
    # ANSWER COUNT
    # ========================================================

    answer_count = (
        db.query(Interview)
        .filter(
            Interview.session_id == session_id,
            Interview.candidate_id == candidate_id
        )
        .count()
    )

    if answer_count >= session.total_questions:

        session.status = "completed"
        session.question_started_at = None

        db.commit()

        raise HTTPException(
            status_code=400,
            detail=(
                "All questions in this interview "
                "have already been answered."
            )
        )

    # ========================================================
    # DUPLICATE QUESTION CHECK
    # ========================================================

    existing_answer = (
        db.query(Interview)
        .filter(
            Interview.session_id == session_id,
            Interview.candidate_id == candidate_id,
            Interview.question == cleaned_question
        )
        .first()
    )

    if existing_answer:

        raise HTTPException(
            status_code=400,
            detail=(
                "This question has already been answered."
            )
        )

    # ========================================================
    # QUESTION TIMER
    # ========================================================

    if session.question_started_at is None:

        session.question_started_at = current_time

        db.commit()

    elapsed_seconds = (
        current_time
        - session.question_started_at
    ).total_seconds()

    time_limit = (
        session.question_time_limit_seconds
        or QUESTION_TIME_LIMIT_SECONDS
    )

    if (
        elapsed_seconds > time_limit
        and not question_was_timed_out
    ):

        raise HTTPException(
            status_code=408,
            detail={
                "message": (
                    "Time limit exceeded for this question."
                ),
                "time_limit_seconds": time_limit,
                "elapsed_seconds": round(
                    elapsed_seconds,
                    1
                ),
                "session_status": session.status,
                "question_timed_out": True
            }
        )

    # ========================================================
    # INTERVIEW INTEGRITY
    # ========================================================

    suspicious = False
    suspicious_reason = None

    if (
        not question_was_timed_out
        and elapsed_seconds
        < SUSPICIOUS_FAST_SUBMISSION_SECONDS
    ):

        suspicious = True

        suspicious_reason = (
            "Answer submitted unusually quickly."
        )

    # ========================================================
    # AI EVALUATION
    # ========================================================

    if question_was_timed_out:

        score = 0

        feedback = (
            "No answer was submitted within the "
            "60-second limit. The question was marked "
            "as unanswered and the interview continued."
        )

        difficulty = "easier"

    else:

        try:

            evaluation = evaluate_answer(
                cleaned_question,
                cleaned_answer
            )

        except Exception as exc:

            raise HTTPException(
                status_code=500,
                detail=(
                    f"AI evaluation failed: {str(exc)}"
                )
            )

        if not isinstance(evaluation, dict):

            raise HTTPException(
                status_code=500,
                detail=(
                    "Invalid evaluation response "
                    "from AI service."
                )
            )

        score = evaluation.get("score")

        feedback = evaluation.get("feedback")

        if score is None:

            raise HTTPException(
                status_code=500,
                detail=(
                    "AI evaluation did not return a score."
                )
            )

        if feedback is None:

            feedback = (
                "No feedback was provided."
            )

        try:

            score = float(score)

        except (TypeError, ValueError):

            raise HTTPException(
                status_code=500,
                detail=(
                    "AI evaluation returned an "
                    "invalid score."
                )
            )

        score = max(
            0.0,
            min(10.0, score)
        )

        difficulty = evaluation.get(
            "difficulty"
        )

        if difficulty not in {
            "easier",
            "same",
            "harder"
        }:

            difficulty = (
                get_adaptive_difficulty(score)
            )

        if difficulty not in {
            "easier",
            "same",
            "harder"
        }:

            difficulty = "same"

    # ========================================================
    # ANSWERED QUESTIONS
    # ========================================================

    answered_questions = (
        get_answered_questions(
            db,
            candidate_id,
            session_id
        )
    )

    answered_questions.append(
        cleaned_question
    )

    # ========================================================
    # QUESTION POSITION
    # ========================================================

    new_answer_count = (
        answer_count + 1
    )

    next_question = None

    # ========================================================
    # FIND NEXT QUESTION
    # ========================================================

    if new_answer_count < TOTAL_QUESTIONS:

        # ====================================================
        # STANDARD ADAPTIVE INTERVIEW
        # ====================================================

        if session.interview_type == "standard":

            if (
                new_answer_count
                < TECHNICAL_QUESTION_COUNT
            ):

                next_question = (
                    get_next_adaptive_question(
                        session.skill,
                        difficulty,
                        answered_questions
                    )
                )

            elif (
                new_answer_count
                < (
                    TECHNICAL_QUESTION_COUNT
                    + PROGRAMMING_QUESTION_COUNT
                )
            ):

                next_question = (
                    get_programming_question(
                        session.skill,
                        new_answer_count,
                        answered_questions
                    )
                )

            else:

                next_question = (
                    get_aptitude_question(
                        new_answer_count,
                        answered_questions
                    )
                )

        # ====================================================
        # FIX A — RESUME-BASED INTERVIEW
        #
        # DO NOT regenerate questions.
        #
        # The complete 20-question plan was already generated
        # during /interview/start and stored in:
        #
        # session.question_plan
        # ====================================================

        else:

            stored_plan = (
                session.question_plan
                or []
            )

            if (
                new_answer_count
                < len(stored_plan)
            ):

                next_question = (
                    stored_plan[
                        new_answer_count
                    ]
                )

    # ========================================================
    # SAFETY FALLBACK
    #
    # This fallback is intentionally deterministic.
    #
    # IMPORTANT:
    # It DOES NOT call generate_resume_questions().
    # ========================================================

    if (
        new_answer_count < TOTAL_QUESTIONS
        and not next_question
    ):

        if (
            new_answer_count
            < TECHNICAL_QUESTION_COUNT
        ):

            next_question = (
                get_next_adaptive_question(
                    session.skill,
                    "same",
                    answered_questions
                )
            )

        elif (
            new_answer_count
            < (
                TECHNICAL_QUESTION_COUNT
                + PROGRAMMING_QUESTION_COUNT
            )
        ):

            next_question = (
                get_programming_question(
                    session.skill,
                    new_answer_count,
                    answered_questions
                )
            )

        else:

            next_question = (
                get_aptitude_question(
                    new_answer_count,
                    answered_questions
                )
            )

    # ========================================================
    # SAVE ANSWER
    # ========================================================

    interview = Interview(
        candidate_id=candidate_id,
        session_id=session_id,
        question=cleaned_question,
        answer=cleaned_answer,
        score=score,
        feedback=feedback,
        answered_at=current_time,
        suspicious=suspicious,
        suspicious_reason=suspicious_reason
    )

    db.add(interview)

    # ========================================================
    # UPDATE SESSION
    # ========================================================

    if suspicious:

        session.suspicious_submission_count = (
            session.suspicious_submission_count + 1
        )

    session.current_question_index = (
        new_answer_count
    )

    if new_answer_count >= TOTAL_QUESTIONS:

        session.status = "completed"

        session.question_started_at = None

        next_question = None

    else:

        session.question_started_at = (
            current_time
        )

    db.commit()

    db.refresh(interview)

    # ========================================================
    # REMAINING OVERALL TIME
    # ========================================================

    remaining_overall_seconds = max(
        0,
        int(
            TOTAL_INTERVIEW_TIME_SECONDS
            - overall_elapsed_seconds
        )
    )

    # ========================================================
    # RESPONSE
    # ========================================================

    return {

        "message": (
            "Answer evaluated and saved successfully"
        ),

        "interview_id": interview.id,

        "candidate_id": candidate_id,

        "session_id": session_id,

        "question": cleaned_question,

        "answer": cleaned_answer,

        "score": score,

        "feedback": feedback,

        "difficulty": difficulty,

        "next_question": next_question,

        "adaptive_enabled": (
            session.interview_type
            == "standard"
        ),

        "answers_submitted": new_answer_count,

        "total_questions": (
            session.total_questions
        ),

        "interview_completed": (
            session.status == "completed"
        ),

        "question_index": (
            session.current_question_index
        ),

        "current_question_number": (
            session.current_question_index + 1
            if session.status != "completed"
            else session.total_questions
        ),

        "time_limit_seconds": time_limit,

        "answer_time_seconds": round(
            elapsed_seconds,
            1
        ),

        "total_interview_time_seconds": (
            TOTAL_INTERVIEW_TIME_SECONDS
        ),

        "remaining_overall_time_seconds": (
            remaining_overall_seconds
        ),

        "question_timed_out": (
            question_was_timed_out
        ),

        "suspicious": suspicious,

        "suspicious_reason": (
            suspicious_reason
        ),

        "suspicious_submission_count": (
            session.suspicious_submission_count
        ),

        "session_status": session.status
    }


# ============================================================
# GET SESSION RESULTS
# ============================================================

@router.get(
    "/interview/results/{candidate_id}/{session_id}"
)
def get_interview_results(
    candidate_id: int,
    session_id: int,
    db: Session = Depends(get_db)
):
    session = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.id == session_id,
            InterviewSession.candidate_id == candidate_id
        )
        .first()
    )

    if not session:

        raise HTTPException(
            status_code=404,
            detail="Interview session not found."
        )

    results = (
        db.query(Interview)
        .filter(
            Interview.candidate_id == candidate_id,
            Interview.session_id == session_id
        )
        .all()
    )

    scores = [
        float(item.score)
        for item in results
        if item.score is not None
    ]

    if scores:

        average_score = (
            sum(scores) / len(scores)
        )

        highest_score = max(scores)

        lowest_score = min(scores)

    else:

        average_score = 0
        highest_score = 0
        lowest_score = 0

    return {

        "session_id": session.id,

        "candidate_id": candidate_id,

        "skill": session.skill,

        "interview_type": (
            session.interview_type
        ),

        "status": session.status,

        "total_questions": (
            session.total_questions
        ),

        "question_time_limit_seconds": (
            QUESTION_TIME_LIMIT_SECONDS
        ),

        "total_interview_time_seconds": (
            TOTAL_INTERVIEW_TIME_SECONDS
        ),

        "total_interview_time_minutes": (
            TOTAL_INTERVIEW_TIME_SECONDS // 60
        ),

        "answered_questions": len(results),

        "average_score": round(
            average_score,
            1
        ),

        "highest_score": highest_score,

        "lowest_score": lowest_score,

        "suspicious_submission_count": (
            session.suspicious_submission_count
        ),

        "results": results
    }


# ============================================================
# SESSION PERFORMANCE ANALYTICS
# ============================================================

@router.get(
    "/interview/analytics/{candidate_id}/{session_id}"
)
def get_interview_analytics(
    candidate_id: int,
    session_id: int,
    db: Session = Depends(get_db)
):
    session = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.id == session_id,
            InterviewSession.candidate_id == candidate_id
        )
        .first()
    )

    if not session:

        raise HTTPException(
            status_code=404,
            detail="Interview session not found."
        )

    results = (
        db.query(Interview)
        .filter(
            Interview.candidate_id == candidate_id,
            Interview.session_id == session_id
        )
        .all()
    )

    scores = [
        float(item.score)
        for item in results
        if item.score is not None
    ]

    # ========================================================
    # NO RESULTS
    # ========================================================

    if not scores:

        return {

            "session_id": session_id,

            "candidate_id": candidate_id,

            "skill": session.skill,

            "interview_type": (
                session.interview_type
            ),

            "status": session.status,

            "total_questions": (
                session.total_questions
            ),

            "question_time_limit_seconds": (
                QUESTION_TIME_LIMIT_SECONDS
            ),

            "total_interview_time_seconds": (
                TOTAL_INTERVIEW_TIME_SECONDS
            ),

            "total_interview_time_minutes": (
                TOTAL_INTERVIEW_TIME_SECONDS // 60
            ),

            "answered_questions": 0,

            "completion_percentage": 0,

            "average_score": 0,

            "score_percentage": 0,

            "highest_score": 0,

            "lowest_score": 0,

            "performance_level": (
                "Not Evaluated"
            ),

            "excellent_answers": 0,

            "good_answers": 0,

            "needs_improvement": 0,

            "suspicious_submission_count": (
                session.suspicious_submission_count
            ),

            "performance_distribution": {

                "excellent": 0,

                "good": 0,

                "needs_improvement": 0
            },

            "strengths": [],

            "areas_for_improvement": []
        }

    # ========================================================
    # SCORE ANALYTICS
    # ========================================================

    average_score = (
        sum(scores) / len(scores)
    )

    highest_score = max(scores)

    lowest_score = min(scores)

    # ========================================================
    # COMPLETION
    # ========================================================

    if session.total_questions > 0:

        completion_percentage = round(
            (
                len(results)
                / session.total_questions
            ) * 100,
            1
        )

    else:

        completion_percentage = 0

    # ========================================================
    # SCORE PERCENTAGE
    # ========================================================

    score_percentage = round(
        (average_score / 10) * 100,
        1
    )

    # ========================================================
    # PERFORMANCE LEVEL
    # ========================================================

    if average_score >= 8:

        performance_level = "Excellent"

    elif average_score >= 6:

        performance_level = "Good"

    elif average_score >= 4:

        performance_level = (
            "Needs Improvement"
        )

    else:

        performance_level = "Poor"

    # ========================================================
    # PERFORMANCE DISTRIBUTION
    # ========================================================

    excellent_answers = sum(
        1
        for score in scores
        if score >= 8
    )

    good_answers = sum(
        1
        for score in scores
        if 6 <= score < 8
    )

    needs_improvement = sum(
        1
        for score in scores
        if score < 6
    )

    # ========================================================
    # STRENGTHS
    # ========================================================

    strengths = []

    for result in results:

        if (
            result.score is not None
            and float(result.score) >= 8
        ):

            strengths.append({

                "question": result.question,

                "score": float(
                    result.score
                )
            })

    # ========================================================
    # AREAS FOR IMPROVEMENT
    # ========================================================

    areas_for_improvement = []

    for result in results:

        if (
            result.score is not None
            and float(result.score) < 6
        ):

            areas_for_improvement.append({

                "question": result.question,

                "score": float(
                    result.score
                ),

                "feedback": result.feedback
            })

    # ========================================================
    # FINAL ANALYTICS RESPONSE
    # ========================================================

    return {

        "session_id": session_id,

        "candidate_id": candidate_id,

        "skill": session.skill,

        "interview_type": (
            session.interview_type
        ),

        "status": session.status,

        "total_questions": (
            session.total_questions
        ),

        "question_time_limit_seconds": (
            QUESTION_TIME_LIMIT_SECONDS
        ),

        "total_interview_time_seconds": (
            TOTAL_INTERVIEW_TIME_SECONDS
        ),

        "total_interview_time_minutes": (
            TOTAL_INTERVIEW_TIME_SECONDS // 60
        ),

        "answered_questions": len(results),

        "completion_percentage": (
            completion_percentage
        ),

        "average_score": round(
            average_score,
            1
        ),

        "score_percentage": (
            score_percentage
        ),

        "highest_score": highest_score,

        "lowest_score": lowest_score,

        "performance_level": (
            performance_level
        ),

        "excellent_answers": (
            excellent_answers
        ),

        "good_answers": (
            good_answers
        ),

        "needs_improvement": (
            needs_improvement
        ),

        "suspicious_submission_count": (
            session.suspicious_submission_count
        ),

        "performance_distribution": {

            "excellent": excellent_answers,

            "good": good_answers,

            "needs_improvement": (
                needs_improvement
            )
        },

        "strengths": strengths,

        "areas_for_improvement": (
            areas_for_improvement
        )
    }