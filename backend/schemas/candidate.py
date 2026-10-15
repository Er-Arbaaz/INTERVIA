from typing import Literal

from pydantic import BaseModel


class Candidate(BaseModel):
    name: str
    skill: str
    candidate_type: Literal[
        "technical",
        "non_technical"
    ] = "technical"