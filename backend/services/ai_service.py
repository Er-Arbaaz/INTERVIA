# ============================================================

# INTERVIA — AI EVALUATION SERVICE

# ============================================================

import re
import json
import os
import threading
import hashlib




# Reuse the HTTP connection pool across answer evaluations instead of creating
# a new Gemini client for every submitted answer. The synchronous SDK client
# uses an underlying HTTP client that is intended to support concurrent calls.
_GEMINI_CLIENT = None
_GEMINI_CLIENT_SIGNATURE = None
_GEMINI_CLIENT_LOCK = threading.Lock()


def _get_gemini_client(api_key, genai, types):
    """Return a process-wide Gemini client with bounded request time/retries."""
    global _GEMINI_CLIENT, _GEMINI_CLIENT_SIGNATURE

    try:
        timeout_ms = int(os.getenv("GEMINI_HTTP_TIMEOUT_MS", "25000"))
    except (TypeError, ValueError):
        timeout_ms = 25000
    timeout_ms = max(1000, min(timeout_ms, 120000))

    try:
        retry_attempts = int(os.getenv("GEMINI_HTTP_RETRY_ATTEMPTS", "2"))
    except (TypeError, ValueError):
        retry_attempts = 2
    retry_attempts = max(1, min(retry_attempts, 3))

    signature = (hashlib.sha256(api_key.encode("utf-8")).hexdigest(), timeout_ms, retry_attempts)
    if _GEMINI_CLIENT is not None and _GEMINI_CLIENT_SIGNATURE == signature:
        return _GEMINI_CLIENT

    with _GEMINI_CLIENT_LOCK:
        if _GEMINI_CLIENT is None or _GEMINI_CLIENT_SIGNATURE != signature:
            http_options = types.HttpOptions(
                timeout=timeout_ms,
                retry_options=types.HttpRetryOptions(
                    attempts=retry_attempts,
                    initial_delay=0.25,
                    max_delay=2.0,
                    jitter=0.2,
                ),
            )
            _GEMINI_CLIENT = genai.Client(
                api_key=api_key,
                http_options=http_options,
            )
            _GEMINI_CLIENT_SIGNATURE = signature

    return _GEMINI_CLIENT


# ============================================================

# COMMON NON-ANSWER PHRASES

# ============================================================

NON_ANSWER_PHRASES = {

    "i don't know",

    "i dont know",

    "don't know",

    "dont know",

    "no idea",

    "not sure",

    "i am not sure",

    "i'm not sure",

    "cannot answer",

    "can't answer",

    "cant answer",

    "no answer",

    "i have no idea",

    "i don't understand",

    "i dont understand",

}

# ============================================================

# STOP WORDS

# Used only when checking whether an answer is related

# to the question.

# ============================================================

STOP_WORDS = {

    "what",

    "what's",

    "whats",

    "is",

    "are",

    "was",

    "were",

    "the",

    "a",

    "an",

    "and",

    "or",

    "of",

    "to",

    "in",

    "on",

    "for",

    "with",

    "from",

    "by",

    "as",

    "at",

    "how",

    "why",

    "when",

    "where",

    "which",

    "who",

    "can",

    "could",

    "would",

    "should",

    "do",

    "does",

    "did",

    "you",

    "your",

    "explain",

    "describe",

    "tell",

    "give",

    "example",

    "examples",

    "difference",

    "between",

    "used",

    "use",

    "using",

    "about",

    "into",

    "than",

    "then",

    "it",

    "this",

    "that",

    "these",

    "those",

}

# ============================================================

# TEXT HELPERS

# ============================================================

def normalize_text(text: str) -> str:

    """

    Normalize text for reliable comparison.

    """

    text = text.lower().strip()

    text = re.sub(r"[^a-z0-9+#.\s]", " ", text)

    text = re.sub(r"\s+", " ", text)

    return text

