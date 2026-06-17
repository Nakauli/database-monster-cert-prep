"""Exam selection, timing, configuration, and scoring orchestration."""

from __future__ import annotations

import json
import random
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from app.question_bank import ROOT, load_question_bank, select_questions
from app.scoring import score_answers


EXAMS_DIR = ROOT / "exams"


@dataclass
class ExamSession:
    questions: list[dict[str, Any]]
    duration_minutes: int = 50
    mode: str = "timed"
    answers: dict[str, Any] = field(default_factory=dict)
    started_monotonic: float = field(default_factory=time.monotonic)

    @property
    def duration_seconds(self) -> int:
        return self.duration_minutes * 60

    @property
    def elapsed_seconds(self) -> int:
        return max(0, int(time.monotonic() - self.started_monotonic))

    @property
    def remaining_seconds(self) -> int:
        return max(0, self.duration_seconds - self.elapsed_seconds)

    @property
    def expired(self) -> bool:
        return self.remaining_seconds <= 0

    def answer(self, question_id: str, selected: Any) -> None:
        if question_id not in {question["id"] for question in self.questions}:
            raise KeyError(f"Unknown question ID: {question_id}")
        self.answers[question_id] = selected

    def unanswered_ids(self) -> list[str]:
        return [question["id"] for question in self.questions if question["id"] not in self.answers]

    def submit(self) -> dict[str, Any]:
        report = score_answers(self.questions, self.answers)
        report["elapsed_seconds"] = self.elapsed_seconds
        report["mode"] = self.mode
        return report


def create_random_exam(
    count: int | None = None,
    duration_minutes: int = 50,
    difficulties: list[str] | None = None,
    topics: list[str] | None = None,
    seed: int | None = None,
) -> ExamSession:
    rng = random.Random(seed)
    count = count if count is not None else rng.randint(35, 45)
    if not 35 <= count <= 45:
        raise ValueError("A full exam must contain 35–45 questions.")
    questions = select_questions(count, difficulties=difficulties, topics=topics, seed=seed)
    return ExamSession(questions, duration_minutes, "timed")


def create_panic_quiz(
    count: int = 10,
    topics: list[str] | None = None,
    seed: int | None = None,
) -> ExamSession:
    if not 5 <= count <= 20:
        raise ValueError("Panic quizzes contain 5–20 questions.")
    questions = select_questions(count, topics=topics, seed=seed)
    return ExamSession(questions, max(5, count), "panic")


def load_exam_config(path_or_name: str | Path) -> dict[str, Any]:
    path = Path(path_or_name)
    if not path.is_absolute() and not path.exists():
        path = EXAMS_DIR / path
    if path.suffix.lower() != ".json":
        path = path.with_suffix(".json")
    return json.loads(path.read_text(encoding="utf-8"))


def create_configured_exam(path_or_name: str | Path) -> ExamSession:
    config = load_exam_config(path_or_name)
    bank = {question["id"]: question for question in load_question_bank()}
    missing = [question_id for question_id in config["question_ids"] if question_id not in bank]
    if missing:
        raise ValueError(f"Exam config references missing IDs: {missing}")
    questions = [bank[question_id] for question_id in config["question_ids"]]
    return ExamSession(
        questions,
        int(config.get("duration_minutes", 50)),
        str(config.get("mode", config.get("title", "configured exam"))),
    )


def write_default_exam_configs() -> list[Path]:
    questions = load_question_bank()
    EXAMS_DIR.mkdir(parents=True, exist_ok=True)
    configs: list[tuple[str, str, int, int, list[dict[str, Any]]]] = []

    # Diagnostic is topic-balanced: first 3 from each topic plus 4 additional mixed questions.
    by_topic: dict[str, list[dict[str, Any]]] = {}
    for question in questions:
        by_topic.setdefault(question["topic"], []).append(question)
    diagnostic = []
    for topic_questions in by_topic.values():
        diagnostic.extend(topic_questions[:3])
    diagnostic.extend(questions[200:204])
    configs.append(("diagnostic_exam.json", "Diagnostic Exam", 50, 40, diagnostic[:40]))

    for number, seed in enumerate((101, 202, 303), start=1):
        rng = random.Random(seed)
        selected = rng.sample(questions, 40)
        configs.append((f"certiport_style_exam_0{number}.json", f"Certiport-Style Exam {number}", 50, 40, selected))

    boss_pool = [q for q in questions if q["difficulty"] in {"hard", "final boss"}]
    boss = random.Random(999).sample(boss_pool, 45)
    configs.append(("final_boss_exam.json", "Final Boss Exam", 50, 45, boss))

    paths: list[Path] = []
    for filename, title, minutes, expected_count, selected in configs:
        if len(selected) != expected_count:
            raise ValueError(f"{title} expected {expected_count} questions.")
        payload = {
            "title": title,
            "duration_minutes": minutes,
            "mode": title.lower().replace(" ", "_"),
            "question_ids": [question["id"] for question in selected],
        }
        path = EXAMS_DIR / filename
        path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
        paths.append(path)
    return paths


if __name__ == "__main__":
    created = write_default_exam_configs()
    print(f"Created {len(created)} exam configurations.")
