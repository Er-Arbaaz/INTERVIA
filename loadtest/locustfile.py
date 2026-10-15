"""INTERVIA staged load test.

Default: one real Gemini evaluation per virtual candidate, then low-rate results polling.
Set INTERVIA_LOAD_QUESTIONS=20 for a complete 20-answer path (up to 700 live AI evaluations at 35 users).
Only run against local/staging systems you control. This creates test candidates and sessions.
"""
import os
import uuid
from locust import HttpUser, task, between


def _question_text(item):
    if isinstance(item, str):
        return item.strip()
    if isinstance(item, dict):
        return str(item.get("question") or item.get("question_text") or "").strip()
    return ""


class InterviaCandidate(HttpUser):
    wait_time = between(0.5, 1.25)

    def on_start(self):
        self.candidate_id = None
        self.session_id = None
        self.current_question = None
        self.answers_submitted = 0
        self.target_questions = max(1, min(20, int(os.getenv("INTERVIA_LOAD_QUESTIONS", "1"))))
        self.completed = False
        self.setup_ok = False

        candidate_name = f"LoadTest-{uuid.uuid4().hex[:12]}"
        with self.client.post(
            "/candidate",
            json={"name": candidate_name, "skill": "auto", "candidate_type": "technical"},
            name="POST /candidate",
            catch_response=True,
        ) as response:
            if response.status_code >= 400:
                response.failure(f"Candidate setup returned HTTP {response.status_code}")
                self.stop(True)
                return
            try:
                payload = response.json()
                self.candidate_id = payload.get("candidate_id") or payload.get("id") or payload.get("candidateId")
            except Exception:
                self.candidate_id = None
            if not self.candidate_id:
                response.failure("Candidate endpoint did not return candidate_id/id")
                self.stop(True)
                return
            response.success()

        with self.client.get(
            f"/interview/start-candidate/{self.candidate_id}",
            name="GET /interview/start-candidate/:id",
            catch_response=True,
        ) as response:
            if response.status_code >= 400:
                response.failure(f"Interview start returned HTTP {response.status_code}")
                self.stop(True)
                return
            try:
                payload = response.json()
                self.session_id = payload.get("session_id") or payload.get("sessionId")
                questions = payload.get("questions") or []
                self.current_question = _question_text(questions[0]) if questions else ""
            except Exception:
                self.session_id = None
                self.current_question = ""
            if not self.session_id or not self.current_question:
                response.failure("Interview start did not return session_id and first question")
                self.stop(True)
                return
            response.success()

        self.setup_ok = True

    @task(5)
    def submit_evaluation(self):
        if not self.setup_ok or self.completed:
            return
        if self.answers_submitted >= self.target_questions:
            return
        if not self.current_question:
            self.completed = True
            return

        # A deliberately generic, non-empty test answer forces the real AI path.
        # It is not intended to be a high-scoring answer; this is a load test, not a grading test.
        test_answer = (
            "I would identify the requirements, choose an appropriate method, "
            "explain the steps, check edge cases, and verify the result."
        )
        params = {
            "question": self.current_question,
            "answer": test_answer,
            "candidate_id": self.candidate_id,
            "session_id": self.session_id,
        }
        with self.client.post(
            "/interview/answer",
            params=params,
            name="POST /interview/answer (Gemini evaluation)",
            catch_response=True,
        ) as response:
            if response.status_code >= 400:
                response.failure(f"Answer submission returned HTTP {response.status_code}: {response.text[:160]}")
                # Don't loop forever on a failed evaluation.
                self.completed = True
                return
            try:
                payload = response.json()
            except Exception:
                response.failure("Answer endpoint returned invalid JSON")
                self.completed = True
                return

            self.answers_submitted += 1
            if payload.get("interview_completed") is True:
                self.completed = True
            else:
                next_question = payload.get("next_question")
                if next_question:
                    self.current_question = _question_text(next_question)
                elif self.answers_submitted < self.target_questions:
                    response.failure("No next_question returned before target was reached")
                    self.completed = True
                    return
            response.success()

    @task(1)
    def read_results(self):
        if not self.setup_ok:
            return
        # Continue generating read traffic after the initial evaluation so 35 users
        # remain active together for the duration of the Locust run.
        with self.client.get(
            f"/interview/results/{self.candidate_id}/{self.session_id}",
            name="GET /interview/results/:candidate/:session",
            catch_response=True,
        ) as response:
            if response.status_code >= 400:
                response.failure(f"Results endpoint returned HTTP {response.status_code}")
            else:
                response.success()
