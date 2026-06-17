"""Flask dashboard for Database Monster Cert Prep."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

from flask import Flask, abort, jsonify, redirect, render_template, request, url_for


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.exam_engine import EXAMS_DIR, create_configured_exam, create_random_exam  # noqa: E402
from app.question_bank import load_question_bank  # noqa: E402
from app.scoring import score_answers  # noqa: E402
from app.weakness_tracker import load_mistakes, load_progress, record_attempt, reset_progress  # noqa: E402


app = Flask(__name__)
app.config["SECRET_KEY"] = "local-database-monster"


def _public_questions(questions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "id": question["id"],
            "topic": question["topic"],
            "difficulty": question["difficulty"],
            "type": question["type"],
            "question": question["question"],
            "choices": question["choices"],
        }
        for question in questions
    ]


def _exam_cards() -> list[dict[str, Any]]:
    cards = []
    for path in sorted(EXAMS_DIR.glob("*.json")):
        config = json.loads(path.read_text(encoding="utf-8"))
        cards.append(
            {
                "slug": path.stem,
                "title": config["title"],
                "count": len(config["question_ids"]),
                "minutes": config.get("duration_minutes", 50),
            }
        )
    return cards


@app.get("/")
def index() -> str:
    progress = load_progress()
    mistakes = load_mistakes()["mistakes"]
    latest = progress["attempts"][-1] if progress["attempts"] else None
    return render_template(
        "index.html",
        progress=progress,
        latest=latest,
        mistake_count=len(mistakes),
        exam_cards=_exam_cards(),
    )


@app.get("/exam/<name>")
def configured_exam(name: str) -> str:
    try:
        session = create_configured_exam(name)
    except (FileNotFoundError, KeyError, ValueError, json.JSONDecodeError):
        abort(404)
    return render_template(
        "exam.html",
        title=session.mode.replace("_", " ").title(),
        questions=_public_questions(session.questions),
        question_ids=[question["id"] for question in session.questions],
        duration_minutes=session.duration_minutes,
        mode=session.mode,
    )


@app.get("/random-exam")
def random_exam() -> str:
    session = create_random_exam()
    return render_template(
        "exam.html",
        title="Random Timed Exam",
        questions=_public_questions(session.questions),
        question_ids=[question["id"] for question in session.questions],
        duration_minutes=session.duration_minutes,
        mode="web_random_timed",
    )


@app.post("/submit")
def submit_exam() -> str:
    try:
        question_ids = json.loads(request.form["question_ids"])
        answers = json.loads(request.form.get("answers", "{}"))
        elapsed_seconds = max(0, int(request.form.get("elapsed_seconds", "0")))
    except (KeyError, TypeError, ValueError, json.JSONDecodeError):
        abort(400)
    bank = {question["id"]: question for question in load_question_bank()}
    if not isinstance(question_ids, list) or any(question_id not in bank for question_id in question_ids):
        abort(400)
    questions = [bank[question_id] for question_id in question_ids]
    report = score_answers(questions, answers)
    mode = request.form.get("mode", "web_exam")[:80]
    record_attempt(report, mode, elapsed_seconds)
    return render_template("result.html", report=report)


@app.post("/reset-progress")
def reset() -> Any:
    reset_progress()
    return redirect(url_for("index"))


@app.get("/api/progress")
def progress_api() -> Any:
    return jsonify({"progress": load_progress(), "mistakes": load_mistakes()})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)

