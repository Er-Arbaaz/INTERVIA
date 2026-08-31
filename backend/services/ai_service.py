# ============================================================
# INTERVIA — AI EVALUATION SERVICE
# ============================================================

def evaluate_answer(question: str, answer: str):
    """
    Evaluate a candidate's answer.

    Current implementation is rule-based.
    It returns:
        - score
        - feedback
        - difficulty recommendation
    """

    question_lower = question.lower()
    answer_lower = answer.lower()

    cleaned_answer = answer.strip()

    score = 5

    # ========================================================
    # PYTHON — LIST VS TUPLE
    # ========================================================

    if "list" in question_lower and "tuple" in question_lower:

        keywords = [
            "mutable",
            "immutable",
            "change",
            "changed",
            "square brackets",
            "parentheses",
            "brackets",
            "ordered",
            "sequence"
        ]

        matched = sum(
            1
            for keyword in keywords
            if keyword in answer_lower
        )

        if matched >= 6:
            score = 9

        elif matched >= 4:
            score = 8

        elif matched >= 2:
            score = 7

        else:
            score = 5

    # ========================================================
    # PYTHON — OBJECT ORIENTED PROGRAMMING
    # ========================================================

    elif "object-oriented" in question_lower:

        keywords = [
            "class",
            "object",
            "inheritance",
            "encapsulation",
            "polymorphism",
            "abstraction"
        ]

        matched = sum(
            1
            for keyword in keywords
            if keyword in answer_lower
        )

        if matched >= 5:
            score = 9

        elif matched >= 3:
            score = 8

        elif matched >= 2:
            score = 7

        else:
            score = 5

    # ========================================================
    # PYTHON — DECORATORS
    # ========================================================

    elif "decorator" in question_lower:

        keywords = [
            "function",
            "wrapper",
            "wrap",
            "modify",
            "behavior",
            "@",
            "function as argument"
        ]

        matched = sum(
            1
            for keyword in keywords
            if keyword in answer_lower
        )

        if matched >= 5:
            score = 9

        elif matched >= 3:
            score = 8

        elif matched >= 2:
            score = 7

        else:
            score = 5

    # ========================================================
    # PYTHON — SHALLOW VS DEEP COPY
    # ========================================================

    elif "shallow copy" in question_lower and "deep copy" in question_lower:

        keywords = [
            "reference",
            "nested",
            "object",
            "copy",
            "independent",
            "deepcopy",
            "copy module"
        ]

        matched = sum(
            1
            for keyword in keywords
            if keyword in answer_lower
        )

        if matched >= 5:
            score = 9

        elif matched >= 3:
            score = 8

        elif matched >= 2:
            score = 7

        else:
            score = 5

    # ========================================================
    # JAVA
    # ========================================================

    elif "jdk" in question_lower and "jre" in question_lower:

        keywords = [
            "jdk",
            "jre",
            "jvm",
            "development",
            "runtime",
            "compile",
            "execute"
        ]

        matched = sum(
            1
            for keyword in keywords
            if keyword in answer_lower
        )

        if matched >= 6:
            score = 9

        elif matched >= 4:
            score = 8

        elif matched >= 2:
            score = 7

        else:
            score = 5

    elif "inheritance" in question_lower and "java" in question_lower:

        keywords = [
            "class",
            "parent",
            "child",
            "superclass",
            "subclass",
            "extends",
            "reuse"
        ]

        matched = sum(
            1
            for keyword in keywords
            if keyword in answer_lower
        )

        if matched >= 5:
            score = 9

        elif matched >= 3:
            score = 8

        elif matched >= 2:
            score = 7

        else:
            score = 5

    # ========================================================
    # JAVASCRIPT
    # ========================================================

    elif "let" in question_lower and "const" in question_lower and "var" in question_lower:

        keywords = [
            "scope",
            "block",
            "function",
            "reassign",
            "redeclaration",
            "hoisting",
            "variable"
        ]

        matched = sum(
            1
            for keyword in keywords
            if keyword in answer_lower
        )

        if matched >= 5:
            score = 9

        elif matched >= 3:
            score = 8

        elif matched >= 2:
            score = 7

        else:
            score = 5

    elif "closure" in question_lower:

        keywords = [
            "function",
            "scope",
            "outer",
            "variable",
            "lexical",
            "inner",
            "remember"
        ]

        matched = sum(
            1
            for keyword in keywords
            if keyword in answer_lower
        )

        if matched >= 5:
            score = 9

        elif matched >= 3:
            score = 8

        elif matched >= 2:
            score = 7

        else:
            score = 5

    elif "==" in question_lower and "===" in question_lower:

        keywords = [
            "strict",
            "type",
            "conversion",
            "coercion",
            "value",
            "equality"
        ]

        matched = sum(
            1
            for keyword in keywords
            if keyword in answer_lower
        )

        if matched >= 4:
            score = 9

        elif matched >= 3:
            score = 8

        elif matched >= 2:
            score = 7

        else:
            score = 5

    # ========================================================
    # GENERAL ANSWER EVALUATION
    # ========================================================

    else:

        if len(cleaned_answer) > 200:
            score = 8

        elif len(cleaned_answer) > 120:
            score = 7

        elif len(cleaned_answer) > 75:
            score = 6

        else:
            score = 5

    # ========================================================
    # FEEDBACK
    # ========================================================

    if score >= 9:

        feedback = (
            "Excellent answer. You covered the important "
            "concepts clearly and demonstrated strong "
            "technical understanding."
        )

    elif score >= 8:

        feedback = (
            "Very good answer. Most important concepts "
            "were covered with good technical understanding."
        )

    elif score >= 7:

        feedback = (
            "Good answer. A few additional technical "
            "details or examples would make it stronger."
        )

    elif score >= 6:

        feedback = (
            "Fair answer. You understand part of the "
            "concept, but more technical explanation "
            "would improve your response."
        )

    else:

        feedback = (
            "The answer needs more detail and technical "
            "explanation. Review the core concept and "
            "try to explain it with an example."
        )

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