def get_meaningful_words(text: str) -> set:

    """

    Extract meaningful words from text.

    Stop words are removed so that generic words such as

    'what', 'is', 'the', etc. do not count as relevance.

    """

    normalized = normalize_text(text)

    words = normalized.split()

    meaningful_words = set()

    for word in words:

        if word in STOP_WORDS:

            continue

        if len(word) < 3:

            continue

        # Numbers often appear in aptitude questions but are not concepts.
        if word.isdigit():

            continue

        meaningful_words.add(word)

    return meaningful_words

def is_non_answer(answer: str) -> bool:

    """

    Detect explicit non-answers such as:

        'I don't know'

        'No idea'

        'Not sure'

    """

    normalized = normalize_text(answer)

    if not normalized:

        return True

    if normalized in NON_ANSWER_PHRASES:

        return True

    return False

def is_gibberish_or_too_short(answer: str) -> bool:

    """

    Detect obviously unusable answers.

    This intentionally does NOT reject every short answer because

    some valid interview answers can be concise.

    """

    normalized = normalize_text(answer)

    if not normalized:

        return True

    words = normalized.split()

    # Very short meaningless responses.

    if len(words) == 1:

        if words[0] in {

            "yes",

            "no",

            "okay",

            "ok",

            "maybe",

            "nothing",

            "hello",

            "hi",

        }:

            return True

    return False

def is_answer_related(question: str, answer: str) -> bool:

    """

    Determine whether an answer has at least some meaningful

    relationship to the question.

    This is intentionally conservative:

    it only rejects an answer when there is effectively no

    meaningful connection at all.

    Question-specific evaluation below remains responsible

    for determining the actual quality score.

    """

    question_words = get_meaningful_words(question)

    answer_words = get_meaningful_words(answer)

    if not question_words or not answer_words:

        return False

    # Direct meaningful-word overlap.

    direct_matches = question_words.intersection(answer_words)

    if direct_matches:

        return True

    # Basic singular/plural and word-prefix matching.

    for question_word in question_words:

        for answer_word in answer_words:

            if len(question_word) >= 5 and len(answer_word) >= 5:

                if (

                    question_word.startswith(answer_word[:5])

                    or answer_word.startswith(question_word[:5])

                ):

                    return True

    # Numerical/logical answers may use solution words without repeating
    # the question vocabulary (e.g. add/divide when solving an average).
    solution_cues = {
        "because", "therefore", "first", "then", "calculate", "add", "sum",
        "subtract", "multiply", "divide", "average", "equals", "equal", "result",
        "probability", "ratio", "percentage", "compare", "loop", "iterate",
        "return", "output", "binary search", "linear search", "complexity",
        "o(n)", "o(1)", "o(log n)", "step", "steps"
    }
    normalized_answer = normalize_text(answer)
    if any(cue in normalized_answer for cue in solution_cues):
        return True

    return False

# ============================================================

# INTERVIA — ANSWER EVALUATION

# ============================================================

