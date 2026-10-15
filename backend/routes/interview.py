from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.orm import Session

from datetime import datetime



from database.connection import get_db

from models.interview import Interview

from models.interview_session import InterviewSession

from models.resume import Resume

from models.candidate import Candidate



from services.ai_service import evaluate_answer, get_adaptive_difficulty

from services.interview_generator import generate_resume_questions





router = APIRouter()





# ============================================================

# CONFIGURATION

# ============================================================



QUESTION_TIME_LIMIT_SECONDS = None

TOTAL_QUESTIONS = 20

TOTAL_INTERVIEW_TIME_SECONDS = 15 * 60



# Interview composition:

# 12 skill-specific technical questions

# 4 programming/problem-solving questions

# 4 aptitude/logical-reasoning questions

TECHNICAL_QUESTION_COUNT = 12

PROGRAMMING_QUESTION_COUNT = 4

APTITUDE_QUESTION_COUNT = 4



# A submission this quickly is flagged for review.

# It is NOT automatically rejected.

SUSPICIOUS_FAST_SUBMISSION_SECONDS = 5





# ============================================================

# QUESTION BANKS

# ============================================================



# The interview contains exactly 20 questions:

#   Q1-Q12  -> skill-specific technical/adaptive questions

#   Q13-Q16 -> programming/problem-solving questions

#   Q17-Q20 -> aptitude/logical-reasoning questions



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

# NON-TECHNICAL QUESTION BANK

# ============================================================



# Non-technical interviews do not use programming or technical

# questions. They focus on communication, workplace situations,

# collaboration, problem solving, adaptability, and resume discussion.

NON_TECHNICAL_QUESTIONS = [

    "Please introduce yourself and summarize the experience or education shown on your resume.",

    "What is the most important experience on your resume, and what did you learn from it?",

    "Describe a responsibility or project from your resume that you are particularly proud of.",

    "Tell me about a time when you had to learn something new quickly. How did you approach it?",

    "Describe a situation where you had to work with other people to complete an important task.",

    "Tell me about a challenge you faced in your studies or work and how you handled it.",

    "How do you prioritize your work when you have several tasks with similar deadlines?",

    "Describe a time when you received feedback or criticism. How did you respond to it?",

    "How would you handle a disagreement with a teammate or colleague?",

    "Tell me about a situation where you made a mistake. What did you do afterward?",

    "How do you adapt when the requirements of a task change unexpectedly?",

    "What are your main strengths, and how would you apply them in a professional workplace?",

]





def build_non_technical_question_plan(resume_text: str | None):

    """Build exactly 20 questions for a non-technical candidate."""

    # The first 12 questions are behavioral/resume-oriented. The resume

    # upload is still associated with the candidate session and can be

    # used by the resume module independently of the question bank.

    questions_list = list(NON_TECHNICAL_QUESTIONS[:TECHNICAL_QUESTION_COUNT])

    questions_list += aptitude_questions[:APTITUDE_QUESTION_COUNT]

    return questions_list[:TOTAL_QUESTIONS]





def get_non_technical_question_at_position(position: int, answered_questions: list[str]):

    """Return a unique non-technical/aptitude question for the given position."""

    plan = build_non_technical_question_plan(None)

    answered = {q.strip().lower() for q in answered_questions if q}

    for index in range(max(0, position), len(plan)):

        if plan[index].strip().lower() not in answered:

            return plan[index]

    for question in plan:

        if question.strip().lower() not in answered:

            return question

    return None





# ============================================================

# QUESTION SELECTION HELPERS

# ============================================================



def get_next_adaptive_question(

    skill: str,

    difficulty: str,

    answered_questions: list[str]

):

    """Return the first unasked technical question for the requested difficulty."""



    skill_bank = adaptive_questions.get(skill)



    if not skill_bank:

        return None



    answered = {

        question.strip().lower()

        for question in answered_questions

        if question

    }



    # Try the requested difficulty first.

    for question in skill_bank.get(difficulty, []):

        if question.strip().lower() not in answered:

            return question



    # If that level is exhausted, use all levels in a sensible order.

    for fallback_level in ("same", "harder", "easier"):

        for question in skill_bank.get(fallback_level, []):

            if question.strip().lower() not in answered:

                return question



    return None





