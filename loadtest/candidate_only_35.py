"""Database-only concurrency probe for INTERVIA.

Creates one uniquely named test candidate per simulated user. Does not start
interviews or call Gemini. Run only against a local development database.
"""
import uuid
from locust import HttpUser, task


class CandidateInsertProbe(HttpUser):
    """Each virtual user sends exactly one candidate-creation request."""

    @task
    def create_candidate_once(self):
        with self.client.post(
            "/candidate",
            json={
                "name": f"DBProbe-{uuid.uuid4().hex[:12]}",
                "skill": "Python",
                "candidate_type": "technical",
            },
            name="POST /candidate (concurrent insert probe)",
            catch_response=True,
        ) as response:
            if response.status_code >= 400:
                response.failure(
                    f"Candidate insert failed with HTTP {response.status_code}: {response.text[:160]}"
                )
                self.stop(force=True)
                return
            try:
                payload = response.json()
            except Exception:
                response.failure("Candidate endpoint returned invalid JSON")
                self.stop(force=True)
                return
            if not payload.get("id"):
                response.failure("Candidate endpoint did not return an id")
                self.stop(force=True)
                return
            response.success()
        # Every virtual user writes exactly once, avoiding repeated database rows.
        self.stop(force=True)
