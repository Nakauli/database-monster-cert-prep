import json

from app.question_bank import load_question_bank
from web.app import app


def test_dashboard_and_exam_pages_load():
    client = app.test_client()
    dashboard = client.get("/")
    exam = client.get("/exam/diagnostic_exam")
    assert dashboard.status_code == 200
    assert b"Train until the traps look obvious" in dashboard.data
    assert exam.status_code == 200
    assert b"Question 1 of 40" not in exam.data  # Rendered by the client-side exam script.
    assert b"window.EXAM_DATA" in exam.data


def test_progress_api_loads():
    response = app.test_client().get("/api/progress")
    assert response.status_code == 200
    assert "progress" in response.get_json()


def test_exam_submission_renders_scored_result(monkeypatch):
    monkeypatch.setattr("web.app.record_attempt", lambda *args, **kwargs: None)
    question = load_question_bank()[0]
    response = app.test_client().post(
        "/submit",
        data={
            "question_ids": json.dumps([question["id"]]),
            "answers": json.dumps({question["id"]: question["correct_answer"]}),
            "elapsed_seconds": "12",
            "mode": "test",
        },
    )
    assert response.status_code == 200
    assert b"100.0%" in response.data
    assert b"Exam-ready range" in response.data
