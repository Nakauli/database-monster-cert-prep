import json
import sqlite3
import time
from pathlib import Path

from app.database_lab_runner import reset_database, run_sql_file
from app.exam_engine import (
    EXAMS_DIR,
    ExamSession,
    create_configured_exam,
    create_panic_quiz,
    create_random_exam,
)
from app.question_bank import load_question_bank
from app.weakness_tracker import load_progress, record_attempt, reset_progress


def test_question_bank_has_360_valid_balanced_questions():
    questions = load_question_bank()
    assert len(questions) == 360
    assert len({question["id"] for question in questions}) == 360
    assert {question["type"] for question in questions} >= {
        "multiple_choice", "multi_select", "true_false", "sql_output", "scenario"
    }
    counts = {}
    for question in questions:
        counts[question["topic"]] = counts.get(question["topic"], 0) + 1
        assert question["correct_answer"]
        assert question["explanation"]
        assert question["why_wrong_answers"]
        assert len(question["recommended_review"]) == 2
    assert len(counts) == 12
    assert set(counts.values()) == {30}


def test_random_and_panic_exam_sizes():
    full = create_random_exam(count=35, seed=7)
    panic = create_panic_quiz(count=10, seed=7)
    assert len(full.questions) == 35
    assert full.duration_minutes == 50
    assert len(panic.questions) == 10
    assert panic.mode == "panic"


def test_configured_exams_are_valid():
    expected = {
        "diagnostic_exam.json": 40,
        "certiport_style_exam_01.json": 40,
        "certiport_style_exam_02.json": 40,
        "certiport_style_exam_03.json": 40,
        "final_boss_exam.json": 45,
    }
    for filename, count in expected.items():
        path = EXAMS_DIR / filename
        config = json.loads(path.read_text(encoding="utf-8"))
        assert len(config["question_ids"]) == count
        session = create_configured_exam(filename)
        assert len(session.questions) == count
        assert session.duration_minutes == 50
        session_from_relative_path = create_configured_exam(Path("exams") / filename)
        assert len(session_from_relative_path.questions) == count


def test_exam_session_times_out_and_scores():
    question = load_question_bank()[0]
    session = ExamSession([question], duration_minutes=1)
    session.answer(question["id"], question["correct_answer"])
    session.started_monotonic = time.monotonic() - 61
    assert session.expired
    assert session.submit()["percentage"] == 100.0


def test_weakness_tracker_uses_temp_files(tmp_path: Path):
    progress_path = tmp_path / "progress.json"
    mistakes_path = tmp_path / "mistakes.json"
    reset_progress(progress_path, mistakes_path)
    question = load_question_bank()[0]
    session = ExamSession([question])
    report = session.submit()
    record_attempt(report, "test", 12, progress_path, mistakes_path)
    progress = load_progress(progress_path)
    mistakes = json.loads(mistakes_path.read_text(encoding="utf-8"))
    assert len(progress["attempts"]) == 1
    assert progress["weak_topics"]
    assert len(mistakes["mistakes"]) == 1


def test_sample_database_can_be_created_and_lab_runs(tmp_path: Path):
    database = tmp_path / "school.db"
    reset_database(database)
    connection = sqlite3.connect(database)
    try:
        assert connection.execute("SELECT COUNT(*) FROM students").fetchone()[0] == 9
        assert connection.execute("SELECT COUNT(*) FROM enrollments").fetchone()[0] == 11
        assert connection.execute("PRAGMA foreign_keys").fetchone()[0] in (0, 1)
    finally:
        connection.close()
    lab = Path(__file__).resolve().parents[1] / "labs" / "lab_01_select_basics.sql"
    results = run_sql_file(lab, database)
    assert any(result.get("rows") for result in results)
    database.unlink()
    assert not database.exists()
