"""Command-line interface for Database Monster Cert Prep."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from app.database_lab_runner import DEFAULT_DB, reset_database, run_sql_file
from app.exam_engine import (
    EXAMS_DIR,
    ExamSession,
    create_configured_exam,
    create_panic_quiz,
    create_random_exam,
    write_default_exam_configs,
)
from app.weakness_tracker import load_mistakes, load_progress, record_attempt, reset_progress


ROOT = Path(__file__).resolve().parents[1]


def _format_time(seconds: int) -> str:
    return f"{seconds // 60:02d}:{seconds % 60:02d}"


def _answer_from_letters(raw: str, question: dict[str, Any]) -> str | list[str]:
    letters = [part.strip().upper() for part in raw.split(",") if part.strip()]
    if not letters:
        raise ValueError("Enter a choice letter.")
    indexes = []
    for letter in letters:
        if len(letter) != 1 or not "A" <= letter <= "Z":
            raise ValueError("Use choice letters such as A or A,C.")
        index = ord(letter) - ord("A")
        if index >= len(question["choices"]):
            raise ValueError(f"{letter} is not a choice for this question.")
        indexes.append(index)
    if len(set(indexes)) != len(indexes):
        raise ValueError("Do not repeat a choice.")
    selected = [question["choices"][index] for index in indexes]
    if question["type"] == "multi_select":
        return selected
    if len(selected) != 1:
        raise ValueError("This question requires one answer.")
    return selected[0]


def _show_question(session: ExamSession, index: int) -> None:
    question = session.questions[index]
    print("\n" + "=" * 72)
    print(
        f"Question {index + 1}/{len(session.questions)} | {question['topic']} | "
        f"{question['difficulty']} | time {_format_time(session.remaining_seconds)}"
    )
    print(question["question"])
    for choice_index, choice in enumerate(question["choices"]):
        marker = chr(ord("A") + choice_index)
        print(f"  {marker}. {choice}")
    if question["id"] in session.answers:
        print(f"Saved answer: {session.answers[question['id']]}")
    print("Commands: answer A or A,C | n next | p previous | g 12 | r review | submit")


def _review(session: ExamSession) -> None:
    print("\nReview map:")
    for index, question in enumerate(session.questions, start=1):
        mark = "answered" if question["id"] in session.answers else "UNANSWERED"
        print(f"  {index:02d}. {mark} — {question['topic']}")


def run_interactive_exam(session: ExamSession, save: bool = True) -> dict[str, Any]:
    index = 0
    while True:
        if session.expired:
            print("\nTime expired. Submitting saved answers.")
            break
        _show_question(session, index)
        raw = input("> ").strip()
        if session.expired:
            print("\nTime expired. Submitting saved answers.")
            break
        command = raw.casefold()
        if command == "n":
            index = min(len(session.questions) - 1, index + 1)
        elif command == "p":
            index = max(0, index - 1)
        elif command == "r":
            _review(session)
        elif command.startswith("g "):
            try:
                target = int(command.split(maxsplit=1)[1]) - 1
                if not 0 <= target < len(session.questions):
                    raise ValueError
                index = target
            except ValueError:
                print("Enter a valid question number, for example: g 12")
        elif command in {"submit", "s"}:
            unanswered = session.unanswered_ids()
            if unanswered:
                confirmation = input(f"{len(unanswered)} unanswered. Type SUBMIT to finish: ").strip()
                if confirmation != "SUBMIT":
                    continue
            break
        else:
            try:
                session.answer(session.questions[index]["id"], _answer_from_letters(raw, session.questions[index]))
                if index < len(session.questions) - 1:
                    index += 1
            except ValueError as error:
                print(f"Invalid answer: {error}")

    report = session.submit()
    if save:
        record_attempt(report, session.mode, report["elapsed_seconds"])
    print_report(report)
    return report


def print_report(report: dict[str, Any]) -> None:
    label = "EXAM-READY" if report["exam_ready"] else ("PASS RANGE" if report["passed"] else "REPAIR REQUIRED")
    print("\n" + "#" * 72)
    print(f"{report['correct']}/{report['total']} = {report['percentage']:.2f}% — {label}")
    print(report["recommendation"])
    print("\nTopic results:")
    for topic, stats in sorted(report["by_topic"].items()):
        print(f"  {topic}: {stats['correct']}/{stats['total']} ({stats['percentage']:.1f}%)")
    print("\nAnswer explanations:")
    for number, detail in enumerate(report["details"], start=1):
        status = "CORRECT" if detail["is_correct"] else "WRONG"
        print(f"\n{number}. [{status}] {detail['question']}")
        print(f"   Your answer: {detail['selected_answer']}")
        print(f"   Correct: {detail['correct_answer']}")
        print(f"   Why: {detail['explanation']}")
        if not detail["is_correct"]:
            if detail["selected_answer"] is not None:
                selected_values = (
                    detail["selected_answer"]
                    if isinstance(detail["selected_answer"], list)
                    else [detail["selected_answer"]]
                )
                for selected in selected_values:
                    reason = detail["why_wrong_answers"].get(selected)
                    if reason:
                        print(f"   Why '{selected}' is wrong: {reason}")
            print(f"   Review: {', '.join(detail['recommended_review'])}")


def _progress_report() -> None:
    progress = load_progress()
    mistakes = load_mistakes()["mistakes"]
    print(f"Attempts: {len(progress['attempts'])} | saved mistakes: {len(mistakes)}")
    if progress["attempts"]:
        recent = progress["attempts"][-1]
        print(f"Latest: {recent['score']}% ({recent['correct']}/{recent['total']}) — {recent['mode']}")
    if progress["weak_topics"]:
        print("Weak topics:")
        for item in progress["weak_topics"]:
            print(f"  {item['topic']}: {item['percentage']}% across {item['total']} questions")
    else:
        print("No weak topics recorded yet. Take the diagnostic exam.")


def _lab_command(path_value: str, database_value: str | None) -> None:
    path = Path(path_value)
    if not path.is_absolute():
        path = ROOT / "labs" / path
    database = Path(database_value) if database_value else DEFAULT_DB
    results = run_sql_file(path, database)
    for result in results:
        if result.get("columns"):
            print(f"\nStatement {result['statement_number']}: {result['statement']}")
            print(" | ".join(result["columns"]))
            for row in result["rows"][:20]:
                print(" | ".join(str(value) for value in row))
            if len(result["rows"]) > 20:
                print(f"... {len(result['rows']) - 20} more rows")
    print(f"\nExecuted {len(results)} statements against {database}.")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Database Monster certification-prep system")
    subparsers = parser.add_subparsers(dest="command", required=True)

    exam = subparsers.add_parser("exam", help="Run a random 35–45 question timed exam")
    exam.add_argument("--count", type=int)
    exam.add_argument("--minutes", type=int, default=50)
    exam.add_argument("--difficulty", action="append")
    exam.add_argument("--seed", type=int)

    configured = subparsers.add_parser("exam-file", help="Run a predefined exam")
    configured.add_argument("name", help="Example: diagnostic_exam")

    panic = subparsers.add_parser("panic", help="Run a quick 5–20 question quiz")
    panic.add_argument("--count", type=int, default=10)
    panic.add_argument("--topic", action="append")
    panic.add_argument("--seed", type=int)

    subparsers.add_parser("progress", help="Show scores and weak topics")
    subparsers.add_parser("reset-progress", help="Clear progress and mistake notebook")
    subparsers.add_parser("reset-db", help="Recreate the sample SQLite database")
    subparsers.add_parser("build-exams", help="Regenerate predefined exam JSON files")

    lab = subparsers.add_parser("run-lab", help="Run a SQLite lab file")
    lab.add_argument("path")
    lab.add_argument("--database")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if args.command == "exam":
        run_interactive_exam(create_random_exam(args.count, args.minutes, args.difficulty, seed=args.seed))
    elif args.command == "exam-file":
        run_interactive_exam(create_configured_exam(args.name))
    elif args.command == "panic":
        run_interactive_exam(create_panic_quiz(args.count, args.topic, args.seed))
    elif args.command == "progress":
        _progress_report()
    elif args.command == "reset-progress":
        reset_progress()
        print("Progress and mistake notebook reset.")
    elif args.command == "reset-db":
        reset_database()
        print(f"Recreated {DEFAULT_DB}")
    elif args.command == "build-exams":
        paths = write_default_exam_configs()
        print(f"Created {len(paths)} exams in {EXAMS_DIR}")
    elif args.command == "run-lab":
        _lab_command(args.path, args.database)
    return 0


if __name__ == "__main__":
    sys.exit(main())
