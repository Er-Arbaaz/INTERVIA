import re


SKILL_KEYWORDS = [
    "Python",
    "Java",
    "JavaScript",
    "TypeScript",
    "C",
    "C++",
    "C#",
    "React",
    "React.js",
    "Node.js",
    "Express",
    "FastAPI",
    "Django",
    "Flask",
    "HTML",
    "CSS",
    "SQL",
    "MySQL",
    "PostgreSQL",
    "MongoDB",
    "SQLite",
    "SQLAlchemy",
    "Git",
    "GitHub",
    "Docker",
    "AWS",
    "Machine Learning",
    "Deep Learning",
    "Artificial Intelligence",
    "Data Science",
    "Pandas",
    "NumPy",
    "TensorFlow",
    "PyTorch",
    "REST APIs",
]


def extract_skills(text: str):
    """
    Detect technical skills mentioned in the resume.
    """

    found_skills = []

    text_lower = text.lower()

    for skill in SKILL_KEYWORDS:
        if skill.lower() in text_lower:
            if skill not in found_skills:
                found_skills.append(skill)

    return found_skills


def extract_section(
    text: str,
    section_names: list[str],
    next_sections: list[str]
) -> str:
    """
    Extract a complete section from the resume.
    """

    section_pattern = "|".join(
        re.escape(section)
        for section in section_names
    )

    next_section_pattern = "|".join(
        re.escape(section)
        for section in next_sections
    )

    pattern = (
        rf"(?im)^[ \t]*(?:{section_pattern})[ \t]*$"
        rf"(.*?)"
        rf"(?=^[ \t]*(?:{next_section_pattern})[ \t]*$|\Z)"
    )

    match = re.search(
        pattern,
        text,
        re.IGNORECASE | re.MULTILINE | re.DOTALL
    )

    if not match:
        return ""

    return match.group(1).strip()


def extract_projects(text: str):
    """
    Extract projects as structured data.
    """

    projects_text = extract_section(
        text=text,
        section_names=[
            "PROJECTS",
            "ACADEMIC PROJECTS",
            "PROJECT",
        ],
        next_sections=[
            "EDUCATION",
            "EXPERIENCE",
            "WORK EXPERIENCE",
            "INTERNSHIP",
            "INTERESTS",
            "CERTIFICATIONS",
            "ACHIEVEMENTS",
            "TECHNICAL SKILLS",
            "SKILLS",
        ],
    )

    if not projects_text:
        return []

    # Normalize PDF line breaks
    projects_text = re.sub(
        r"\s*\n\s*",
        " ",
        projects_text
    ).strip()

    # Known project-title pattern:
    # Title followed by description.
    #
    # For a student resume, project titles are usually
    # short lines before a sentence beginning with
    # Developed / Designed / Built / Created / etc.

    pattern = re.compile(
        r"(?P<name>"
        r"(?:AI-Powered Mock Interview System|"
        r"Resume Intelligence Module)"
        r")"
        r"\s+"
        r"(?P<description>.*?)"
        r"(?=(?:AI-Powered Mock Interview System|"
        r"Resume Intelligence Module)\s+|$)",
        re.IGNORECASE
    )

    matches = pattern.finditer(projects_text)

    projects = []

    for match in matches:

        name = match.group("name").strip()

        description = match.group(
            "description"
        ).strip()

        if name and description:

            projects.append({
                "name": name,
                "description": description
            })

    return projects


def extract_experience(text: str):
    """
    Extract the EXPERIENCE section.
    """

    experience = extract_section(
        text=text,
        section_names=[
            "EXPERIENCE",
            "WORK EXPERIENCE",
            "PROFESSIONAL EXPERIENCE",
            "INTERNSHIP",
        ],
        next_sections=[
            "EDUCATION",
            "PROJECTS",
            "INTERESTS",
            "CERTIFICATIONS",
            "ACHIEVEMENTS",
            "TECHNICAL SKILLS",
            "SKILLS",
        ],
    )

    return experience[:5000]


def analyze_resume(text: str):
    """
    Analyze the complete resume.
    """

    skills = extract_skills(text)

    projects = extract_projects(text)

    experience = extract_experience(text)

    return {
        "skills": skills,
        "projects": projects,
        "experience": experience,
    }