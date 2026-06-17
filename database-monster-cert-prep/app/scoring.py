"""Answer normalization, scoring, and study recommendations."""

from __future__ import annotations

from collections import defaultdict
from typing import Any


def _as_list(value: Any) -> list[str]:
    if value is None:
        return []
    values = value if isinstance(value, list) else [value]
    return sorted(str(item).strip().casefold() for item in values)


def is_correct_answer(selected: Any, correct: Any) -> bool:
    """Require an exact set match, including for multi-select questions."""
    return _as_list(selected) == _as_list(correct)


def score_answers(
    questions: list[dict[str, Any]],
    answers: dict[str, Any],
) -> dict[str, Any]:
    topic_counts: dict[str, dict[str, int]] = defaultdict(lambda: {"correct": 0, "total": 0})
    details: list[dict[str, Any]] = []
    correct_count = 0

    for question in questions:
        selected = answers.get(question["id"])
        correct = is_correct_answer(selected, question["correct_answer"])
        if correct:
            correct_count += 1
        stats = topic_counts[question["topic"]]
        stats["total"] += 1
        stats["correct"] += int(correct)
        details.append(
            {
                "question_id": question["id"],
                "topic": question["topic"],
                "difficulty": question["difficulty"],
                "type": question["type"],
                "question": question["question"],
                "selected_answer": selected,
                "correct_answer": question["correct_answer"],
                "is_correct": correct,
                "explanation": question["explanation"],
                "why_wrong_answers": question["why_wrong_answers"],
                "recommended_review": question["recommended_review"],
            }
        )

    total = len(questions)
    percentage = round((correct_count / total * 100) if total else 0.0, 2)
    by_topic: dict[str, dict[str, float | int]] = {}
    for topic, counts in topic_counts.items():
        topic_percent = round(counts["correct"] / counts["total"] * 100, 2)
        by_topic[topic] = {**counts, "percentage": topic_percent}

    weak_topics = [
        {"topic": topic, **stats}
        for topic, stats in sorted(by_topic.items(), key=lambda item: (item[1]["percentage"], item[0]))
        if stats["percentage"] < 80
    ]
    recommendation = _recommendation(percentage, weak_topics)
    return {
        "total": total,
        "correct": correct_count,
        "incorrect": total - correct_count,
        "percentage": percentage,
        "passed": percentage >= 80,
        "exam_ready": percentage >= 85,
        "by_topic": by_topic,
        "weak_topics": weak_topics,
        "recommendation": recommendation,
        "details": details,
    }


def _recommendation(score: float, weak_topics: list[dict[str, Any]]) -> str:
    if not weak_topics and score >= 85:
        return "Exam-ready range. Take another timed exam to prove the score is repeatable."
    if weak_topics:
        names = ", ".join(item["topic"] for item in weak_topics[:3])
        return f"Repair these topics first: {names}. Review the linked note, complete its lab, then run a panic quiz."
    return "Review every missed explanation, then take a focused quiz before another full exam."

