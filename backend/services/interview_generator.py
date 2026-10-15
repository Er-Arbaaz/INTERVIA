import os
import json
import re
import hashlib

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

GEMINI_MODEL = os.getenv(
    "GEMINI_INTERVIEW_MODEL",
    "gemini-3.5-flash-lite"
)

QUESTION_COUNT = 20
TECHNICAL_QUESTION_COUNT = 12
PROGRAMMING_QUESTION_COUNT = 4
APTITUDE_QUESTION_COUNT = 4


TECHNICAL_FALLBACKS = {
    "Python": [
        "Your resume mentions Python. What is one project where you used Python, and what was your main responsibility?",
        "How did you use Python to solve a practical problem in one of your projects?",
        "What Python data structure did you use most often in your project work, and why?",
        "How did you handle errors in a Python project you worked on?",
        "What Python library from your resume did you find most useful, and what did you use it for?",
        "How did you test or debug your Python code during project development?",
        "What part of your Python project required the most problem-solving?",
        "How did Python help you connect different parts of one of your projects?",
        "What did you learn while working with Python that improved your programming skills?",
        "How did you organize Python code in one of your projects?",
        "What is one Python concept from your resume experience that you can explain with an example?",
        "If you improved one Python project from your resume, what would you improve first?",
    ],
    "Java": [
        "Your resume mentions Java. What is one project where you used Java, and what was your main responsibility?",
        "How did you use Java to solve a practical problem in one of your projects?",
        "What Java concept did you use most often in your project work, and why?",
        "How did you handle exceptions in a Java project you worked on?",
        "What Java library or framework from your resume did you find most useful?",
        "How did you test or debug your Java code during project development?",
        "What part of your Java project required the most problem-solving?",
        "How did Java help you organize the backend or application logic in a project?",
        "What did you learn while working with Java that improved your programming skills?",
        "How did you structure Java classes in one of your projects?",
        "What is one Java concept from your resume experience that you can explain with an example?",
        "If you improved one Java project from your resume, what would you improve first?",
    ],
    "JavaScript": [
        "Your resume mentions JavaScript or frontend development. What is one project where you used it, and what was your main responsibility?",
        "How did you use JavaScript to solve a practical problem in one of your projects?",
        "What JavaScript concept did you use most often in your project work, and why?",
        "How did you handle errors or unexpected behavior in a JavaScript project?",
        "What frontend library or framework from your resume did you find most useful?",
        "How did you test or debug your JavaScript code during project development?",
        "What part of your frontend project required the most problem-solving?",
        "How did JavaScript help you connect the user interface with backend services?",
        "What did you learn while working with JavaScript that improved your development skills?",
        "How did you organize components or JavaScript code in one of your projects?",
        "What is one JavaScript concept from your resume experience that you can explain with an example?",
        "If you improved one JavaScript or React project from your resume, what would you improve first?",
    ],
}

PROGRAMMING_FALLBACKS = {
    "Python": [
        "Given a Python list of integers, how would you find the first value that appears only once?",
        "How would you check whether a string is a palindrome in Python?",
        "Given a Python list, how would you remove duplicates while keeping the original order?",
        "How would you find the second-largest distinct number in a Python list?",
        "How would you count the frequency of each word in a Python sentence?",
        "How would you merge two sorted Python lists into one sorted list?",
        "How would you find the common elements between two Python lists?",
        "How would you reverse a string in Python without using a built-in reverse method?",
    ],
    "Java": [
        "Given a Java array of integers, how would you find the first value that appears only once?",
        "How would you check whether a string is a palindrome in Java?",
        "Given a Java list, how would you remove duplicates while keeping the original order?",
        "How would you find the second-largest distinct number in a Java array?",
        "How would you count the frequency of each word in a Java sentence?",
        "How would you merge two sorted Java arrays into one sorted array?",
        "How would you find common elements between two Java lists?",
        "How would you reverse a string in Java without using a built-in reverse method?",
    ],
    "JavaScript": [
        "Given a JavaScript array of numbers, how would you find the first value that appears only once?",
        "How would you check whether a string is a palindrome in JavaScript?",
        "Given a JavaScript array, how would you remove duplicates while keeping the original order?",
        "How would you find the second-largest distinct number in a JavaScript array?",
        "How would you count the frequency of each word in a JavaScript sentence?",
        "How would you merge two sorted JavaScript arrays into one sorted array?",
        "How would you find common elements between two JavaScript arrays?",
        "How would you reverse a string in JavaScript without using reverse()?",
    ],
}