def get_programming_question(

    skill: str,

    question_number: int,

    answered_questions: list[str]

):

    """Return a non-repeated programming question for Q13-Q16."""



    bank = programming_questions.get(skill, [])

    answered = {

        question.strip().lower()

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

    """Return a non-repeated aptitude question for Q17-Q20."""



    answered = {

        question.strip().lower()

        for question in answered_questions

        if question

    }



    # Rotate through the bank so every interview gets four unique questions.

    for offset in range(len(aptitude_questions)):

        index = ((question_number - 1) + offset) % len(aptitude_questions)

        question = aptitude_questions[index]

        if question.strip().lower() not in answered:

            return question



    return None





def build_resume_question_plan(
    resume_text: str,
    skill: str
):
    """Build the complete 20-question resume-based interview plan once."""
    generated = generate_resume_questions(resume_text, skill) or []
    cleaned, seen = [], set()

    for question in generated:
        if not question:
            continue
        question = str(question).strip()
        if not question:
            continue
        key = question.lower()
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(question)
        if len(cleaned) >= TOTAL_QUESTIONS:
            break

    if len(cleaned) < TECHNICAL_QUESTION_COUNT:
        for difficulty in ("easier", "same", "harder"):
            for question in adaptive_questions.get(skill, {}).get(difficulty, []):
                key = question.strip().lower()
                if key in seen:
                    continue
                seen.add(key)
                cleaned.append(question)
                if len(cleaned) >= TECHNICAL_QUESTION_COUNT:
                    break
            if len(cleaned) >= TECHNICAL_QUESTION_COUNT:
                break

    if len(cleaned) < TECHNICAL_QUESTION_COUNT + PROGRAMMING_QUESTION_COUNT:
        for question in programming_questions.get(skill, []):
            key = question.strip().lower()
            if key in seen:
                continue
            seen.add(key)
            cleaned.append(question)
            if len(cleaned) >= TECHNICAL_QUESTION_COUNT + PROGRAMMING_QUESTION_COUNT:
                break

    if len(cleaned) < TOTAL_QUESTIONS:
        for question in aptitude_questions:
            key = question.strip().lower()
            if key in seen:
                continue
            seen.add(key)
            cleaned.append(question)
            if len(cleaned) >= TOTAL_QUESTIONS:
                break

    return cleaned[:TOTAL_QUESTIONS]


def get_saved_question_at_position(plan, position: int):
    """Return a question from the saved session plan without regeneration."""
    if not isinstance(plan, list):
        return None
    if 0 <= position < len(plan):
        question = plan[position]
        if isinstance(question, str) and question.strip():
            return question.strip()
    return None


# ============================================================
# START INTERVIEW
# ============================================================


# ============================================================





# ============================================================

# RESUME-DRIVEN INTERVIEW START

# ============================================================



@router.get("/interview/start-candidate/{candidate_id}")

def start_candidate_interview(

    candidate_id: int,

    db: Session = Depends(get_db)

):

    candidate = (

        db.query(Candidate)

        .filter(Candidate.id == candidate_id)

        .first()

    )



    if not candidate:

        raise HTTPException(

            status_code=404,

            detail="Candidate not found."

        )



    candidate_type = (

        getattr(candidate, "candidate_type", "technical")

        or "technical"

    ).lower()



    if candidate_type == "non_technical":

        return start_interview("general", candidate_id, db)



    resume = (

        db.query(Resume)

        .filter(Resume.candidate_id == candidate_id)

        .first()

    )



    resume_text = (

        getattr(resume, "extracted_text", "") or ""

    ).lower()



    skill_patterns = {

        "Python": [

            "python", "django", "flask",

            "fastapi", "pandas", "numpy"

        ],

        "Java": [

            "java", "spring", "spring boot",

            "hibernate", "maven"

        ],

        "JavaScript": [

            "javascript", "typescript", "react",

            "node.js", "nodejs", "express"

        ],

    }



    scores = {

        skill: sum(resume_text.count(term) for term in terms)

        for skill, terms in skill_patterns.items()

    }



    inferred_skill = (

        max(scores, key=scores.get)

        if resume_text and max(scores.values()) > 0

        else None

    )



    if not inferred_skill:

        stored_skill = (

            getattr(candidate, "skill", "") or ""

        ).strip().lower()



        inferred_skill = {

            "python": "Python",

            "java": "Java",

            "javascript": "JavaScript",

        }.get(stored_skill)



    if not inferred_skill:

        inferred_skill = "Python"



    return start_interview(

        inferred_skill,

        candidate_id,

        db

    )



@router.get("/interview/start/{skill}")

def start_interview(

    skill: str,

    candidate_id: int | None = None,

    db: Session = Depends(get_db)

):

    # --------------------------------------------------------

    # Determine candidate type first.

    # --------------------------------------------------------

    candidate = None



    if candidate_id:

        candidate = (

            db.query(Candidate)

            .filter(Candidate.id == candidate_id)

            .first()

        )



    candidate_type = (

        (candidate.candidate_type or "technical").lower()

        if candidate

        else "technical"

    )



    # --------------------------------------------------------

    # Non-technical candidates do not depend on a technical skill.

    # The frontend currently sends "general" for compatibility.

    # --------------------------------------------------------

    if candidate_type == "non_technical":

        matched_skill = "General"

    else:

        matched_skill = None



        for available_skill in questions.keys():

            if available_skill.lower() == skill.lower():

                matched_skill = available_skill

                break



        if not matched_skill:

            return {

                "message": "Skill not supported",

                "available_skills": list(questions.keys())

            }



    # --------------------------------------------------------

    # Find candidate resume

    # --------------------------------------------------------

    resume = None



    if candidate_id:

        resume = (

            db.query(Resume)

            .filter(Resume.candidate_id == candidate_id)

            .first()

        )



    # --------------------------------------------------------

    # Determine interview questions

    # --------------------------------------------------------

    if candidate_type == "non_technical":

        generated_questions = build_non_technical_question_plan(

            resume.extracted_text if resume else None

        )

        interview_type = "non_technical"

    else:

        interview_type = "standard"



        if resume and resume.extracted_text:

            generated_questions = build_resume_question_plan(

                resume.extracted_text,

                matched_skill

            )



            if generated_questions:

                interview_type = "resume_based"

            else:

                generated_questions = []

        else:

            generated_questions = []



        # Standard interview starts with an easier technical question.

        if interview_type == "standard":

            first_question = get_next_adaptive_question(

                matched_skill,

                "easier",

                []

            )



            generated_questions = [

                first_question

            ] if first_question else [questions[matched_skill][0]]



    # --------------------------------------------------------

    # Create interview session

    # --------------------------------------------------------

    if candidate_id:

        new_session = InterviewSession(

            candidate_id=candidate_id,

            skill=matched_skill,

            interview_type=interview_type,

            total_questions=(
    TOTAL_QUESTIONS
    if interview_type == "standard"
    else len(generated_questions)
),
            status="started",

            created_at=datetime.utcnow(),
            question_plan=generated_questions,

            question_started_at=datetime.utcnow(),

            question_time_limit_seconds=None,

            current_question_index=0,

            suspicious_submission_count=0

        )



        db.add(new_session)

        db.commit()

        db.refresh(new_session)



        session_id = new_session.id

    else:

        session_id = None



    return {

        "message": (

            "Non-technical interview started"

            if candidate_type == "non_technical"

            else (

                "Resume-based interview started"

                if interview_type == "resume_based"

                else "Standard interview started"

            )

        ),

        "skill": matched_skill,

        "candidate_id": candidate_id,

        "candidate_type": candidate_type,

        "session_id": session_id,

        "interview_type": interview_type,

        "adaptive_enabled": interview_type == "standard",

        "total_questions": (
    TOTAL_QUESTIONS
    if interview_type == "standard"
    else len(generated_questions)
),
        "question_time_limit_seconds": None,

        "total_interview_time_seconds": TOTAL_INTERVIEW_TIME_SECONDS,

        "total_interview_time_minutes": TOTAL_INTERVIEW_TIME_SECONDS // 60,

        "technical_question_count": (

            TECHNICAL_QUESTION_COUNT

            if candidate_type != "non_technical"

            else 0

        ),

        "programming_question_count": (

            PROGRAMMING_QUESTION_COUNT

            if candidate_type != "non_technical"

            else 0

        ),

        "aptitude_question_count": APTITUDE_QUESTION_COUNT,

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

    # --------------------------------------------------------

    # Validate question

    # --------------------------------------------------------



    if not question or not question.strip():

        raise HTTPException(

            status_code=400,

            detail="Question cannot be empty."

        )



    cleaned_question = question.strip()



    # --------------------------------------------------------

    # Verify session

    # --------------------------------------------------------



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



    # --------------------------------------------------------

    # Prevent answers after completion

    # --------------------------------------------------------



    if session.status == "completed":

        raise HTTPException(

            status_code=400,

            detail="This interview session is already completed."

        )



    if session.status == "timed_out":

        raise HTTPException(

            status_code=400,

            detail="This interview session has timed out."

        )



    current_time = datetime.utcnow()



    # --------------------------------------------------------

    # OVERALL 15-MINUTE INTERVIEW TIMER

    # --------------------------------------------------------



    if session.created_at:

        overall_elapsed_seconds = (

            current_time - session.created_at

        ).total_seconds()



        if overall_elapsed_seconds > TOTAL_INTERVIEW_TIME_SECONDS:

            session.status = "timed_out"

            session.question_started_at = None

            db.commit()



            raise HTTPException(

                status_code=408,

                detail={

                    "message": "The overall 15-minute interview time has expired.",

                    "total_time_limit_seconds": TOTAL_INTERVIEW_TIME_SECONDS,

                    "elapsed_seconds": round(overall_elapsed_seconds, 1),

                    "session_status": "timed_out"

                }

            )

    else:

        overall_elapsed_seconds = 0



    # --------------------------------------------------------

    # Validate answer

    # --------------------------------------------------------



    cleaned_answer = (answer or "").strip()



    # A timeout is a valid question outcome. It is recorded as a

    # zero-score answer so the interview can continue to Q20.

    question_was_timed_out = timed_out



    if question_was_timed_out:

        cleaned_answer = "No answer provided. The candidate submitted no answer."



    elif not cleaned_answer:

        raise HTTPException(

            status_code=400,

            detail="Answer cannot be empty."

        )



    elif len(cleaned_answer) < 5:

        raise HTTPException(

            status_code=400,

            detail="Answer is too short. Please provide a meaningful answer."

        )



    # --------------------------------------------------------

    # Count existing answers

    # --------------------------------------------------------



    answer_count = (

        db.query(Interview)

        .filter(

            Interview.session_id == session_id,

            Interview.candidate_id == candidate_id

        )

        .count()

    )



    # --------------------------------------------------------

    # Prevent submitting more answers than questions

    # --------------------------------------------------------



    if answer_count >= session.total_questions:

        session.status = "completed"

        session.question_started_at = None

        db.commit()



        raise HTTPException(

            status_code=400,

            detail="All questions in this interview have already been answered."

        )



    # --------------------------------------------------------

    # Prevent duplicate question submission

    # --------------------------------------------------------



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

            detail="This question has already been answered."

        )



    # ========================================================

    # QUESTION RESPONSE TIME TRACKING

    # ========================================================

    # There is NO per-question timeout. The interview uses only the

    # overall 15-minute session timer. We still measure how long the

    # candidate took to answer for analytics and integrity detection.



    if session.question_started_at is None:

        session.question_started_at = current_time

        db.commit()



    elapsed_seconds = (

        current_time - session.question_started_at

    ).total_seconds()



    time_limit = None



    # ========================================================

    # INTERVIEW INTEGRITY DETECTION

    # ========================================================



    suspicious = False

    suspicious_reason = None



    if not question_was_timed_out and elapsed_seconds < SUSPICIOUS_FAST_SUBMISSION_SECONDS:

        suspicious = True

        suspicious_reason = "Answer submitted unusually quickly."



    # ========================================================

    # EVALUATE ANSWER

    # ========================================================



    if question_was_timed_out:

        score = 0

        feedback = (

            "No answer was submitted. The question was marked as unanswered "

            "and the interview continued."

        )

        difficulty = "easier"



    else:

        # The route is synchronous and Gemini may take several seconds.
        # Close the SQLAlchemy read transaction before the network call so the
        # database connection/transaction is not held while waiting on Gemini.
        # The ORM session can open a fresh transaction for subsequent reads/writes.
        db.commit()

        evaluation = evaluate_answer(

            cleaned_question,

            cleaned_answer

        )



        if not isinstance(evaluation, dict):

            raise HTTPException(

                status_code=500,

                detail="Invalid evaluation response from AI service."

            )



        score = evaluation.get("score")



        feedback = evaluation.get("feedback")



        if score is None:

            raise HTTPException(

                status_code=500,

                detail="AI evaluation did not return a score."

            )



        if feedback is None:

            feedback = "No feedback was provided."



        try:

            score = float(score)

        except (TypeError, ValueError):

            raise HTTPException(

                status_code=500,

                detail="AI evaluation returned an invalid score."

            )



        difficulty = evaluation.get("difficulty")



        if difficulty not in {"easier", "same", "harder"}:

            difficulty = get_adaptive_difficulty(score)



    # ========================================================

    # ANSWERED QUESTIONS

    # ========================================================



    answered_question_rows = (

        db.query(Interview.question)

        .filter(

            Interview.session_id == session_id,

            Interview.candidate_id == candidate_id

        )

        .all()

    )



    answered_questions = [

        row[0] for row in answered_question_rows

        if row and row[0]

    ]



    answered_questions.append(cleaned_question)



    # ========================================================

    # NEXT QUESTION

    # ========================================================



    next_question = None

    next_question_number = answer_count + 2



    # Questions are numbered from 1:

    #   1-12  technical

    #   13-16 programming

    #   17-20 aptitude

    #

    # answer_count is the number of answers BEFORE this submission.

    # Therefore new_answer_count is the number answered AFTER it.



    new_answer_count = answer_count + 1



    if new_answer_count < TOTAL_QUESTIONS:

        if session.interview_type == "non_technical":

            next_question = get_non_technical_question_at_position(

                new_answer_count,

                answered_questions

            )



        elif session.interview_type == "standard":

            if new_answer_count < TECHNICAL_QUESTION_COUNT:

                next_question = get_next_adaptive_question(

                    session.skill,

                    difficulty,

                    answered_questions

                )



            elif new_answer_count < (

                TECHNICAL_QUESTION_COUNT + PROGRAMMING_QUESTION_COUNT

            ):

                next_question = get_programming_question(

                    session.skill,

                    new_answer_count,

                    answered_questions

                )



            else:

                next_question = get_aptitude_question(

                    new_answer_count,

                    answered_questions

                )



        else:
            # Resume-based interviews use the exact saved plan.
            next_question = get_saved_question_at_position(
                session.question_plan,
                new_answer_count
            )


    # Safety fallback so the interview never gets stuck.

    if new_answer_count < TOTAL_QUESTIONS and not next_question:

        if session.interview_type == "non_technical":

            next_question = get_non_technical_question_at_position(

                new_answer_count,

                answered_questions

            )



        elif session.interview_type == "resume_based":
            next_question = get_saved_question_at_position(
                session.question_plan,
                new_answer_count
            )

        elif new_answer_count < TECHNICAL_QUESTION_COUNT:

            next_question = get_next_adaptive_question(

                session.skill,

                "same",

                answered_questions

            )



        elif new_answer_count < (

            TECHNICAL_QUESTION_COUNT + PROGRAMMING_QUESTION_COUNT

        ):

            next_question = get_programming_question(

                session.skill,

                new_answer_count,

                answered_questions

            )



        else:

            next_question = get_aptitude_question(

                new_answer_count,

                answered_questions

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



    # --------------------------------------------------------

    # Update suspicious submission count

    # --------------------------------------------------------



    if suspicious:

        session.suspicious_submission_count = (

            session.suspicious_submission_count + 1

        )



    # --------------------------------------------------------

    # Update question index

    # --------------------------------------------------------



    session.current_question_index = new_answer_count



    # --------------------------------------------------------

    # Automatically complete after Q20

    # --------------------------------------------------------



    if new_answer_count >= TOTAL_QUESTIONS:

        session.status = "completed"

        session.question_started_at = None

        next_question = None



    else:

        # Start response-time tracking for the next question.

        session.question_started_at = current_time



    db.commit()

    db.refresh(interview)



    # ========================================================

    # RESPONSE

    # ========================================================



    remaining_overall_seconds = max(

        0,

        int(

            TOTAL_INTERVIEW_TIME_SECONDS

            - overall_elapsed_seconds

        )

    )



    return {

        "message": "Answer evaluated and saved successfully",

        "interview_id": interview.id,

        "candidate_id": candidate_id,

        "session_id": session_id,

        "question": cleaned_question,

        "answer": cleaned_answer,

        "score": score,

        "feedback": feedback,

        "difficulty": difficulty,

        "next_question": next_question,

        "adaptive_enabled": session.interview_type == "standard",

        "answers_submitted": new_answer_count,

        "total_questions": session.total_questions,

        "interview_completed": session.status == "completed",

        "question_index": session.current_question_index,

        "current_question_number": (

            session.current_question_index + 1

            if session.status != "completed"

            else session.total_questions

        ),

        "time_limit_seconds": time_limit,

        "answer_time_seconds": round(elapsed_seconds, 1),

        "total_interview_time_seconds": TOTAL_INTERVIEW_TIME_SECONDS,

        "remaining_overall_time_seconds": remaining_overall_seconds,

        "question_timed_out": question_was_timed_out,

        "suspicious": suspicious,

        "suspicious_reason": suspicious_reason,

        "suspicious_submission_count": session.suspicious_submission_count,

        "session_status": session.status

    }









# ============================================================

# GET CURRENT SESSION RESULTS

# ============================================================



@router.get(

    "/interview/results/{candidate_id}/{session_id}"

)

def get_interview_results(

    candidate_id: int,

    session_id: int,

    db: Session = Depends(get_db)

):



    # --------------------------------------------------------

    # Verify session

    # --------------------------------------------------------



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



    # --------------------------------------------------------

    # Get only this session's answers

    # --------------------------------------------------------



    results = (

        db.query(Interview)

        .filter(

            Interview.candidate_id == candidate_id,

            Interview.session_id == session_id

        )

        .all()

    )



    # --------------------------------------------------------

    # Calculate analytics

    # --------------------------------------------------------



    if results:



        scores = [

            item.score

            for item in results

        ]



        average_score = (

            sum(scores) / len(scores)

        )



        highest_score = max(scores)



        lowest_score = min(scores)



    else:



        average_score = 0



        highest_score = 0



        lowest_score = 0



    # --------------------------------------------------------

    # Return session results

    # --------------------------------------------------------



    return {



        "session_id": session.id,



        "candidate_id": candidate_id,



        "skill": session.skill,



        "interview_type": session.interview_type,



        "status": session.status,



        "total_questions": session.total_questions,



        "question_time_limit_seconds": None,



        "total_interview_time_seconds": TOTAL_INTERVIEW_TIME_SECONDS,



        "total_interview_time_minutes": TOTAL_INTERVIEW_TIME_SECONDS // 60,



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



    # --------------------------------------------------------

    # Verify session

    # --------------------------------------------------------



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



    # --------------------------------------------------------

    # Get answers for this session

    # --------------------------------------------------------



    results = (

        db.query(Interview)

        .filter(

            Interview.candidate_id == candidate_id,

            Interview.session_id == session_id

        )

        .all()

    )



    # --------------------------------------------------------

    # No answers yet

    # --------------------------------------------------------



    if not results:



        return {



            "session_id": session_id,



            "candidate_id": candidate_id,



            "skill": session.skill,



            "interview_type": session.interview_type,



            "status": session.status,



            "total_questions": session.total_questions,



            "question_time_limit_seconds": None,



            "total_interview_time_seconds": TOTAL_INTERVIEW_TIME_SECONDS,



            "total_interview_time_minutes": TOTAL_INTERVIEW_TIME_SECONDS // 60,



            "answered_questions": 0,



            "completion_percentage": 0,



            "average_score": 0,



            "score_percentage": 0,



            "highest_score": 0,



            "lowest_score": 0,



            "performance_level": "Not Evaluated",



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



    # --------------------------------------------------------

    # Scores

    # --------------------------------------------------------



    scores = [

        item.score

        for item in results

    ]



    average_score = (

        sum(scores) / len(scores)

    )



    highest_score = max(scores)



    lowest_score = min(scores)



    # --------------------------------------------------------

    # Completion percentage

    # --------------------------------------------------------



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



    # --------------------------------------------------------

    # Score percentage

    # --------------------------------------------------------



    score_percentage = round(

        (average_score / 10) * 100,

        1

    )



    # --------------------------------------------------------

    # Performance level

    # --------------------------------------------------------



    if average_score >= 8:



        performance_level = "Excellent"



    elif average_score >= 6:



        performance_level = "Good"



    elif average_score >= 4:



        performance_level = "Needs Improvement"



    else:



        performance_level = "Poor"



    # --------------------------------------------------------

    # Performance categories

    # --------------------------------------------------------



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



    # --------------------------------------------------------

    # Strengths

    # --------------------------------------------------------



    strengths = []



    for result in results:



        if result.score >= 8:



            strengths.append({

                "question": result.question,

                "score": result.score

            })



    # --------------------------------------------------------

    # Areas for improvement

    # --------------------------------------------------------



    areas_for_improvement = []



    for result in results:



        if result.score < 6:



            areas_for_improvement.append({

                "question": result.question,

                "score": result.score,

                "feedback": result.feedback

            })



    # --------------------------------------------------------

    # Return analytics

    # --------------------------------------------------------



    return {



        "session_id": session_id,



        "candidate_id": candidate_id,



        "skill": session.skill,



        "interview_type": session.interview_type,



        "status": session.status,



        "total_questions": session.total_questions,



        "question_time_limit_seconds": None,



        "total_interview_time_seconds": TOTAL_INTERVIEW_TIME_SECONDS,



        "total_interview_time_minutes": TOTAL_INTERVIEW_TIME_SECONDS // 60,



        "answered_questions": len(results),



        "completion_percentage": completion_percentage,



        "average_score": round(

            average_score,

            1

        ),



        "score_percentage": score_percentage,



        "highest_score": highest_score,



        "lowest_score": lowest_score,



        "performance_level": performance_level,



        "excellent_answers": excellent_answers,



        "good_answers": good_answers,



        "needs_improvement": needs_improvement,



        "suspicious_submission_count": (

            session.suspicious_submission_count

        ),



        "performance_distribution": {



            "excellent": excellent_answers,



            "good": good_answers,



            "needs_improvement": needs_improvement



        },



        "strengths": strengths,



        "areas_for_improvement": areas_for_improvement



    }