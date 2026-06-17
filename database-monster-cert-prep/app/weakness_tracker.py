"""Persistent progress and mistake-notebook tracking."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
PROGRESS_PATH = ROOT / "data" / "progress.json"
MISTAKES_PATH = ROOT / "data" / "mistake_notebook.json"


def _read(path: Path, default: dict[str, Any]) -> dict[str, Any]:
    if not path.exists():
        return default
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
        return value if isinstance(value, dict) else default
    except (json.JSONDecodeError, OSError):
        return default


def _write(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    temporary.replace(path)


def record_attempt(
    report: dict[str, Any],
    mode: str,
    duration_seconds: int,
    progress_path: Path = PROGRESS_PATH,
    mistakes_path: Path = MISTAKES_PATH,
) -> None:
    now = datetime.now(timezone.utc).isoformat()
    progress = _read(progress_path, {"attempts": [], "topic_stats": {}, "weak_topics": []})
    progress.setdefault("attempts", []).append(
        {
            "timestamp": now,
            "mode": mode,
            "score": report["percentage"],
            "correct": report["correct"],
            "total": report["total"],
            "duration_seconds": duration_seconds,
        }
    )
    topic_stats = progress.setdefault("topic_stats", {})
    for topic, stats in report["by_topic"].items():
        aggregate = topic_stats.setdefault(topic, {"correct": 0, "total": 0, "percentage": 0.0})
        aggregate["correct"] += stats["correct"]
        aggregate["total"] += stats["total"]
        aggregate["percentage"] = round(aggregate["correct"] / aggregate["total"] * 100, 2)
    progress["weak_topics"] = [
        {"topic": topic, **stats}
        for topic, stats in sorted(topic_stats.items(), key=lambda item: (item[1]["percentage"], item[0]))
        if stats["percentage"] < 80
    ]
    _write(progress_path, progress)

    notebook = _read(mistakes_path, {"mistakes": []})
    mistakes = notebook.setdefault("mistakes", [])
    for detail in report["details"]:
        if detail["is_correct"]:
            continue
        mistakes.append(
            {
                "timestamp": now,
                "mode": mode,
                "question_id": detail["question_id"],
                "topic": detail["topic"],
                "question": detail["question"],
                "selected_answer": detail["selected_answer"],
                "correct_answer": detail["correct_answer"],
                "explanation": detail["explanation"],
                "recommended_review": detail["recommended_review"],
                "reflection": "",
            }
        )
    _write(mistakes_path, notebook)


def load_progress(path: Path = PROGRESS_PATH) -> dict[str, Any]:
    return _read(path, {"attempts": [], "topic_stats": {}, "weak_topics": []})


def load_mistakes(path: Path = MISTAKES_PATH) -> dict[str, Any]:
    return _read(path, {"mistakes": []})


def reset_progress(
    progress_path: Path = PROGRESS_PATH,
    mistakes_path: Path = MISTAKES_PATH,
) -> None:
    _write(progress_path, {"attempts": [], "topic_stats": {}, "weak_topics": []})
    _write(mistakes_path, {"mistakes": []})