APTITUDE_FALLBACKS = [
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


def _unique(items, count, single_focus=False):
    result = []
    seen = set()

    for item in items:
        if not isinstance(item, str):
            continue
        item = item.strip()
        if not item:
            continue

        # Reject obvious compound/multi-question items from the first
        # 12 technical questions.
        if single_focus and item.count("?") != 1:
            continue

        key = item.lower()
        if key in seen:
            continue
        seen.add(key)
        result.append(item)
        if len(result) >= count:
            break

    return result


def _fallback_plan(resume_text, skill):
    """Build a varied 20-question plan if Gemini is unavailable."""
    text = str(resume_text or "").lower()
    fingerprint = hashlib.sha256(text.encode("utf-8")).hexdigest()
    seed = int(fingerprint[:8], 16)

    technical = TECHNICAL_FALLBACKS.get(skill, TECHNICAL_FALLBACKS["Python"])
    programming = PROGRAMMING_FALLBACKS.get(skill, PROGRAMMING_FALLBACKS["Python"])

    tech_offset = seed % len(technical)
    prog_offset = (seed // 17) % len(programming)
    apt_offset = (seed // 31) % len(APTITUDE_FALLBACKS)

    technical_rotated = technical[tech_offset:] + technical[:tech_offset]
    programming_rotated = programming[prog_offset:] + programming[:prog_offset]
    aptitude_rotated = APTITUDE_FALLBACKS[apt_offset:] + APTITUDE_FALLBACKS[:apt_offset]

    # Add a small resume-specific signal to fallback programming selection
    # without inventing facts about the candidate.
    technology_hints = [
        term for term in (
            "fastapi", "django", "flask", "react", "node.js", "mongodb",
            "postgresql", "mysql", "sql", "docker", "machine learning",
            "artificial intelligence"
        )
        if term in text
    ]

    programming_result = programming_rotated[:PROGRAMMING_QUESTION_COUNT]

    if technology_hints:
        hint = technology_hints[seed % len(technology_hints)]
        programming_result[-1] = (
            f"Your resume mentions {hint}. Describe one moderate programming "
            f"problem where knowledge of {hint} would help you design a solution."
        )

    return (
        _unique(technical_rotated, TECHNICAL_QUESTION_COUNT)
        + _unique(programming_result, PROGRAMMING_QUESTION_COUNT)
        + _unique(aptitude_rotated, APTITUDE_QUESTION_COUNT)
    )[:QUESTION_COUNT]


def generate_resume_questions(resume_text: str, skill: str):
    """
    Generate one complete 20-question interview plan for one resume.

    Returns:
      12 moderate resume-specific technical questions,
      4 moderate programming/problem-solving questions,
      4 moderate aptitude/logical questions.
    """
    resume_text = str(resume_text or "").strip()

    if not resume_text:
        return _fallback_plan(resume_text, skill)

    if not GEMINI_API_KEY:
        print("WARNING: GEMINI_API_KEY was not found. Using resume-aware fallback questions.")
        return _fallback_plan(resume_text, skill)

    prompt = f"""
You are the AI interviewer for INTERVIA.

Create ONE complete 20-question mock interview from the candidate resume below.

INTERVIEW STRUCTURE
1. Questions 1-12: resume-specific technical questions.
2. Questions 13-16: programming/problem-solving questions.
3. Questions 17-20: aptitude/logical-reasoning questions.

DIFFICULTY
- All 20 questions must be MODERATE difficulty.
- Do not make them trivial.
- Do not make them advanced interview questions.
- Assume the candidate is a student or early-career developer.

QUESTIONS 1-12 RULES
- Every question must be directly grounded in the resume.
- Ask about technologies, projects, internships, coursework, tools, or experience actually present in the resume.
- Ask ONE main question per item.
- Do NOT combine two or more questions with "and".
- Do NOT ask a question containing multiple requests.
- Prefer clear questions such as: "How did you use X in your project?"
- Avoid vague questions.
- Do not invent technologies, employers, projects, achievements, or responsibilities.
- Cover different parts of the resume rather than repeating the same project.

QUESTIONS 13-16 RULES
- Exactly 4 programming/problem-solving questions.
- Keep them moderate and suitable for the candidate's technical background.
- Prefer the candidate's strongest programming language or technologies from the resume.
- Make the four problems different from each other.
- Do not repeat common questions unnecessarily.

QUESTIONS 17-20 RULES
- Exactly 4 aptitude/logical-reasoning questions.
- Moderate difficulty.
- Vary the topics: percentages, ratios, speed/work, probability, number series, logical reasoning, etc.
- Do not depend on resume facts.
- Do not repeat questions.

IMPORTANT
Return ONLY valid JSON in this exact shape:
{{
  "technical": ["12 questions"],
  "programming": ["4 questions"],
  "aptitude": ["4 questions"]
}}

Candidate primary skill: {skill}

Candidate resume:
---
{resume_text[:18000]}
---
"""

    try:
        client = genai.Client(api_key=GEMINI_API_KEY)

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.7,
                response_mime_type="application/json",
            ),
        )

        raw = (response.text or "").strip()
        data = json.loads(raw)

        technical = _unique(
            data.get("technical", []) if isinstance(data, dict) else [],
            TECHNICAL_QUESTION_COUNT,
            single_focus=True,
        )
        programming = _unique(
            data.get("programming", []) if isinstance(data, dict) else [],
            PROGRAMMING_QUESTION_COUNT,
        )
        aptitude = _unique(
            data.get("aptitude", []) if isinstance(data, dict) else [],
            APTITUDE_QUESTION_COUNT,
        )

        if (
            len(technical) == TECHNICAL_QUESTION_COUNT
            and len(programming) == PROGRAMMING_QUESTION_COUNT
            and len(aptitude) == APTITUDE_QUESTION_COUNT
        ):
            plan = technical + programming + aptitude
            print("Gemini generated 20 resume-personalized interview questions.")
            return plan

        print("WARNING: Gemini returned an incomplete question plan. Using resume-aware fallback questions.")

    except Exception as exc:
        print(f"WARNING: Gemini question generation failed: {exc}")
        print("Using resume-aware fallback questions.")

    return _fallback_plan(resume_text, skill)