def evaluate_answer_rules(question: str, answer: str):

    """

    Evaluate a candidate answer using strict deterministic checks.

    Scoring philosophy:

        0   = empty, non-answer, gibberish, or clearly irrelevant

        1-2 = very poor / mostly incorrect

        3-4 = partially correct but major concepts missing

        5-6 = moderate understanding with important gaps

        7-8 = good and mostly correct

        9-10 = strong, accurate, complete answer

    IMPORTANT:

    Answer length alone NEVER increases the score.

    """

    question_lower = normalize_text(question)

    answer_lower = normalize_text(answer)

    cleaned_answer = answer.strip()

    # ========================================================

    # STEP 1 — EMPTY / NON-ANSWER

    # ========================================================

    if not cleaned_answer:

        return {

            "score": 0,

            "feedback": (

                "No answer was provided. Please attempt the "

                "question and explain your understanding."

            ),

            "difficulty": "easier"

        }

    if is_non_answer(cleaned_answer):

        return {

            "score": 0,

            "feedback": (

                "No meaningful answer was provided. The response "

                "does not demonstrate understanding of the question."

            ),

            "difficulty": "easier"

        }

    if is_gibberish_or_too_short(cleaned_answer):

        return {

            "score": 0,

            "feedback": (

                "The response does not provide a meaningful answer "

                "to the question."

            ),

            "difficulty": "easier"

        }

    # ========================================================

    # STEP 2 — RELEVANCE

    # ========================================================

    if not is_answer_related(question, cleaned_answer):

        return {

            "score": 0,

            "feedback": (

                "The answer is not relevant to the question. "

                "It does not address the concept being asked."

            ),

            "difficulty": "easier"

        }

    # ========================================================

    # STEP 3 — QUESTION-SPECIFIC EVALUATION

    # ========================================================

    score = 3

    strengths = []

    weaknesses = []

    # ========================================================

    # PYTHON — LIST VS TUPLE

    # ========================================================

    if "list" in question_lower and "tuple" in question_lower:

        concepts = {

            "list": "list",

            "tuple": "tuple",

            "mutable": "mutability",

            "immutable": "immutability",

            "square brackets": "list syntax",

            "parentheses": "tuple syntax",

            "change": "ability to modify values",

            "ordered": "ordered sequence"

        }

        matched = [

            name

            for keyword, name in concepts.items()

            if keyword in answer_lower

        ]

        if "list" not in answer_lower or "tuple" not in answer_lower:

            score = 2

            weaknesses.append(

                "The answer does not clearly explain both lists and tuples."

            )

        elif "mutable" in answer_lower and "immutable" in answer_lower:

            score = 9

            strengths.append(

                "Correctly explained mutability differences."

            )

            if (

                "square brackets" in answer_lower

                or "parentheses" in answer_lower

            ):

                score = 10

        elif len(matched) >= 3:

            score = 7

            weaknesses.append(

                "The main difference is mentioned, but the explanation "

                "needs more precision."

            )

        else:

            score = 4

            weaknesses.append(

                "Important differences between lists and tuples are missing."

            )

    # ========================================================

    # PYTHON — OBJECT ORIENTED PROGRAMMING

    # ========================================================

    elif "object-oriented" in question_lower:

        concepts = [

            "class",

            "object",

            "inheritance",

            "encapsulation",

            "polymorphism",

            "abstraction"

        ]

        matched = sum(

            1 for concept in concepts

            if concept in answer_lower

        )

        if matched >= 5:

            score = 9

            strengths.append(

                "Covered most major object-oriented programming concepts."

            )

        elif matched >= 3:

            score = 7

            weaknesses.append(

                "Some important OOP principles were not explained."

            )

        elif matched >= 1:

            score = 4

            weaknesses.append(

                "Only a small part of object-oriented programming was explained."

            )

        else:

            score = 1

            weaknesses.append(

                "The answer does not explain the core OOP concepts."

            )

    # ========================================================

    # PYTHON — DECORATORS

    # ========================================================

    elif "decorator" in question_lower:

        concepts = [

            "function",

            "wrapper",

            "wrap",

            "modify",

            "behavior",

            "@"

        ]

        matched = sum(

            1 for concept in concepts

            if concept in answer_lower

        )

        if matched >= 4:

            score = 9

            strengths.append(

                "Correctly described decorators and their purpose."

            )

        elif matched >= 2:

            score = 6

            weaknesses.append(

                "The basic idea is present, but the decorator mechanism "

                "needs clearer explanation."

            )

        else:

            score = 2

            weaknesses.append(

                "The answer does not correctly explain Python decorators."

            )

    # ========================================================

    # PYTHON — SHALLOW VS DEEP COPY

    # ========================================================

    elif (

        "shallow copy" in question_lower

        and "deep copy" in question_lower

    ):

        shallow_concepts = [

            "reference",

            "nested",

            "shared"

        ]

        deep_concepts = [

            "independent",

            "deepcopy",

            "copy module"

        ]

        shallow_matches = sum(

            1 for concept in shallow_concepts

            if concept in answer_lower

        )

        deep_matches = sum(

            1 for concept in deep_concepts

            if concept in answer_lower

        )

        if shallow_matches >= 1 and deep_matches >= 2:

            score = 9

            strengths.append(

                "Correctly distinguished shallow and deep copying."

            )

        elif shallow_matches >= 1 or deep_matches >= 1:

            score = 5

            weaknesses.append(

                "The difference between shallow and deep copying "

                "needs more explanation."

            )

        else:

            score = 2

            weaknesses.append(

                "The answer does not explain the copying behavior correctly."

            )

    # ========================================================

    # JAVA — JDK VS JRE

    # ========================================================

    elif "jdk" in question_lower and "jre" in question_lower:

        concepts = [

            "jdk",

            "jre",

            "jvm",

            "development",

            "runtime",

            "compile",

            "execute"

        ]

        matched = sum(

            1 for concept in concepts

            if concept in answer_lower

        )

        if (

            "jdk" in answer_lower

            and "jre" in answer_lower

            and "runtime" in answer_lower

        ):

            score = 8

            if "development" in answer_lower:

                score = 9

            strengths.append(

                "Correctly identified the roles of JDK and JRE."

            )

        elif matched >= 3:

            score = 6

            weaknesses.append(

                "The distinction between JDK and JRE is incomplete."

            )

        else:

            score = 2

            weaknesses.append(

                "The answer does not correctly distinguish JDK and JRE."

            )

    # ========================================================

    # JAVA — INHERITANCE

    # ========================================================

    elif "inheritance" in question_lower and "java" in question_lower:

        concepts = [

            "class",

            "parent",

            "child",

            "superclass",

            "subclass",

            "extends",

            "reuse"

        ]

        matched = sum(

            1 for concept in concepts

            if concept in answer_lower

        )

        if matched >= 5:

            score = 9

            strengths.append(

                "Correctly explained Java inheritance."

            )

        elif matched >= 3:

            score = 7

            weaknesses.append(

                "The inheritance explanation needs a little more detail."

            )

        elif matched >= 1:

            score = 4

            weaknesses.append(

                "Only part of the inheritance concept was explained."

            )

        else:

            score = 1

            weaknesses.append(

                "The answer does not explain Java inheritance."

            )

    # ========================================================

    # JAVASCRIPT — LET / CONST / VAR

    # ========================================================

    elif (

        "let" in question_lower

        and "const" in question_lower

        and "var" in question_lower

    ):

        concepts = [

            "scope",

            "block",

            "function",

            "reassign",

            "redeclaration",

            "hoisting"

        ]

        matched = sum(

            1 for concept in concepts

            if concept in answer_lower

        )

        if matched >= 5:

            score = 9

            strengths.append(

                "Covered the important differences between let, const and var."

            )

        elif matched >= 3:

            score = 7

            weaknesses.append(

                "Some scope or reassignment differences are missing."

            )

        elif matched >= 1:

            score = 4

            weaknesses.append(

                "Only a small part of the let/const/var differences was explained."

            )

        else:

            score = 1

            weaknesses.append(

                "The answer does not correctly explain let, const and var."

            )

    # ========================================================

    # JAVASCRIPT — CLOSURES

    # ========================================================

    elif "closure" in question_lower:

        concepts = [

            "function",

            "scope",

            "outer",

            "variable",

            "lexical",

            "inner"

        ]

        matched = sum(

            1 for concept in concepts

            if concept in answer_lower

        )

        if matched >= 4:

            score = 9

            strengths.append(

                "Correctly described the relationship between closures "

                "and lexical scope."

            )

        elif matched >= 2:

            score = 6

            weaknesses.append(

                "The closure concept is partially explained but needs "

                "a clearer description."

            )

        else:

            score = 2

            weaknesses.append(

                "The answer does not correctly explain JavaScript closures."

            )

    # ========================================================

    # JAVASCRIPT — == VS ===

    # ========================================================

    elif "==" in question_lower and "===" in question_lower:

        concepts = [

            "strict",

            "type",

            "conversion",

            "coercion",

            "value",

            "equality"

        ]

        matched = sum(

            1 for concept in concepts

            if concept in answer_lower

        )

        if (

            "strict" in answer_lower

            and "type" in answer_lower

        ):

            score = 9

            strengths.append(

                "Correctly explained strict equality and type checking."

            )

        elif matched >= 2:

            score = 6

            weaknesses.append(

                "The difference between == and === needs more precision."

            )

        else:

            score = 2

            weaknesses.append(

                "The answer does not correctly explain == versus ===."

            )

    # ========================================================

    # PROGRAMMING / APTITUDE / UNKNOWN QUESTIONS
    # ========================================================

    else:
        # Deterministic fallback rubric. Without a model or trusted answer key,
        # factual correctness cannot always be proven; math/programming answers
        # nevertheless receive task-specific credit rather than keyword-only scoring.
        # Keep punctuation for notation such as O(log n), which normalization
        # otherwise strips into a different form.
        lower = cleaned_answer.lower()
        meaningful_question_words = get_meaningful_words(question)
        meaningful_answer_words = get_meaningful_words(cleaned_answer)
        overlap = len(meaningful_question_words.intersection(meaningful_answer_words))
        coverage = overlap / max(1, len(meaningful_question_words))

        reasoning_markers = (
            "because", "therefore", "so that", "this means", "first", "then",
            "step", "calculate", "subtract", "multiply", "divide", "compare",
            "condition", "loop", "iterate", "return", "output", "result",
            "time complexity", "space complexity", "big o", "o(n)", "o(1)",
            "o(log n)", "o(n log n)", "edge case", "boundary", "sorted",
            "midpoint", "binary search"
        )
        example_markers = ("for example", "e.g.", "example:", "suppose", "input", "output")
        reasoning_count = sum(1 for marker in reasoning_markers if marker in lower)
        has_example = any(marker in lower for marker in example_markers)
        is_programming = any(term in question_lower for term in (
            "code", "program", "algorithm", "function", "array", "string",
            "loop", "complexity", "debug", "write a", "implement", "output", "find an item"
        ))
        is_aptitude = any(term in question_lower for term in (
            "probability", "percentage", "ratio", "average", "speed", "distance",
            "work", "time", "sequence", "series", "logical", "reasoning", "how many",
            "calculate", "sum of", "divisible"
        ))

        # Verify common arithmetic forms without depending on word overlap.
        question_numbers = [float(x) for x in re.findall(r"(?<![A-Za-z])\d+(?:\.\d+)?", question)]
        answer_numbers = [float(x) for x in re.findall(r"(?<![A-Za-z])\d+(?:\.\d+)?", cleaned_answer)]
        arithmetic_verified = False
        if is_aptitude and question_numbers and answer_numbers:
            q = question_lower
            expected = None
            if "average" in q and len(question_numbers) >= 2:
                expected = sum(question_numbers) / len(question_numbers)
            elif ("sum" in q or "add" in q) and len(question_numbers) >= 2:
                expected = sum(question_numbers)
            elif "percentage" in q and len(question_numbers) >= 2:
                expected = question_numbers[0] * question_numbers[1] / 100
            if expected is not None:
                arithmetic_verified = any(abs(n - expected) < 1e-6 for n in answer_numbers)

        if arithmetic_verified:
            score = 9 if reasoning_count >= 1 else 8
            strengths.append("The numerical result matches the calculation implied by the question.")
            if reasoning_count >= 1:
                strengths.append("The answer shows the calculation method, not just a result.")
            else:
                weaknesses.append("Briefly show the calculation steps so the result can be verified.")
        elif is_programming and any(term in lower for term in (
            "binary search", "linear search", "hash map", "hash table", "two pointer", "two-pointer"
        )):
            score = 7
            strengths.append("The answer identifies a plausible algorithmic approach.")
            if any(term in lower for term in ("o(log n)", "o(n)", "o(1)", "o(n log n)")):
                score += 1
                strengths.append("Time complexity is addressed.")
            else:
                weaknesses.append("State the time complexity and explain the approach's assumptions.")
            if "binary search" in lower and "sorted" not in lower:
                weaknesses.append("Binary search requires the input array to be sorted.")
        else:
            # Keyword overlap is only a weak signal, not a correctness proof.
            if overlap == 0:
                score = 2 if reasoning_count else 1
                weaknesses.append("The answer gives little evidence tied to the question's key concepts.")
            elif coverage < 0.20:
                score = 4
                weaknesses.append("Connect the explanation more directly to the key concept being asked about.")
            elif coverage < 0.40:
                score = 5
                weaknesses.append("Some relevant points are present; add the key definition or missing steps.")
            else:
                score = 6
                weaknesses.append("The answer is relevant, but factual correctness needs a trusted answer key or semantic model to verify fully.")

            if reasoning_count >= 3:
                score += 2
                strengths.append("The response includes multiple reasoning or method cues.")
            elif reasoning_count >= 1:
                score += 1
                strengths.append("The response explains at least part of its approach.")
            if has_example:
                score += 1
                strengths.append("An example or worked case is included.")
            if is_aptitude and not arithmetic_verified:
                weaknesses.append("Show the calculation or logical steps and make the final result explicit.")
            if is_programming and not any(term in lower for term in ("complexity", "o(n)", "o(1)", "o(log n)", "o(n log n)")):
                weaknesses.append("When relevant, state time complexity and mention important edge cases.")

        # Longer answers alone must not earn points.
        score = min(score, 9)

    # FINAL SCORE SAFETY

    # ========================================================

    score = max(0, min(10, int(score)))

    # ========================================================

    # BUILD GENUINE FEEDBACK

    # ========================================================

    if score >= 9:

        feedback = (
            "Strong response. It addresses the question and includes useful reasoning; "
            "verify the details against the expected solution."
        )

    elif score >= 8:

        feedback = (
            "Very good response. The main idea is addressed; check any remaining details or edge cases."
        )

    elif score >= 7:

        feedback = (
            "Good response. Strengthen it with precise details, a worked example, or edge-case checks where relevant."
        )

    elif score >= 5:

        feedback = (
            "Partially complete response. Some relevant ideas are present, but important concepts or reasoning are missing."
        )

    elif score >= 3:

        feedback = (
            "Limited evidence of understanding. Address the core question directly and show the reasoning step by step."
        )

    elif score >= 1:

        feedback = (
            "The response contains very little usable evidence. Revisit the core concept and give a direct explanation."
        )

    else:

        feedback = (

            "The response does not provide a valid answer to the question."

        )

    # Add specific weakness information.

    if weaknesses:

        feedback += " " + " ".join(weaknesses)

    # Add strength information when appropriate.

    if strengths:

        feedback += " " + " ".join(strengths)

    # ========================================================

    # ADAPTIVE DIFFICULTY

    # ========================================================

    if score >= 8:

        difficulty = "harder"

    elif score >= 6:

        difficulty = "same"

    else:

        difficulty = "easier"

    # ========================================================

    # RETURN

    # ========================================================

    return {

        "score": score,

        "feedback": feedback,

        "difficulty": difficulty

    }

# ============================================================
# OPTIONAL MODEL-BASED EVALUATION
# ============================================================

def evaluate_answer(question: str, answer: str):
    """Evaluate an interview answer with Gemini; use local rules as fallback.

    Environment variables:
      GEMINI_API_KEY: Gemini API key (never log or return it).
      GEMINI_INTERVIEW_MODEL: model name, defaults to gemini-3.5-flash-lite.

    Return shape stays compatible with the interview route:
      {"score": int 0-10, "feedback": str, "difficulty": easier|same|harder}
    """
    cleaned_question = (question or "").strip()
    cleaned_answer = (answer or "").strip()

    # Keep clear non-answers deterministic and avoid unnecessary API calls.
    if not cleaned_answer or is_non_answer(cleaned_answer):
        return evaluate_answer_rules(cleaned_question, cleaned_answer)

    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return evaluate_answer_rules(cleaned_question, cleaned_answer)

    try:
        from google import genai
        from google.genai import types

        model = (
            os.getenv("GEMINI_INTERVIEW_MODEL", "gemini-3.5-flash-lite").strip()
            or "gemini-3.5-flash-lite"
        )
        client = _get_gemini_client(api_key, genai, types)

        prompt = f"""You are INTERVIA's fair, evidence-based technical mock-interview evaluator.
Grade the candidate's answer to the exact question below. Evaluate meaning and correctness, not keyword overlap, grammar, accent, writing style, or answer length.

SCORING RUBRIC (integer 0-10):
0: blank, explicit non-answer, or wholly irrelevant
1-2: mostly incorrect or almost no valid understanding
3-4: some relevant understanding, but a major misconception or important omissions
5-6: partly correct core idea; meaningful gaps or incomplete reasoning
7-8: correct and reasonably explained, with minor omissions
9-10: accurate, complete, well-reasoned answer; include an example or complexity only when relevant

EVALUATION RULES:
- Judge semantic meaning. Accept equivalent wording, valid alternative methods, and concise answers.
- Do not require the candidate to repeat words from the question.
- For math/aptitude questions, independently solve the problem. Check the candidate's final result and shown steps; a correct concise answer can earn high marks.
- For programming/algorithm questions, check whether the proposed approach actually solves the task, including relevant edge cases and time/space complexity when asked or useful. Do not award credit for merely mentioning code keywords.
- For conceptual questions, identify the essential facts and misconceptions for this specific question.
- If a question is ambiguous or lacks enough information, be conservative and mention the ambiguity in feedback rather than inventing an answer key.
- Feedback must be specific to the candidate's actual response: mention a real strength or error and one practical improvement if needed. Do not claim the candidate included reasoning/examples that are absent.
- Keep feedback concise (2-4 sentences), constructive, and suitable for a student.
- Choose difficulty: harder for scores 8-10; same for scores 5-7; easier for scores 0-4.
- Return exactly one JSON object with keys: score (integer 0-10), feedback (string), difficulty ("easier", "same", or "harder"). No markdown.

QUESTION:
{cleaned_question}

CANDIDATE ANSWER:
{cleaned_answer}
"""
        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0,
                max_output_tokens=400,
            ),
        )

        content = (getattr(response, "text", None) or "").strip()
        if not content:
            raise ValueError("Gemini returned an empty evaluation response")

        # Tolerate accidental markdown fences while still validating the JSON.
        if content.startswith("```"):
            content = re.sub(r"^```(?:json)?\s*|\s*```$", "", content, flags=re.IGNORECASE).strip()
        result = json.loads(content)
        if not isinstance(result, dict):
            raise ValueError("Gemini evaluation response was not a JSON object")

        raw_score = result.get("score")
        score = max(0, min(10, int(round(float(raw_score)))))
        feedback = str(result.get("feedback", "")).strip()
        difficulty = str(result.get("difficulty", "")).strip().lower()
        if difficulty not in {"easier", "same", "harder"}:
            difficulty = get_adaptive_difficulty(score)
        if not feedback:
            feedback = "Your answer was scored, but detailed feedback was unavailable. Review the key concepts and explain your reasoning."

        return {"score": score, "feedback": feedback, "difficulty": difficulty}

    except Exception as exc:
        # Do not expose API keys or provider errors to the candidate. Log only
        # the exception type so backend logs can indicate a fallback occurred.
        import logging
        logging.getLogger(__name__).warning(
            "Gemini evaluation failed (%s); using local fallback evaluator.",
            type(exc).__name__,
        )
        return evaluate_answer_rules(cleaned_question, cleaned_answer)


# ============================================================

# ADAPTIVE DIFFICULTY HELPER

# ============================================================

def get_adaptive_difficulty(score: float) -> str:

    """

    Convert an evaluation score into the next

    interview difficulty recommendation.

    """

    if score >= 8:

        return "harder"

    if score >= 6:

        return "same"

    return "easier"
